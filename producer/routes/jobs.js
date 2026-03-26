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

module.exports = router;