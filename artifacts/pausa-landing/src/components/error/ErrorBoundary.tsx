import React, { Component, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-4 p-6 border border-destructive/20 rounded-2xl bg-card">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="w-6 h-6 text-destructive shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Something went wrong
                </h2>
                <p className="text-sm text-muted-foreground">
                  {this.state.error?.message ||
                    "An unexpected error occurred. Please try refreshing the page."}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
