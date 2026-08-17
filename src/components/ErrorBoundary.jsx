import React from "react";

/**
 * Error Boundary Component for AinaAi
 * Catches React component errors and displays user-friendly error messages
 * Provides retry functionality for failed operations
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCode: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
      errorCode: error?.code || "UNKNOWN_ERROR",
    });

    // Optionally send error to logging service
    if (window.logError) {
      window.logError({
        error: error.toString(),
        stack: errorInfo.componentStack,
        context: "React Error Boundary",
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCode: null,
    });

    // Optionally reload the page or trigger parent retry
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            {/* Error Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
              <p className="text-gray-600 text-sm mb-4">
                We encountered an unexpected error. Please try again or contact support if the problem persists.
              </p>
            </div>

            {/* Error Details (for development) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 p-4 bg-gray-100 rounded text-xs text-gray-700">
                <summary className="font-mono font-bold cursor-pointer">Error Details</summary>
                <pre className="mt-2 overflow-auto max-h-40 font-mono text-xs whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {"\n\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Go to Home
              </button>
            </div>

            {/* Support Link */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-sm">
                Need help?{" "}
                <a
                  href="mailto:support@ainaai.com"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
