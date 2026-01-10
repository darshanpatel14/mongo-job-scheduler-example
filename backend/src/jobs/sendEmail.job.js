const { sleep } = require("../utils/sleep");
const EmailLog = require("../models/EmailLog");

/**
 * Simulates sending an email
 */
const sendEmailJob = async (job) => {
  const { to, subject, body } = job.data;

  console.log(`Sending email to ${to}...`);

  // Simulate network delay
  await sleep(1000);

  // Log to database (demonstrating Mongoose usage inside job)
  await EmailLog.create({
    to,
    subject,
    jobId: job._id.toString(),
  });

  console.log(`Email sent to ${to}!`);

  // Return result (optional, useful for logging)
  return { sent: true, timestamp: new Date() };
};

module.exports = { sendEmailJob };
