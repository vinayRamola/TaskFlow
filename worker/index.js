require("dotenv").config();

const redis = require("../shared/redis");
const connectMongo = require("../shared/mongo");
const Job = require("../producer/models/job");

connectMongo();

async function processJob(jobData) {

  // Simulate random failure
  if (Math.random() < 0.5) {
    throw new Error("Simulated job failure");
  }

  // Simulate work
  await new Promise((r) => setTimeout(r, 2000));

}

async function retryJob(jobData, retryCount) {
  const delay = Math.pow(2, retryCount) * 1000;
  console.log(`Retrying job ${jobData.jobId} in ${delay}ms (attempt ${retryCount})`);

  // Actually await the delay — don't use setTimeout
  await new Promise((r) => setTimeout(r, delay));

  const queue = jobData.priority === "high" ? "jobs:high" : "jobs:normal";

  // Pass updated retryCount inside jobData so worker sees it
  const updatedJobData = { ...jobData, retryCount };
  await redis.lpush(queue, JSON.stringify(updatedJobData));

  console.log(`Job ${jobData.jobId} requeued after ${delay}ms`);
}

async function startWorker() {

  console.log("Worker started");

  while (true) {

    let jobData;

    try {

      const job = await redis.brpop("jobs:high", "jobs:normal", 0);

      jobData = JSON.parse(job[1]);
      const jobId = jobData.jobId;

      console.log("Processing job:", jobId);

      // Update job → processing
      await Job.findOneAndUpdate(
        { jobId },
        {
          status: "processing",
          startedAt: new Date()
        }
      );

      await processJob(jobData);

      // Update job → completed
      await Job.findOneAndUpdate(
        { jobId },
        {
          status: "completed",
          completedAt: new Date()
        }
      );

      console.log("Job completed:", jobId);

    } catch (error) {

      if (!jobData) {
        console.error("Worker error:", error);
        continue;
      }

      const jobId = jobData.jobId;

      console.log("Job failed:", jobId);

      const jobDoc = await Job.findOne({ jobId });

      const retryCount = jobDoc.retryCount + 1;

      if (retryCount <= jobDoc.maxRetries) {

        await Job.findOneAndUpdate(
          { jobId },
          { retryCount }
        );

        await retryJob(jobData, retryCount);

      } else {

        await Job.findOneAndUpdate(
          { jobId },
          {
            status: "failed",
            failedAt: new Date()
          }
        );

        await redis.lpush("jobs:dead", JSON.stringify(jobData));

        console.log("Job moved to dead-letter queue:", jobId);

      }

    }

  }

}

startWorker();