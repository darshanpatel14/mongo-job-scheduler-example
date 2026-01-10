# Mongo Job Scheduler Example

A production-ready example repository demonstrating how to build a robust, distributed job scheduling system using [mongo-job-scheduler](https://github.com/darshanpatel14/mongo-job-scheduler).

This example implements a scalable backend service with Express and Mongoose, and integrates the [Mongo Scheduler UI](https://github.com/darshanpatel14/mongo-scheduler-ui) for administration.

## 🚀 Features Demonstrated

- **Distributed Job Execution**: Run multiple backend workers coordinated by MongoDB.
- **Job Priorities**: Schedule urgent jobs to be processed before others (1-10 scale).
- **Concurrency Control**: Limit the number of specific jobs running simultaneously.
- **Retries with Backoff**: Automatically retry failed jobs with configurable delays.
- **Cron Scheduling**: Run recurring tasks (e.g., daily cleanup) with Timezone support.
- **Crash Recovery**: Jobs are automatically recovered if a worker process crashes.
- **Admin UI**: Visualize and manage jobs via a React dashboard.

## 🏗️ Architecture

The system consists of three main components:

1.  **Backend Service**: Node.js/Express app that schedules and processes jobs. It uses `mongo-job-scheduler` to poll MongoDB for tasks.
2.  **Scheduler UI**: A standalone frontend service that connects to the same MongoDB to provide read/write access to job data.
3.  **MongoDB**: The single source of truth for job state, locks, and application data.

## 🛠️ Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)

### Running with Docker (Recommended)

Start the entire stack (Backend + UI + Mongo):

```bash
docker-compose up
```

> **Note**: This setup uses the public Docker image `darshanbhut14/mongo-scheduler-ui:latest`. Ensure this image is pulled or available.

- **API**: `http://localhost:3000`
- **Dashboard**: `http://localhost:5173`

Scale the backend to simulate distributed workers:

```bash
docker-compose up --scale backend=3
```

### Running Locally

1.  Start MongoDB (e.g., via Docker):
    ```bash
    docker run -d -p 27017:27017 mongo:6.0
    ```
2.  Install dependencies:
    ```bash
    cd backend
    npm install
    ```
3.  Start the backend:
    ```bash
    # Create .env from example
    cp .env.example .env
    npm start
    ```

## 📚 API Examples

Trigger jobs using simple HTTP requests.

### 1. Simple One-Time Job (Email)

Schedule an email delivery.

```bash
curl -X POST http://localhost:3000/trigger/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Welcome!",
    "body": "Hello world"
  }'
```

### 2. High Priority Job

Schedule an urgent job (Priority 1) that skips the queue.

```bash
curl -X POST http://localhost:3000/trigger/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "admin@example.com",
    "subject": "System Alert",
    "priority": 1
  }'
```

_(Lower number = Higher priority)_

### 3. Concurrency Limited Job (Report)

Only 2 report jobs can run at the same time. If you trigger 10, 2 run immediately, 8 wait.

```bash
curl -X POST http://localhost:3000/trigger/report \
  -H "Content-Type: application/json" \
  -d '{ "reportType": "finance" }'
```

### 4. Retry Logic Demo

Schedule a job designed to fail 3 times before succeeding. Watch it retry automatically.

```bash
curl -X POST http://localhost:3000/trigger/retry-demo \
  -H "Content-Type: application/json" \
  -d '{ "succeedAfterAttempt": 3 }'
```

## 📖 Key Concepts

### Job Handler

The core of the system is the `handler` function in `src/config/scheduler.js`. It receives a `job` object and routes it to the appropriate function.

```javascript
handler: async (job) => {
  switch (job.name) {
    case "send-email":
      return await sendEmailJob(job);
    case "generate-report":
      return await generateReportJob(job);
    // ...
  }
};
```

### Crash Recovery

If a worker process crashes (e.g., Out of Memory) while processing a job:

1.  The job remains "locked" in MongoDB until `lockTimeoutMs` expires.
2.  Other workers notice the expired lock.
3.  They "steal" the job and re-execute it.

This ensures zero job loss, even in unstable environments.

### Locking mechanism

`mongo-job-scheduler` uses `findOneAndUpdate` to atomically lock jobs.

- **Poll Interval**: How often workers look for work (default 1s).
- **Lock Timeout**: Max time a job can run before being considered "stuck" (default 60s).

## 🖥️ Scheduler UI

The dashboard runs on `http://localhost:5173`.
It allows you to:

- View all Pending, Running, and Completed jobs.
- Inspect job data and failure reasons.
- Cancel or manually Trigger jobs.
- View real-time statistics.

_Note: The UI connects directly to the MongoDB database._
