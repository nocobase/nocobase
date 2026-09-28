/**
 * The one JSON document `--json` prints on stdout, in the application CLI's envelope, so an agent that goes on to run
 * `pnpm nocobase … --json` in the new project reads both the same way. `tests/scripts/json-envelope-parity.test.mjs`
 * at the repository root compares the two, so a change to either fails until the other follows.
 */
export type Envelope =
  | {
      schemaVersion: 1;
      ok: true;
      command: typeof COMMAND;
      status: 'success';
      result: unknown;
      warnings: string[];
    }
  | {
      schemaVersion: 1;
      ok: false;
      command: typeof COMMAND;
      status: 'failure';
      error: {
        code: string;
        message: string;
        suggestions: Suggestion[];
        details?: Record<string, unknown>;
      };
      warnings: string[];
    };

/** A step the reader can take next: a sentence, and optionally the exact command that takes it. */
export interface Suggestion {
  message: string;
  /** The executable and its arguments, never a shell string, so running it involves no quoting. */
  run?: { command: string; args: string[] };
}

/** How far creation got; a failure reports the stage it stopped at, which decides what is safe to do next. */
export type Stage = 'input' | 'download' | 'scaffold' | 'install' | 'verify';

/** One code per stage, so an agent can branch on `error.code` alone. */
export const FAILURE_CODES: Readonly<Record<Stage, string>> = {
  input: 'INVALID_USAGE',
  download: 'TEMPLATE_DOWNLOAD_FAILED',
  scaffold: 'SCAFFOLD_FAILED',
  install: 'INSTALL_FAILED',
  verify: 'DRIVER_VERIFICATION_FAILED',
};

const COMMAND = 'create-app';

export function successEnvelope(
  result: unknown,
  warnings: string[] = [],
): Envelope {
  return {
    schemaVersion: 1,
    ok: true,
    command: COMMAND,
    status: 'success',
    result: result ?? null,
    warnings,
  };
}

export interface Failure {
  code: string;
  message: string;
  suggestions?: Suggestion[];
  details?: Record<string, unknown>;
}

export function failureEnvelope(
  failure: Failure,
  warnings: string[] = [],
): Envelope {
  return {
    schemaVersion: 1,
    ok: false,
    command: COMMAND,
    status: 'failure',
    error: {
      code: failure.code,
      message: failure.message,
      suggestions: failure.suggestions ?? [],
      ...(failure.details ? { details: failure.details } : {}),
    },
    warnings,
  };
}
