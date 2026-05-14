"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Section label shown in the error recovery UI */
  sectionName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ComponentErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const label = this.props.sectionName ?? "This section";
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm" role="alert">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Component error</p>
          <p className="mt-2 text-base font-medium text-stone-900">{label} encountered a problem.</p>
          <p className="mt-1 text-sm text-stone-600">You can try again without reloading the full page.</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 rounded-full bg-stone-950 px-5 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            Retry this section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
