const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({

    jobId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    payload: { type: Object },

    priority: { type: String, default: "normal" },

    status: { type: String, default: "queued" },

    retryCount: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model("Job", jobSchema);