import type { AdapterEvent, AdapterResult, AdapterSession } from './types.ts';

export class SessionUnavailableError extends Error {
  constructor() {
    super(
      'The original session cannot be resumed. Restore it on this runner and retry, or explicitly change Agent.',
    );
  }
}

export function requireRecoverableSession(session: AdapterSession): void {
  if (session.strictSession) throw new SessionUnavailableError();
}

export function sessionUnavailable(error: unknown): AdapterResult | undefined {
  return error instanceof SessionUnavailableError
    ? {
        exit: 'error',
        usage: [],
        error: { reason: 'sessionUnavailable', message: error.message },
      }
    : undefined;
}

export const SESSION_RECOVERY_PROMPT: string =
  'The previous conversation could not be resumed. Re-read the task, its comments, and the workspace to recover the context before continuing.';

/** The first prompt of a session that replaces one that could not be resumed, with what came before when known. */
export function recoveryPrompt(prompt: string, context?: string): string {
  return [
    SESSION_RECOVERY_PROMPT,
    ...(context?.trim() ? [`What came before:\n\n${context.trim()}`] : []),
    prompt,
  ].join('\n\n');
}

export function recoveryEvent(tool: string): Omit<AdapterEvent, 'at'> {
  return {
    type: 'status',
    tool,
    content: 'sessionRecovery',
    meta: { reason: 'sessionUnavailable' },
  };
}
