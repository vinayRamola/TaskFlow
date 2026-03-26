require("dotenv").config();

const redis = require("../shared/redis");
const connectMongo = require("../shared/mongo");
const Job = require("../producer/models/job");

connectMongo();

async function startWorker() {

  console.log("Worker started");

  while (true) {

    try {

      const job = await redis.brpop("jobs:high", "jobs:normal", 0);

      const jobData = JSON.parse(job[1]);

      const jobId = jobData.jobId;

      console.log("Processing job:", jobId);

      // UPDATE STATUS → processing
      await Job.findOneAndUpdate(
        { jobId },
        {
          status: "processing",
          startedAt: new Date()
        }
      );

      // Simulate job execution
      await new Promise(r => setTimeout(r, 2000));

      // UPDATE STATUS → completed
      await Job.findOneAndUpdate(
        { jobId },
        {
          status: "completed",
          completedAt: new Date()
        }
      );

      console.log("Job completed:", jobId);

    } catch (error) {

      console.error("Job failed:", error);

    }

  }

}

startWorker();