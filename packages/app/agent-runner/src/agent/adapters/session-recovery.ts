import type { AdapterEvent } from './types.ts';

export const SESSION_RECOVERY_PROMPT: string =
  'The previous conversation could not be resumed. Re-read the task, its comments, and the workspace to recover the context before continuing.';

export function recoveryPrompt(prompt: string): string {
  return `${SESSION_RECOVERY_PROMPT}\n\n${prompt}`;
}

export function recoveryEvent(tool: string): Omit<AdapterEvent, 'at'> {
  return {
    type: 'status',
    tool,
    content: 'sessionRecovery',
    meta: { reason: 'sessionUnavailable' },
  };
}
