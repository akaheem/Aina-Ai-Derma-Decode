import React from "react";

/**
 * Error Display Component
 * Shows user-friendly error messages with retry and dismiss options
 * Maps error codes to helpful guidance
 */
export function ErrorDisplay({ error, onRetry, onDismiss, context = "operation" }) {
  if (!error) return null;

  // Extract error information
  const errorCode = error?.code || error?.errorCode || "UNKNOWN_ERROR";
  const errorMessage = error?.message || "An unexpected error occurred";

  // Map error codes to user-friendly messages and guidance
  const errorGuides = {
    "INVALID_IMAGE_MIME": {
      title: "Invalid Image Format",
      message: errorMessage || "Only JPG and PNG images are supported.",
      guidance: "Please upload a JPG or PNG image and try again.",
      icon: "📸",
    },
    "INVALID_IMAGE_SIZE": {
      title: "Image Too Large",
      message: errorMessage || "Your image exceeds the maximum file size.",
      guidance: "Please use an image smaller than 10MB.",
      icon: "📦",
    },
    "INVALID_IMAGE_DIMENSIONS": {
      title: "Image Too Small",
      message: errorMessage || "Image must be at least 300x300 pixels.",
      guidance: "Please use a higher resolution image.",
      icon: "🔍",
    },
    "API_TIMEOUT": {
      title: "Analysis Taking Too Long",
      message: "The service is taking longer than expected.",
      guidance: "Please try again or use a clearer photo.",
      icon: "⏱️",
    },
    "API_RATE_LIMITED": {
      title: "Service Temporarily Busy",
      message: "The service is experiencing high demand.",
      guidance: "Please wait a moment and try again.",
      icon: "🚦",
    },
    "QUOTA_EXCEEDED": {
      title: "Daily Limit Reached",
      message: errorMessage || "You've used all your analyses for today.",
      guidance: "Your limit resets at midnight. Come back tomorrow!",
      icon: "📅",
    },
    "TOO_MANY_REQUESTS": {
      title: "Too Many Requests",
      message: "You're making requests too quickly.",
      guidance: "Please wait a moment before trying again.",
      icon: "⚡",
    },
    "UNAUTHENTICATED": {
      title: "Authentication Required",
      message: "You must be logged in to perform this action.",
      guidance: "Please sign in and try again.",
      icon: "🔐",
    },
    "unauthorized": {
      title: "Permission Denied",
      message: "You don't have permission to perform this action.",
      guidance: "Please contact support if you believe this is an error.",
      icon: "🚫",
    },
    "INTERNAL_ERROR": {
      title: "Something Went Wrong",
      message: "An unexpected error occurred on our end.",
      guidance: "Please try again. If the problem persists, contact support.",
      icon: "⚠️",
    },
  };

  const errorGuide = errorGuides[errorCode] || errorGuides["INTERNAL_ERROR"];

  return (
    <div className="w-full">
      <div className="rounded-2xl p-6 mb-4" style={{ background: "#fdeaee", border: "1px solid rgba(232,96,125,0.3)" }}>
        {/* Error Header */}
        <div className="flex items-start gap-4">
          <div className="text-3xl flex-shrink-0">{errorGuide.icon}</div>
          <div className="flex-grow min-w-0">
            <h3 className="text-lg font-semibold mb-1" style={{ color: "#8a1f3a" }}>{errorGuide.title}</h3>
            <p className="text-sm mb-3" style={{ color: "#a83452" }}>{errorGuide.message}</p>
            <p className="text-sm font-medium mb-4" style={{ color: "#a83452" }}>{errorGuide.guidance}</p>

            {/* Error Code (for debugging) */}
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs font-mono mb-4" style={{ color: "#c06079" }}>Code: {errorCode}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="lk-btn-primary inline-flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again
                </button>
              )}

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center px-4 py-2 font-medium rounded-full transition duration-200"
                  style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border-soft)" }}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading State with Error Fallback
 * Shows spinner, error, or success state
 */
export function AsyncStateView({ loading, error, success, children, onRetry, onDismiss }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: "var(--accent-soft)" }}>
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
            />
          </div>
          <p className="font-medium" style={{ color: "var(--muted)" }}>Processing…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={onRetry} onDismiss={onDismiss} />;
  }

  if (success) {
    return (
      <div className="rounded-2xl p-6" style={{ background: "rgba(23,163,74,0.1)", border: "1px solid rgba(23,163,74,0.3)" }}>
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 flex-shrink-0"
            style={{ color: "#0f7a37" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <div>
            <h3 className="font-semibold" style={{ color: "#0f7a37" }}>Success!</h3>
            <p className="text-sm" style={{ color: "#0f7a37" }}>Operation completed successfully.</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default ErrorDisplay;
