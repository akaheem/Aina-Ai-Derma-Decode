const admin = require("firebase-admin");

/**
 * Centralized logging utility for AinaAi Cloud Functions
 * Logs errors to Firestore with severity levels and context
 */

// Error severity levels
const SEVERITY = {
  LOW: "low",       // Non-critical issues (validation errors, user mistakes)
  MEDIUM: "medium", // Recoverable errors (API timeouts, transient failures)
  HIGH: "high",     // Critical errors (auth failures, quota exceeded, data corruption)
};

// Standard error codes for client-side handling
const ERROR_CODES = {
  // Input validation
  INVALID_IMAGE_MIME: "INVALID_IMAGE_MIME",
  INVALID_IMAGE_SIZE: "INVALID_IMAGE_SIZE",
  INVALID_IMAGE_DIMENSIONS: "INVALID_IMAGE_DIMENSIONS",

  // API errors
  API_TIMEOUT: "API_TIMEOUT",
  API_RATE_LIMITED: "API_RATE_LIMITED",
  API_INVALID_RESPONSE: "API_INVALID_RESPONSE",

  // Authentication/Authorization
  UNAUTHENTICATED: "UNAUTHENTICATED",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Rate limiting
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Configuration
  MISSING_API_KEY: "MISSING_API_KEY",
  CONFIG_ERROR: "CONFIG_ERROR",

  // Internal
  FIRESTORE_ERROR: "FIRESTORE_ERROR",
  STORAGE_ERROR: "STORAGE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

/**
 * Log an error to Firestore
 * @param {Object} errorInfo - Error information
 * @param {string} errorInfo.userId - User ID (optional for auth errors)
 * @param {string} errorInfo.errorCode - Standard error code
 * @param {string} errorInfo.message - User-friendly message
 * @param {string} errorInfo.context - Context where error occurred (e.g., "analyzeSkin", "tryOnApparel")
 * @param {string} errorInfo.severity - Severity level (low/medium/high)
 * @param {Error} errorInfo.error - Original error object (for stack traces)
 * @param {Object} errorInfo.metadata - Additional context data
 * @returns {Promise<string>} Document ID of logged error
 */
async function logError(errorInfo) {
  try {
    const {
      userId = "anonymous",
      errorCode = ERROR_CODES.INTERNAL_ERROR,
      message = "An unexpected error occurred",
      context = "unknown",
      severity = SEVERITY.MEDIUM,
      error = null,
      metadata = {},
    } = errorInfo;

    const db = admin.firestore();
    const logEntry = {
      userId,
      errorCode,
      message,
      context,
      severity,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      stack: error?.stack || null,
      originalError: error?.message || null,
      metadata,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
    };

    const docRef = await db.collection("error_logs").add(logEntry);

    // Also log to console for debugging
    console.error(`[ERROR_LOG] ${errorCode}: ${message}`, {
      userId,
      context,
      severity,
      stack: error?.stack,
    });

    return docRef.id;
  } catch (loggingError) {
    // Fallback to console if Firestore logging fails
    console.error("[CRITICAL] Failed to log error:", loggingError.message, errorInfo);
  }
}

/**
 * Check if an error is transient (can be retried)
 * @param {Error} error - Error object
 * @returns {boolean} True if error is transient
 */
function isTransientError(error) {
  const message = error?.message || "";
  const status = error?.status;

  // Network timeouts
  if (message.includes("timeout") || message.includes("TIMEOUT")) {
    return true;
  }

  // Temporary server errors
  if (status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  // YouCam specific transient errors
  if (message.includes("temporarily unavailable") || message.includes("rate limit")) {
    return true;
  }

  return false;
}

/**
 * Check if an error is permanent (should not be retried)
 * @param {Error} error - Error object
 * @returns {boolean} True if error is permanent
 */
function isPermanentError(error) {
  const message = error?.message || "";
  const status = error?.status;

  // Authentication errors
  if (status === 401 || status === 403 || message.includes("unauthenticated") || message.includes("unauthorized")) {
    return true;
  }

  // Bad request / invalid input
  if (status === 400 || message.includes("invalid") || message.includes("INVALID")) {
    return true;
  }

  // Not found
  if (status === 404) {
    return true;
  }

  // API key errors
  if (message.includes("API key") || message.includes("apikey")) {
    return true;
  }

  return false;
}

/**
 * Format error for client response
 * @param {string} errorCode - Error code
 * @param {string} userMessage - User-friendly message
 * @returns {Object} Formatted error object
 */
function formatErrorResponse(errorCode, userMessage) {
  return {
    success: false,
    error: {
      code: errorCode,
      message: userMessage,
    },
  };
}

module.exports = {
  logError,
  isTransientError,
  isPermanentError,
  formatErrorResponse,
  ERROR_CODES,
  SEVERITY,
};
