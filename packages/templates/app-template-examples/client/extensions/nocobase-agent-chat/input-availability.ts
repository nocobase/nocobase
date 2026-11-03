import type { ReactNode } from 'react';

/** Examples-local readiness gate: history, drafts and Stop remain available independently of sending. */
export interface ChatInputAvailability {
  readonly canSend: boolean;
  readonly notice?: ReactNode;
}
