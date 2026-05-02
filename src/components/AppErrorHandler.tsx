import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorHandler extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4 font-sans ring ring-orange-500/20">
          <div className="text-center p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
            <h1 className="text-2xl font-display font-bold mb-4 text-orange-500 uppercase tracking-widest">System Anomaly</h1>
            <p className="mb-6 text-zinc-400">Something went wrong in the automotive diagnostic matrix.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-700 active:scale-95 px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-orange-900/20"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorHandler;
