import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// ─── Custom Metrics────
const jobQueueLatency = new Trend("job_queue_latency_ms", true);
const jobFailureRate  = new Rate("job_failure_rate");
const jobsSubmitted   = new Counter("jobs_submitted");

// ─── Test Configuration
export const options = {
  stages: [
    { duration: "10s", target: 20  },   // ramp up
    { duration: "40s", target: 1000},   // hold at 100 VUs
    { duration: "10s", target: 0   },   // ramp down
  ],
  thresholds: {
    http_req_duration:    ["p(50)<20", "p(95)<50", "p(99)<100"],  // ms
    job_queue_latency_ms: ["p(99)<50"],
    job_failure_rate:     ["rate<0.01"],   // <1% failures
    http_req_failed:      ["rate<0.01"],
  },
};

// ─── Job Types Pool────
const JOB_TYPES = [
  { type: "send_email",       payload: { userId: 123, template: "welcome" } },
  { type: "generate_report",  payload: { reportId: "rpt_456", format: "pdf" } },
  { type: "process_image",    payload: { imageId: "img_789", width: 800 } },
  { type: "payment_webhook",  payload: { transactionId: "txn_abc", amount: 99.99 } },
  { type: "run_analytics",    payload: { eventId: "evt_xyz", window: "1h" } },
];

const PRIORITIES = ["high", "normal"];

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// ─── Main Test Function
export default function () {
  const job      = JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)];
  const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];

  const payload = JSON.stringify({
    type:     job.type,
    payload:  job.payload,
    priority: priority,
  });

  const params = {
    headers: { "Content-Type": "application/json" },
    timeout: "5s",
  };

  const start = Date.now();
  const res   = http.post(`${BASE_URL}/jobs`, payload, params);
  const latency = Date.now() - start;

  // ─── Checks
  const success = check(res, {
    "status is 201":        (r) => r.status === 201,
    "has jobId":            (r) => {
      try { return !!JSON.parse(r.body).jobId; } catch { return false; }
    },
    "status is queued":     (r) => {
      try { return JSON.parse(r.body).status === "queued"; } catch { return false; }
    },
    "response time < 50ms": () => latency < 50,
  });

  // ─── Record Metrics
  jobQueueLatency.add(latency);
  jobFailureRate.add(!success);
  jobsSubmitted.add(1);

  sleep(0.1); // 100ms think time between requests
}

// ─── Summary Hook──────
export function handleSummary(data) {
  const passed = data.metrics.http_req_failed.values.rate < 0.01;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  TaskFlow Load Test Summary");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Jobs Submitted : ${data.metrics.jobs_submitted.values.count}`);
  console.log(`  Throughput     : ~${Math.round(data.metrics.jobs_submitted.values.count / 60)} jobs/sec`);
  console.log(`  P50 Latency    : ${Math.round(data.metrics.http_req_duration.values["p(50)"])} ms`);
  console.log(`  P95 Latency    : ${Math.round(data.metrics.http_req_duration.values["p(95)"])} ms`);
  console.log(`  P99 Latency    : ${Math.round(data.metrics.http_req_duration.values["p(99)"])} ms`);
  console.log(`  Failure Rate   : ${(data.metrics.job_failure_rate.values.rate * 100).toFixed(2)}%`);
  console.log(`  Result         : ${passed ? "✅ PASSED" : "❌ FAILED"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  return {
    "tests/results/summary.json": JSON.stringify(data, null, 2),
    stdout: "",
  };
}