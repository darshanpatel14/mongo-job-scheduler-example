const express = require("express");
const jobsRoutes = require("./routes/jobs.routes");
const schedulerRoutes = require("./routes/scheduler.routes");

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Mount generic scheduler routes (for UI)
// These provide GET /jobs, /jobs/stats, etc.
app.use("/", schedulerRoutes);

// Mount application-specific job triggers
app.use("/trigger", jobsRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

module.exports = app;
