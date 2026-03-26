require("dotenv").config();

const redis = require("../shared/redis");

async function startWorker() {

    console.log("Worker started");

    while (true) {

        const job = await redis.brpop("jobs:high", "jobs:normal", 0);

        const jobData = JSON.parse(job[1]);

        console.log("Processing job:", jobData);

        await new Promise(r => setTimeout(r, 2000));

        console.log("Job completed:", jobData.jobId);

    }

}

startWorker();