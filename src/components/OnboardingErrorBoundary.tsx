'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class OnboardingErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Onboarding render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 shadow-sm p-6 text-center">
            <p className="text-lg font-bold text-slate-900 mb-2">Onboarding failed to load</p>
            <p className="text-sm text-slate-600 mb-4">
              Please close and reopen onboarding from the app. If this continues, contact support.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
