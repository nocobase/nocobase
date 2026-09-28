/**
 * The one JSON document `--json` prints on stdout, success or failure, in the application CLI's envelope, so an agent
 * that goes on to run `pnpm nocobase plugin register … --json` reads both the same way. A `--dry-run` answers
 * `success-noop`, as every application CLI dry run does. `tests/scripts/json-envelope-parity.test.mjs` at the
 * repository root compares the two, so a change to either fails until the other follows.
 */
export type Envelope =
  | {
      readonly schemaVersion: 1;
      readonly ok: true;
      readonly command: typeof COMMAND;
      readonly status: 'success' | 'success-noop';
      readonly result: unknown;
      readonly warnings: readonly string[];
    }
  | {
      readonly schemaVersion: 1;
      readonly ok: false;
      readonly command: typeof COMMAND;
      readonly status: 'failure';
      readonly error: JsonCliError;
      readonly warnings: readonly string[];
    };

/** A step the reader can take next: a sentence, and optionally the exact command that takes it. */
export interface Suggestion {
  readonly message: string;
  /** The executable and its arguments, never a shell string, so running it involves no quoting. */
  readonly run?: { readonly command: string; readonly args: readonly string[] };
}

export interface JsonCliError {
  readonly code: string;
  readonly message: string;
  readonly suggestions: readonly Suggestion[];
  readonly details?: Record<string, unknown>;
}

const COMMAND = 'create-plugin';

export function successEnvelope(
  result: unknown,
  status: 'success' | 'success-noop' = 'success',
): Envelope {
  return {
    schemaVersion: 1,
    ok: true,
    command: COMMAND,
    status,
    result: result ?? null,
    warnings: [],
  };
}

export function failureEnvelope(error: JsonCliError): Envelope {
  return {
    schemaVersion: 1,
    ok: false,
    command: COMMAND,
    status: 'failure',
    error: {
      code: error.code,
      message: error.message,
      suggestions: error.suggestions,
      ...(error.details ? { details: error.details } : {}),
    },
    warnings: [],
  };
}

/** Prints an envelope on stdout, where a caller reading `--json` looks for it whichever way the run ended. */
export function writeEnvelope(envelope: Envelope): void {
  process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
}
