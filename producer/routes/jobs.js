const express = require("express");
const { v4: uuidv4 } = require("uuid");
const redis = require("../../shared/redis");
const Job = require("../models/job");

const router = express.Router();

router.post("/", async (req, res) => {

    const { type, payload, priority } = req.body;

    const jobId = uuidv4();

    await Job.create({
        jobId,
        type,
        payload,
        priority,
        status: "queued"
    });

    const queue = priority === "high" ? "jobs:high" : "jobs:normal";

    await redis.lpush(queue, JSON.stringify({ jobId, type, payload }));

    res.status(201).json({ jobId, status: "queued" });

});

router.get("/", async (req, res) => {

  try {

    const limit = parseInt(req.query.limit) || 20;

    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(jobs);

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to fetch jobs" });

  }

});

router.get("/dead-letter", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "dead-lettered" })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(jobs);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch dead-letter jobs" });
  }
});

router.post("/:jobId/replay", async (req, res) => {

  const { jobId } = req.params;

  const job = await Job.findOne({ jobId });

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  if (job.status !== "dead-lettered") {
    return res.status(400).json({ error: "Job is not dead-lettered" });
  }

  const queue = job.priority === "high" ? "jobs:high" : "jobs:normal";

  await redis.lpush(queue, JSON.stringify({
    jobId: job.jobId,
    type: job.type,
    payload: job.payload,
    priority: job.priority
  }));

  await Job.updateOne(
    { jobId },
    { $set: { status: "queued", retryCount: 0 } }
  );

  res.json({ message: "Job replayed successfully" });

});

module.exports = router;