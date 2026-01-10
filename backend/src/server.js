require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/mongo");
const { initScheduler } = require("./config/scheduler");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB (Mongoose)
    // We get the native DB object back for the scheduler
    const db = await connectDB();

    // 2. Initialize Scheduler
    const scheduler = await initScheduler(db);

    // 3. Start Scheduler
    await scheduler.start();
    console.log("✅ Scheduler started");

    // 4. Register Recurring Jobs (Cron)
    // Demonstrates Cron with Timezone
    await scheduler.schedule({
      name: "cron-cleanup",
      data: { type: "daily-cleanup" },
      repeat: {
        cron: "0 0 * * *", // Every midnight
        timezone: "UTC", // Enforce UTC to avoid drift
      },
    });
    console.log("✅ Registered daily cleanup cron job");

    // 5. Start Express Server
    app.listen(PORT, () => {
      console.log(`🚀 API Server running on port ${PORT}`);
    });

    // Graceful Shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Shutting down...");
      await scheduler.stop({ graceful: true });
      process.exit(0);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
