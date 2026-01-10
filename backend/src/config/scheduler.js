const { Scheduler, MongoJobStore } = require("mongo-job-scheduler");
const mongoose = require("mongoose");
const { sendEmailJob } = require("../jobs/sendEmail.job");
const { generateReportJob } = require("../jobs/generateReport.job");
const { retryDemoJob } = require("../jobs/retryDemo.job");
const { cronCleanupJob } = require("../jobs/cronCleanup.job");

let scheduler;

const initScheduler = async (db) => {
  const store = new MongoJobStore(db);

  scheduler = new Scheduler({
    store,
    workers: process.env.WORKERS || 3,
    pollIntervalMs: process.env.POLL_INTERVAL_MS || 1000,
    lockTimeoutMs: process.env.LOCK_TIMEOUT_MS || 60000,

    // Global Error Handler
    onError: (err) => {
      console.error("Scheduler Error:", err);
    },

    // Job Handler Routing
    handler: async (job) => {
      console.log(`[Job: ${job.name}] Processing... ID: ${job._id}`);

      switch (job.name) {
        case "send-email":
          return await sendEmailJob(job);

        case "generate-report":
          return await generateReportJob(job);

        case "retry-demo":
          return await retryDemoJob(job);

        case "cron-cleanup":
          return await cronCleanupJob(job);

        default:
          console.warn(`Unknown job: ${job.name}`);
      }
    },
  });

  scheduler.on("job:complete", (job) => {
    console.log(`[Job: ${job.name}] ✅ Completed`);
  });

  scheduler.on("job:fail", ({ job, error }) => {
    console.error(`[Job: ${job.name}] ❌ Failed: ${error.message}`);
  });

  return scheduler;
};

const getScheduler = () => {
  if (!scheduler) {
    throw new Error("Scheduler not initialized");
  }
  return scheduler;
};

module.exports = { initScheduler, getScheduler };
