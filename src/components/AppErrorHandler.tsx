import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AppErrorHandler extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    // AI Logging Pipeline Hook - Reporting to AI Diagnostics Engine
    fetch("/api/error-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error.message,
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      })
    }).catch(err => console.error("Neural log failure:", err));
  }

  public resetError = () => {
    this.setState({ hasError: false, error: undefined });
    window.dispatchEvent(new Event("app:recover"));
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4 font-sans ring ring-orange-500/20">
          <div className="text-center p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full">
            <h1 className="text-2xl font-display font-bold mb-4 text-orange-500 uppercase tracking-widest">System Anomaly</h1>
            <p className="mb-4 text-zinc-400">Something went wrong in the automotive diagnostic matrix.</p>
            
            {this.state.error?.message && (
              <div className="mb-6 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-left">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Diagnostic Detail</p>
                <p className="text-xs text-orange-200/70 font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={this.resetError}
                className="bg-orange-600 hover:bg-orange-700 active:scale-95 px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-orange-900/20"
              >
                Retry System
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-medium underline underline-offset-4"
              >
                Force Full Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorHandler;
