const express = require("express");
const router = express.Router();
const { getScheduler } = require("../config/scheduler");

// 1. One-Time Job Execution (Email)
router.post("/email", async (req, res) => {
  try {
    const scheduler = getScheduler();
    const { to, subject, body, priority } = req.body;

    // Demonstrate Priority (default 5 if not provided)
    // 1 (Urgent) -> 5 (Normal) -> 10 (Low)
    const job = await scheduler.schedule({
      name: "send-email",
      data: { to, subject, body },
      priority: priority || 5,
    });

    res.json({
      message: "Email job scheduled",
      jobId: job._id,
      priority: job.priority,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Per-Job Concurrency Limit (Report)
router.post("/report", async (req, res) => {
  try {
    const scheduler = getScheduler();
    const { reportType } = req.body;

    // We set concurrency to 2 in the job definition options
    // This allows only 2 'generate-report' jobs to run at once
    const job = await scheduler.schedule({
      name: "generate-report",
      data: { reportType, dateRange: "last-30-days" },
      concurrency: 2,
    });

    res.json({
      message: "Report generation scheduled (Max concurrency: 2)",
      jobId: job._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Retry With Backoff
router.post("/retry-demo", async (req, res) => {
  try {
    const scheduler = getScheduler();
    const { succeedAfterAttempt = 3 } = req.body;

    const job = await scheduler.schedule({
      name: "retry-demo",
      data: { succeedAfterAttempt },
      retry: {
        maxAttempts: 5,
        delay: 2000, // Fixed delay (or use function for exponential)
      },
    });

    res.json({
      message: "Retry demo scheduled",
      jobId: job._id,
      note: `Will fail ${succeedAfterAttempt - 1} times, then succeed.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
