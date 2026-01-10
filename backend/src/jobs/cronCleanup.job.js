const EmailLog = require("../models/EmailLog");

/**
 * Cron job to cleanup old logs
 */
const cronCleanupJob = async (job) => {
  console.log("Running daily cleanup...");

  // Delete logs older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await EmailLog.deleteMany({
    sentAt: { $lt: thirtyDaysAgo },
  });

  console.log(`Cleanup complete. Deleted ${result.deletedCount} old logs.`);
  return { deleted: result.deletedCount };
};

module.exports = { cronCleanupJob };
