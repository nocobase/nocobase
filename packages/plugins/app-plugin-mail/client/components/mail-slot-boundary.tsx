import { Component, type ErrorInfo, type ReactNode } from 'react';

interface MailSlotBoundaryState {
  readonly failed: boolean;
}

/**
 * Isolates one registered slot component: if it throws while rendering, it renders nothing and the Mail page keeps
 * working. The error is not logged with its details, since a business component may hold message content.
 */
export class MailSlotBoundary extends Component<
  { readonly children: ReactNode },
  MailSlotBoundaryState
> {
  public override state: MailSlotBoundaryState = { failed: false };

  public static getDerivedStateFromError(): MailSlotBoundaryState {
    return { failed: true };
  }

  public override componentDidCatch(_error: unknown, _info: ErrorInfo): void {
    console.error('A component registered in a Mail slot failed to render.');
  }

  public override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
