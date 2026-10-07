import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface NocoBaseErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
  readonly resetKeys?: readonly unknown[];
  readonly variant?: 'page' | 'region';
}

interface NocoBaseErrorBoundaryState {
  readonly error?: Error;
}

function resetKeysChanged(
  previous: readonly unknown[] | undefined,
  next: readonly unknown[] | undefined,
): boolean {
  if (previous === next) return false;
  if (!previous || !next || previous.length !== next.length) return true;
  return previous.some((value, index) => !Object.is(value, next[index]));
}

export class NocoBaseErrorBoundary extends Component<
  NocoBaseErrorBoundaryProps,
  NocoBaseErrorBoundaryState
> {
  override state: NocoBaseErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): NocoBaseErrorBoundaryState {
    return { error };
  }

  override componentDidUpdate(previousProps: NocoBaseErrorBoundaryProps): void {
    if (
      this.state.error &&
      resetKeysChanged(previousProps.resetKeys, this.props.resetKeys)
    ) {
      this.setState({ error: undefined });
    }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('AI component rendering failed.', error, info);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      this.props.fallback ?? (
        <div
          className={
            this.props.variant === 'region'
              ? 'rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'
              : 'mx-auto my-12 max-w-xl rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive'
          }
        >
          {this.state.error.message}
        </div>
      )
    );
  }
}
