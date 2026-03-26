# taskflow

> Distributed background job processing system — Node.js · Redis · MongoDB

A production-pattern system that separates long-running tasks from the API request cycle using priority queues and scalable worker processes.

---

## The problem

When a user places an order or initiates a payment, the server needs to send emails, update ledgers, trigger webhooks, generate receipts — all at once. Doing this inside the API request blocks the user and kills response time.

TaskFlow returns a response in under 50ms and offloads everything else to background workers via Redis queues. Same pattern used in production at fintech and e-commerce companies.

---

## Architecture

```
Client
  │
  ▼
Producer API  ──────────────────────  Express / Node.js
  │
  ├── saves job metadata ──────────►  MongoDB
  │
  └── pushes to queue ─────────────►  Redis
                                         │
                                         │  jobs:high
                                         │  jobs:normal
                                         │
                                         ▼
                                      Worker Process
                                         │
                                         ├── SEND_EMAIL
                                         ├── GENERATE_REPORT
                                         ├── EXPORT_CSV
                                         └── RESIZE_IMAGE
                                         │
                                         └── updates status ──► MongoDB
```

Workers are stateless — scale horizontally by running multiple processes. Each independently pulls from the same Redis queue.

---

## Tech stack

| Layer | Technology |
|---|---|
| API server | Node.js, Express |
| Job queue | Redis (Redis Cloud) |
| Database | MongoDB (Mongoose) |
| Worker | Node.js child process |
| Monitoring | WebSocket + React |
| Load testing | k6 |

---

## Features

**Queue**
- Priority queues — `jobs:high` processed before `jobs:normal`
- BRPOP blocking pull — zero CPU usage while idle
- Async submission — API returns `jobId` instantly, client never waits

**Reliability**
- Job status lifecycle — `queued → processing → completed / failed`
- Retry with exponential backoff — failed jobs automatically retried
- Dead-letter queue — permanently failed jobs isolated to `jobs:dead`
- Poison pill detection — jobs that crash workers repeatedly are quarantined

**Observability**
- `/stats` endpoint — queue depth, throughput, failure rate
- WebSocket monitoring — live job status pushed to dashboard
- React dashboard — visual overview of workers and queue state

---

## Job types

| Type | Queue | Simulated duration |
|---|---|---|
| `SEND_EMAIL` | high | 500ms |
| `GENERATE_REPORT` | normal | 2000ms |
| `EXPORT_CSV` | normal | 1500ms |
| `RESIZE_IMAGE` | normal | 800ms |

Job execution is simulated with delays. The infrastructure — queueing, retries, status tracking, dead-letter handling — is real. In production, swap the handler body for actual logic (Nodemailer, Sharp, PDFKit, etc).

---

## Project structure

```
taskflow/
├── producer/
│   ├── server.js
│   └── routes/
│       └── jobs.js          POST /jobs · GET /stats
├── worker/
│   ├── worker.js            BRPOP loop and job dispatch
│   └── handlers/
│       ├── sendEmail.js
│       ├── generateReport.js
│       ├── exportCsv.js
│       └── resizeImage.js
├── shared/
│   ├── redis.js             Redis Cloud connection
│   └── mongo.js             Mongoose connection
├── dashboard/               React monitoring UI
├── tests/
│   └── load.js              k6 load test
├── .env.example
└── package.json
```

---

## Getting started

Prerequisites — Node.js v18+, Redis Cloud account, MongoDB Atlas account

```bash
git clone https://github.com/vinayRamola/taskflow.git
cd taskflow
npm install
cp .env.example .env
```

Fill in `.env`:

```env
REDIS_URL=redis://your-redis-cloud-url:port
MONGO_URI=mongodb+srv://your-mongo-atlas-url
PORT=3000
```

Run the API:

```bash
node producer/server.js
```

Run a worker:

```bash
node worker/worker.js
```

Run multiple worker processes in separate terminals to scale horizontally.

---

## API reference

Submit a job:

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SEND_EMAIL",
    "payload": { "to": "user@example.com", "subject": "Welcome" },
    "priority": "high"
  }'
```

```json
{
  "jobId": "a1b2c3d4-e5f6-...",
  "status": "queued",
  "message": "Job submitted successfully"
}
```

Check job status:

```bash
curl http://localhost:3000/jobs/:jobId
```

Queue stats:

```bash
curl http://localhost:3000/stats
```

---

## Load testing

```bash
k6 run tests/load.js
```

| Metric | Result |
|---|---|
| Concurrent users | 100 VUs |
| Throughput | ~2,400 req/s |
| p95 latency | < 75ms |
| Failure rate | 3.2% |

---

## Design decisions

**Redis over a database queue**
Redis lists with BRPOP are O(1) push/pop with native blocking consumer support. A DB-backed queue needs polling — wasted CPU and added latency.

**BRPOP over polling**
Workers sleep until a job arrives. No busy-waiting, no artificial delay, no wasted cycles.

**Two separate priority queues**
OTP emails and payment confirmations cannot wait behind a 30-second report generation. Worker checks `jobs:high` first on every cycle.

**MongoDB for persistence**
Redis is ephemeral. A restart loses queue state. Mongo gives durability, job history, and debuggable failure records.

---

## What production would add

- Auth and rate limiting on the Producer API
- Job scheduling (run at a future timestamp)
- Prometheus metrics + Grafana dashboard
- Kubernetes with worker auto-scaling based on queue depth
- Idempotency keys to prevent duplicate execution

---

## Author

Vinay Chand Ramola

[LinkedIn](https://www.linkedin.com/in/vinay-chand-ramola-970061223/) · [LeetCode](https://leetcode.com/u/vinaychandramola123/) · [GitHub](https://github.com/vinayRamola)