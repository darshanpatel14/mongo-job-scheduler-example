const express = require("express");
const router = express.Router();
const { getScheduler } = require("../config/scheduler");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

/**
 * GENERIC SCHEDULER API
 * Used by mongo-scheduler-ui and for general administration
 */

// Get all jobs with filtering
router.get("/jobs", async (req, res) => {
  try {
    const scheduler = getScheduler();
    const {
      status,
      name,
      limit = 100,
      skip = 0,
      sort = "updatedAt",
      order = "desc",
    } = req.query;

    // Build query from filters
    const query = {
      ...(status && {
        status: status.includes(",") ? status.split(",") : status,
      }),
      ...(name && { name }),
      limit: Number(limit),
      skip: Number(skip),
      sort: { field: sort, order },
    };

    const jobs = await scheduler.getJobs(query);
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get job statistics
// MUST be defined before /jobs/:id
router.get("/jobs/stats", async (req, res) => {
  try {
    const scheduler = getScheduler();
    // Fetch all jobs to count (optimized in real apps with aggregate, but getJobs is fine for example)
    // Note: getJobs without limit defaults to 100 in some versions, so we explicitly ask for more if needed,
    // or better, implement a stats method if exposed. The library exposes storage, but let's stick to public API if possible.
    // Actually, mongo-job-scheduler likely exposes the internal store or we can use mongoose directly.
    // Let's use generic list for now, assuming example scale.
    // In prod, use `db.collection('scheduler_jobs').countDocuments(...)`

    // Using the store directly for efficiency if available, else scheduler.getJobs
    // Scheduler instance has .store
    const allJobs = await scheduler.getJobs({ limit: 10000 });

    const stats = {
      total: allJobs.length,
      pending: allJobs.filter((j) => j.status === "pending").length,
      running: allJobs.filter((j) => j.status === "running").length,
      completed: allJobs.filter((j) => j.status === "completed").length,
      failed: allJobs.filter((j) => j.status === "failed").length,
      cancelled: allJobs.filter((j) => j.status === "cancelled").length,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single job by ID
router.get("/jobs/:id", async (req, res) => {
  try {
    const scheduler = getScheduler();
    if (!ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Invalid ID" });

    const job = await scheduler.getJob(new ObjectId(req.params.id));
    if (!job) return res.status(404).json({ error: "Job not found" });

    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update/Edit Job
router.put("/jobs/:id", async (req, res) => {
  try {
    const scheduler = getScheduler();
    if (!ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Invalid ID" });

    const { id } = req.params;
    const { data, repeat, runAt, retry, priority, concurrency, dedupeKey } =
      req.body;

    // Check existence
    const existingJob = await scheduler.getJob(new ObjectId(id));
    if (!existingJob) return res.status(404).json({ error: "Job not found" });

    const updates = {};
    if (data !== undefined) updates.data = data;
    if (repeat !== undefined) updates.repeat = repeat;
    if (retry !== undefined) updates.retry = retry;
    if (priority !== undefined) updates.priority = priority;
    if (concurrency !== undefined) updates.concurrency = concurrency;
    if (dedupeKey !== undefined) updates.dedupeKey = dedupeKey;
    if (runAt) updates.nextRunAt = new Date(runAt);

    await scheduler.updateJob(new ObjectId(id), updates);

    const updated = await scheduler.getJob(new ObjectId(id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retry Job
router.post("/jobs/:id/retry", async (req, res) => {
  try {
    const scheduler = getScheduler();
    if (!ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Invalid ID" });

    const job = await scheduler.getJob(new ObjectId(req.params.id));
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Reset attempts and schedule for now
    await scheduler.updateJob(new ObjectId(req.params.id), {
      nextRunAt: new Date(),
      attempts: 0,
    });

    res.json({ message: "Job queued for retry" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel Job
router.post("/jobs/:id/cancel", async (req, res) => {
  try {
    const scheduler = getScheduler();
    if (!ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Invalid ID" });

    await scheduler.cancel(new ObjectId(req.params.id));
    res.json({ message: "Job cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Job (Hard delete)
router.delete("/jobs/:id", async (req, res) => {
  try {
    const scheduler = getScheduler(); // To get access to store or db?
    if (!ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Invalid ID" });

    // The scheduler library might not expose a direct delete method in public API
    // We can use the store or Mongoose directly
    // Using scheduler.store if available or fallback to mongoose
    const db = mongoose.connection.db;
    const result = await db
      .collection("scheduler_jobs")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Job not found" });

    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
