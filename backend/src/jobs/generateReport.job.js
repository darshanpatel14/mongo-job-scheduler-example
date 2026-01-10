const { sleep } = require("../utils/sleep");

/**
 * Simulates a heavy report generation job
 * Demonstrates Concurrency Limits
 */
const generateReportJob = async (job) => {
  const { reportType, dateRange } = job.data;

  console.log(`Generating ${reportType} report...`);

  // Simulate heavy processing (5 seconds)
  await sleep(5000);

  console.log(`Report ${reportType} generated!`);

  return {
    path: `/reports/${reportType}_${Date.now()}.pdf`,
    size: "2.5MB",
  };
};

module.exports = { generateReportJob };
