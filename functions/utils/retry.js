const { logError, isTransientError, SEVERITY } = require("./logger");

/**
 * Retry logic with exponential backoff for AinaAi Cloud Functions
 * Handles transient failures gracefully while respecting permanent errors
 */

// Retry configuration
const RETRY_CONFIG = {
  // Maximum number of retry attempts
  MAX_RETRIES: 3,
  // Initial backoff in milliseconds (2 seconds)
  INITIAL_BACKOFF_MS: 2000,
  // Backoff multiplier (exponential: 2s, 4s, 8s)
  BACKOFF_MULTIPLIER: 2,
  // Maximum backoff to prevent excessive delays
  MAX_BACKOFF_MS: 32000,
};

/**
 * Calculate exponential backoff delay
 * @param {number} attemptNumber - Current attempt number (0-indexed)
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attemptNumber) {
  const delay = RETRY_CONFIG.INITIAL_BACKOFF_MS * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attemptNumber);
  return Math.min(delay, RETRY_CONFIG.MAX_BACKOFF_MS);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * Automatically retries on transient errors, gives up on permanent errors
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {string} options.context - Context for logging (e.g., "YouCam API poll")
 * @param {string} options.userId - User ID for error logging
 * @param {number} options.maxRetries - Override default max retries
 * @returns {Promise<any>} Result from function
 *
 * @example
 * const result = await retryWithBackoff(
 *   () => callYouCamAPI(payload),
 *   { context: "analyzeSkin", userId: "user123" }
 * );
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    context = "unknown",
    userId = "system",
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt the function
      const result = await fn();
      if (attempt > 0) {
        console.log(`[Retry] ${context}: Succeeded on attempt ${attempt + 1}`);
      }
      return result;
    } catch (error) {
      lastError = error;

      // Check if error is permanent
      if (!isTransientError(error)) {
        console.error(`[Retry] ${context}: Permanent error, not retrying - ${error.message}`);
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === maxRetries) {
        console.error(`[Retry] ${context}: Failed after ${maxRetries + 1} attempts`);

        // Log final failure
        await logError({
          userId,
          errorCode: "API_TIMEOUT",
          message: `${context} failed after ${maxRetries + 1} retry attempts`,
          context,
          severity: SEVERITY.HIGH,
          error,
          metadata: {
            attempts: maxRetries + 1,
            lastError: error.message,
          },
        });

        throw error;
      }

      // Calculate backoff and retry
      const backoffMs = calculateBackoffDelay(attempt);
      console.warn(
        `[Retry] ${context}: Attempt ${attempt + 1} failed (${error.message}). Retrying in ${backoffMs}ms...`
      );

      // Log retry attempt
      await logError({
        userId,
        errorCode: "API_TIMEOUT",
        message: `${context} transient failure, retrying (attempt ${attempt + 1}/${maxRetries})`,
        context,
        severity: SEVERITY.MEDIUM,
        error,
        metadata: {
          attempt: attempt + 1,
          maxRetries,
          backoffMs,
          isTransient: true,
        },
      });

      // Wait before retrying
      await sleep(backoffMs);
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error(`${context}: Failed to complete after retries`);
}

/**
 * Retry a polling operation (useful for YouCam API polling)
 * Continues polling until success, timeout, or permanent error
 *
 * @param {Function} pollFn - Async function that returns { status, data }
 * @param {Object} options - Polling options
 * @param {string} options.context - Context for logging
 * @param {string} options.userId - User ID for error logging
 * @param {number} options.maxPollSeconds - Max time to poll (default 300s)
 * @param {number} options.pollIntervalMs - Interval between polls (default 2000ms)
 * @param {string[]} options.successStates - Status values indicating success (default: ["success"])
 * @param {string[]} options.errorStates - Status values indicating failure (default: ["error"])
 * @returns {Promise<any>} Poll data
 *
 * @example
 * const result = await retryPolling(
 *   async () => {
 *     const resp = await fetch(`/api/task/${taskId}`);
 *     const data = await resp.json();
 *     return { status: data.status, data };
 *   },
 *   { context: "YouCam polling", userId: "user123" }
 * );
 */
async function retryPolling(pollFn, options = {}) {
  const {
    context = "polling",
    userId = "system",
    maxPollSeconds = 300,
    pollIntervalMs = 2000,
    successStates = ["success"],
    errorStates = ["error"],
  } = options;

  const startTime = Date.now();
  const maxWaitMs = maxPollSeconds * 1000;
  let pollAttempt = 0;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const result = await pollFn();
      const { status, data } = result;

      pollAttempt++;

      // Check for success
      if (successStates.includes(status)) {
        console.log(
          `[Polling] ${context}: Succeeded after ${pollAttempt} attempts (${Date.now() - startTime}ms)`
        );
        return data;
      }

      // Check for permanent error
      if (errorStates.includes(status)) {
        const error = new Error(`${context}: API returned error status: ${status}`);
        console.error(`[Polling] ${error.message}`);

        await logError({
          userId,
          errorCode: "API_INVALID_RESPONSE",
          message: `${context} returned error status`,
          context,
          severity: SEVERITY.HIGH,
          error,
          metadata: { status, data },
        });

        throw error;
      }

      // Still processing, wait and retry
      console.log(`[Polling] ${context}: Attempt ${pollAttempt}, status: ${status}`);
      await sleep(pollIntervalMs);
    } catch (error) {
      // On transient polling errors, retry
      if (isTransientError(error)) {
        console.warn(`[Polling] ${context}: Transient error, retrying - ${error.message}`);
        await sleep(pollIntervalMs);
        continue;
      }

      // Permanent error, throw immediately
      throw error;
    }
  }

  // Timeout
  const timeoutError = new Error(
    `${context}: Polling timeout after ${maxPollSeconds}s (${pollAttempt} attempts)`
  );
  console.error(`[Polling] ${timeoutError.message}`);

  await logError({
    userId,
    errorCode: "API_TIMEOUT",
    message: `${context} exceeded maximum polling time`,
    context,
    severity: SEVERITY.HIGH,
    error: timeoutError,
    metadata: {
      maxPollSeconds,
      pollAttempts: pollAttempt,
      elapsedMs: Date.now() - startTime,
    },
  });

  throw timeoutError;
}

module.exports = {
  retryWithBackoff,
  retryPolling,
  calculateBackoffDelay,
  sleep,
  RETRY_CONFIG,
};
