const express = require("express");
const router = express.Router();
const redis = require("../../shared/redis");

router.get("/", async (req, res) => {

  const workers = await redis.hgetall("workers");

  const parsed = await Promise.all(
    Object.entries(workers).map(async ([id, data]) => {

      const w = JSON.parse(data);

      const diff = Date.now() - w.lastSeen;

      let status;

      if (diff < 4000) status = "active";
      else if (diff < 10000) status = "idle";
      else status = "offline";

      if (diff > 30000) {
        await redis.hdel("workers", id);
      }

      return {
        workerId: id,
        status,
        jobsProcessed: w.jobsProcessed || 0,
        currentJobId: w.currentJobId,
        uptimeMs: w.uptimeMs
      };
    })
  );

  res.json(parsed);
});

module.exports = router;