// shared/logger.js
const { createLogger, format, transports } = require("winston");

const { combine, timestamp, errors, json, colorize, printf } = format;

// ─── Pretty Format (development) 
const prettyFormat = printf(({ level, message, timestamp, jobId, workerId, ...meta }) => {
  let line = `${timestamp} [${level}] ${message}`;
  if (jobId)    line += ` | jobId=${jobId}`;
  if (workerId) line += ` | worker=${workerId}`;

  const rest = Object.keys(meta).filter((k) => k !== "stack" && k !== "service");
  if (rest.length) line += ` | ${rest.map((k) => `${k}=${JSON.stringify(meta[k])}`).join(" ")}`;
  if (meta.stack) line += `\n${meta.stack}`;

  return line;
});

// ─── Build Logger 
const isPretty = (process.env.LOG_FORMAT || "pretty") === "pretty";

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "taskflow" },
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    isPretty
      ? combine(colorize({ level: true }), prettyFormat)
      : json()
  ),
  transports: [new transports.Console()],
  exitOnError: false,
});

// ─── Job Lifecycle Helpers 
logger.job = {
  queued(jobId, type, priority) {
    logger.info("Job queued", { jobId, type, priority, event: "queued" });
  },
  processing(jobId, workerId, attempt) {
    logger.info("Job processing", { jobId, workerId, attempt, event: "processing" });
  },
  completed(jobId, workerId, latencyMs) {
    logger.info("Job completed", { jobId, workerId, latencyMs, event: "completed" });
  },
  failed(jobId, workerId, error, attempt) {
    logger.warn("Job failed", {
      jobId,
      workerId,
      attempt,
      error: error.message,
      event: "failed",
    });
  },
  retrying(jobId, attempt, maxRetries, delayMs) {
    logger.warn("Job retrying", { jobId, attempt, maxRetries, delayMs, event: "retrying" });
  },
  deadLettered(jobId, reason) {
    logger.error("Job dead lettered", { jobId, reason, event: "dead_lettered" });
  },
  poisonPill(jobId, errorHash) {
    logger.error("Poison pill detected — retries halted", {
      jobId,
      errorHash,
      event: "poison_pill",
    });
  },
  replayed(jobId, triggeredBy) {
    logger.info("Job replayed from dead letter queue", {
      jobId,
      triggeredBy,
      event: "replayed",
    });
  },
};

// ─── System Helpers 
logger.system = {
  workerStarted(workerId) {
    logger.info("Worker started", { workerId, event: "worker_started" });
  },
  workerStopped(workerId, reason) {
    logger.info("Worker stopped", { workerId, reason, event: "worker_stopped" });
  },
  redisConnected() {
    logger.info("Redis connected", { event: "redis_connected" });
  },
  mongoConnected() {
    logger.info("MongoDB connected", { event: "mongo_connected" });
  },
  serverStarted(port) {
    logger.info(`Producer API listening on port ${port}`, {
      port,
      event: "server_started",
    });
  },
};

module.exports = logger;