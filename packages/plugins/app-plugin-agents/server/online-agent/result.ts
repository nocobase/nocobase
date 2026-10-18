import type { OnlineAgentJson } from './codec.js';

export type OnlineAgentResult =
  | { ok: true; data: OnlineAgentJson }
  | { ok: false; reason: 'pending' }
  | { ok: false; reason: 'failed' | 'cancelled'; error: OnlineAgentSafeError };

export type OnlineAgentSafeError = {
  code: 'EXECUTION_FAILED' | 'EXECUTION_CANCELLED' | 'OUTPUT_INVALID';
  message: string;
};

/** A safe execution failure; admission and infrastructure errors still throw separately. */
export class OnlineAgentResultError extends Error {
  readonly code: OnlineAgentSafeError['code'];
  constructor(
    readonly reason: 'failed' | 'cancelled',
    error: OnlineAgentSafeError,
  ) {
    super(error.message);
    this.name = 'OnlineAgentResultError';
    this.code = error.code;
  }
}
