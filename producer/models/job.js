const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({

  jobId: String,
  type: String,
  payload: Object,
  priority: String,

  status: {
    type: String,
    default: "queued"
  },

  retryCount: {
    type: Number,
    default: 0
  },

  maxRetries: {
    type: Number,
    default: 3
  },

  workerId: String,

  latencyMs: Number,

  startedAt: Date,
  completedAt: Date,
  failedAt: Date

}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);