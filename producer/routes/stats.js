const express = require("express");
const router = express.Router();
const Job = require("../models/job");

router.get("/", async (req, res) => {

  try {

    const queued = await Job.countDocuments({ status: "queued" });
    const processing = await Job.countDocuments({ status: "processing" });
    const completed = await Job.countDocuments({ status: "completed" });
    const failed = await Job.countDocuments({ status: "failed" });

    res.json({
      queued,
      processing,
      completed,
      failed
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to fetch stats" });

  }

});

module.exports = router;