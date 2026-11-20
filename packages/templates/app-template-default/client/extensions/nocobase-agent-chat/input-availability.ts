import type { ReactNode } from 'react';

/** Application model readiness: history, drafts and Stop remain available independently of sending. */
export interface ChatInputAvailability {
  readonly canSend: boolean;
  readonly notice?: ReactNode;
}
