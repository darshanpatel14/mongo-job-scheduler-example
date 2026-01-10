/**
 * Demonstrates retry logic by failing initially
 */
const retryDemoJob = async (job) => {
  const { succeedAfterAttempt } = job.data;
  const currentAttempt = job.attempts; // 0-indexed ?? No, library uses 1-indexed usually or 0?
  // Checking library code (not visible now but safer to assume attempts property exists)
  // Actually, standard scheduler usually passes attempts.
  // user request: "Logs attempt count"

  console.log(`Processing retry-demo job. Attempt: ${currentAttempt}`);

  if (currentAttempt < succeedAfterAttempt) {
    throw new Error(
      `Simulated failure at attempt ${currentAttempt}. Will succeed at ${succeedAfterAttempt}`
    );
  }

  console.log("Retry demo succeeded!");
  return { attempts: currentAttempt };
};

module.exports = { retryDemoJob };
