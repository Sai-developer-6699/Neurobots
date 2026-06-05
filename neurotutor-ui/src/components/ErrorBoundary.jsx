import React from "react";

/**
 * ErrorBoundary — catches any unhandled React render errors and shows
 * a friendly fallback instead of a white screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="glass border border-red-900/40 rounded-2xl p-10 max-w-md w-full text-center relative z-10">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-black text-white font-heading mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            An unexpected error occurred. This has been logged.
          </p>

          {/* Error details (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg p-3 mb-6 overflow-auto max-h-32">
              {this.state.error.toString()}
            </pre>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm hover:-translate-y-0.5 transition-all shadow-[0_0_20px_rgba(0,243,255,0.2)]"
            >
              Reload Page
            </button>
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/10 transition-all"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
