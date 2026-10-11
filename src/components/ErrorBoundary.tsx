import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/** Keeps a rendering fault from blanking the whole app, without leaking error details. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="card" role="alert">
        <h2 className="card__title">Something went wrong</h2>
        <p>Your saved data is safe. Reload the page to continue.</p>
        <button type="button" className="button button--primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
