import { EXIT_FAILED, isInstallerError, type Suggestion } from './errors.ts';

/**
 * The one JSON document `--json` prints on stdout, shaped like the application CLI's envelope so a script that reads
 * `pnpm nocobase … --json` reads this the same way.
 */
export type Envelope =
  | {
      schemaVersion: 1;
      ok: true;
      command: string;
      status: 'success' | 'success-noop';
      result: unknown;
      warnings: string[];
    }
  | {
      schemaVersion: 1;
      ok: false;
      command: string;
      status: 'error';
      error: {
        code: string;
        message: string;
        suggestions: Suggestion[];
        details?: Record<string, unknown>;
      };
      warnings: string[];
    };

export interface Reporter {
  readonly json: boolean;
  /** Progress for a person watching; always on stderr so stdout stays one JSON document under `--json`. */
  progress(message: string): void;
  warn(message: string): void;
  readonly warnings: string[];
}

export function createReporter(
  json: boolean,
  stderr: NodeJS.WritableStream = process.stderr,
): Reporter {
  const warnings: string[] = [];
  return {
    json,
    warnings,
    progress(message) {
      stderr.write(`${message}\n`);
    },
    warn(message) {
      warnings.push(message);
      stderr.write(`Warning: ${message}\n`);
    },
  };
}

export function successEnvelope(
  command: string,
  result: unknown,
  warnings: string[],
  status: 'success' | 'success-noop' = 'success',
): Envelope {
  return { schemaVersion: 1, ok: true, command, status, result, warnings };
}

export function errorEnvelope(
  command: string,
  error: unknown,
  warnings: string[],
): Envelope {
  if (isInstallerError(error)) {
    return {
      schemaVersion: 1,
      ok: false,
      command,
      status: 'error',
      error: {
        code: error.code,
        message: error.message,
        suggestions: error.suggestions,
        ...(error.details ? { details: error.details } : {}),
      },
      warnings,
    };
  }
  return {
    schemaVersion: 1,
    ok: false,
    command,
    status: 'error',
    error: {
      code: 'UNEXPECTED',
      message: error instanceof Error ? error.message : String(error),
      suggestions: [],
    },
    warnings,
  };
}

export function exitCodeOf(error: unknown): number {
  return isInstallerError(error) ? error.exitCode : EXIT_FAILED;
}

/** Renders an error for a person: the message, then each suggestion with the command to run under it. */
export function formatError(error: unknown): string {
  const envelope = errorEnvelope('', error, []);
  if (envelope.ok) return '';
  const lines = [`Error: ${envelope.error.message}`];
  // A failed step's own output is usually the actual reason; show its tail rather than only the step name.
  for (const key of ['output', 'log'] as const) {
    const text = envelope.error.details?.[key];
    if (typeof text === 'string' && text.trim() !== '') {
      lines.push(...text.split('\n').map((line) => `  | ${line}`));
    }
  }
  for (const suggestion of envelope.error.suggestions) {
    lines.push(`  ${suggestion.message}`);
    if (suggestion.run) lines.push(`    ${suggestion.run}`);
  }
  return lines.join('\n');
}
