/**
 * An online run's tools (`sandbox.ts`): its shell, with the application's CLI in it, and its skills. A refusal or a
 * failure is an output the model reads, never an error the run fails on.
 */
import { ProtocolError } from '@nocobase/agent-protocol';

import type { ModelToolSpec } from './gateway.js';

/** A tool of an online run. */
export interface ServerTool {
  readonly spec: ModelToolSpec;
  /** Runs the call; a refusal or failure is a result the model reads (`ok: false`), not an error. */
  invoke(
    args: unknown,
  ): Promise<{ readonly ok: boolean; readonly output: string }>;
}

/** The longest tool result the model reads, in characters; longer ones are cut with a note. */
export const TOOL_OUTPUT_MAX = 24_000;

/** A result cut to `TOOL_OUTPUT_MAX`, with a note saying so. */
export function clip(text: string): string {
  if (text.length <= TOOL_OUTPUT_MAX) return text;
  return `${text.slice(0, TOOL_OUTPUT_MAX)}\n…(cut: the result was ${text.length} characters; ask for less, such as with a filter or a limit)`;
}

/** A refusal or failure as the model reads it: the command's error, which it should not try to work around. */
export function errorOutput(error: unknown): string {
  if (error instanceof ProtocolError)
    return JSON.stringify({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  return JSON.stringify({
    error: {
      code: 'INTERNAL',
      message: error instanceof Error ? error.message : String(error),
    },
  });
}
