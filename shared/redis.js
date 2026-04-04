const Redis = require("ioredis");
const logger = require("./logger");

const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
  logger.system.redisConnected();
});

redis.on("error", (err) => {
  logger.error("Redis error", { error: err.message });
});

module.exports = redis;