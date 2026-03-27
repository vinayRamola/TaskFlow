require("dotenv").config();

const redis = require("../shared/redis");
const connectMongo = require("../shared/mongo");
const Job = require("../producer/models/job");
const crypto = require("crypto"); 

connectMongo();

const workerId = process.env.WORKER_ID || `worker-${Math.floor(Math.random()*1000)}`;

async function processJob(jobData) {

  if (Math.random() < 0.8) {
    throw new Error("Simulated job failure");
  }

  await new Promise((r) => setTimeout(r, 2000));

}

async function retryJob(jobData, retryCount) {

  const delay = Math.pow(2, retryCount) * 1000;

  console.log(`Retrying job ${jobData.jobId} in ${delay}ms (attempt ${retryCount})`);

  await new Promise((r) => setTimeout(r, delay));

  const queue = jobData.priority === "high" ? "jobs:high" : "jobs:normal";

  const updatedJobData = { ...jobData, retryCount };

  await redis.lpush(queue, JSON.stringify(updatedJobData));

  console.log(`Job ${jobData.jobId} requeued after ${delay}ms`);

}

async function startWorker() {

  console.log(`Worker started: ${workerId}`);

  while (true) {

    let jobData;

    try {

      const job = await redis.brpop("jobs:high", "jobs:normal", 0);

      jobData = JSON.parse(job[1]);

      const jobId = jobData.jobId;

      console.log("Processing job:", jobId);

      const startTime = Date.now();

      await Job.findOneAndUpdate(
        { jobId },
        {
          status: "processing",
          workerId: workerId,
          startedAt: new Date()
        }
      );

      await processJob(jobData);

      const latency = Date.now() - startTime;

      await Job.findOneAndUpdate(
        { jobId },
        {
          status: "completed",
          workerId: workerId,
          completedAt: new Date(),
          latencyMs: latency
        }
      );

      console.log(`Job completed: ${jobId} in ${latency}ms`);

    } catch (error) {

      if (!jobData) {
        console.error("Worker error:", error);
        continue;
      }

      const jobId = jobData.jobId;

      console.log("Job failed:", jobId);

      // ---------------- POISON PILL DETECTION ----------------

      const errorSig = crypto
        .createHash("md5")
        .update(error.message)
        .digest("hex");

      const key = `job:${jobId}:errors`;

      await redis.lpush(key, errorSig);
      await redis.ltrim(key, 0, 2); // keep last 3 errors

      const errors = await redis.lrange(key, 0, -1);

      const allSame =
        errors.length >= 3 && errors.every(sig => sig === errorSig);

      if (allSame) {

        await Job.findOneAndUpdate(
          { jobId },
          {
            status: "poison-pill",
            workerId: workerId,
            errorMessage: error.message
          }
        );

        console.log("Poison pill detected:", jobId);

        continue;
      }

      // --------------------------------------------------------

      const jobDoc = await Job.findOne({ jobId });

      const retryCount = jobDoc.retryCount + 1;

      if (retryCount <= jobDoc.maxRetries) {

        await Job.findOneAndUpdate(
          { jobId },
          {
            retryCount,
            workerId: workerId
          }
        );

        await retryJob(jobData, retryCount);

      } else {

        await Job.findOneAndUpdate(
          { jobId },
          {
            status: "dead-lettered",
            workerId: workerId,
            failedAt: new Date(),
            errorMessage: error.message
          }
        );

        await redis.lpush("jobs:dead-letter", JSON.stringify(jobData));

        console.log("Job moved to dead-letter queue:", jobId);

      }

    }

  }

}

startWorker();