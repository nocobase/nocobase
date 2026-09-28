// The one document every NocoBase command-line tool prints under `--json`.
//
// `pnpm nocobase …` commands print it through `AppCommand`, and the tools that run before an application exists —
// `pnpm create @nocobase/app`, `pnpm plugin:create` and app-installer — build it with the same functions, so a caller
// learns one way to read all of them: check `ok`, then read `result` or `error`. The envelope carries a brand so that
// `AppCommand.logJson` can refuse anything else; a second document on stdout is exactly what a machine reader cannot
// recover from.
//
// The Node.js version guard an entry point runs before loading anything else lives in `./node-guard`, as plain
// JavaScript with no imports, so that it runs on the Node.js it is there to refuse.

export const COMMAND_JSON_SCHEMA_VERSION = 1;

/** How a successful run went. A failed run is always `failure`. */
export type CommandSuccessStatus =
  'success' | 'success-noop' | 'partial-success';

/** A step the reader can take next: a sentence, and optionally the exact command that takes it. */
export interface CommandSuggestion {
  readonly message: string;
  /** The executable and its arguments, never a shell string, so no quoting is involved in running it. */
  readonly run?: CommandLine;
}

/** A command to run: the executable and its arguments. */
export interface CommandLine {
  readonly command: string;
  readonly args: readonly string[];
}

/** The `error` member of a failed `--json` document. */
export interface CommandErrorJson {
  /** A stable, machine-readable name for the failure, such as `CONNECTION_FAILED`. Agents branch on it. */
  readonly code: string;
  readonly message: string;
  readonly suggestions: readonly CommandSuggestion[];
  /** What a caller needs to act on the failure, beyond the message. Plain data, never a secret. */
  readonly details?: unknown;
}

export interface CommandSuccessJson<TResult = unknown> {
  readonly schemaVersion: typeof COMMAND_JSON_SCHEMA_VERSION;
  readonly ok: true;
  /** The command's id as typed, such as `db apply`, or the tool's name where it has one command. */
  readonly command: string;
  readonly status: CommandSuccessStatus;
  /** What the command produced; `null` when it produced nothing. */
  readonly result: TResult | null;
  readonly warnings: readonly string[];
}

export interface CommandFailureJson {
  readonly schemaVersion: typeof COMMAND_JSON_SCHEMA_VERSION;
  readonly ok: false;
  readonly command: string;
  readonly status: 'failure';
  readonly error: CommandErrorJson;
  readonly warnings: readonly string[];
}

export type CommandJson<TResult = unknown> =
  CommandSuccessJson<TResult> | CommandFailureJson;

// Looked up by a registered symbol rather than held in this module, so a document built by another copy of this
// package still passes `isCommandEnvelope`.
const ENVELOPE = Symbol.for('@nocobase/cli-envelope.envelope');

function brand<T extends object>(envelope: T): T {
  Object.defineProperty(envelope, ENVELOPE, { value: true });
  return envelope;
}

/** Whether `value` was built by `commandSuccessJson` or `commandFailureJson`, from any copy of this package. */
export function isCommandEnvelope(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<symbol, unknown>)[ENVELOPE] === true
  );
}

export function commandSuccessJson<TResult>(
  command: string,
  status: CommandSuccessStatus,
  result: TResult | undefined,
  warnings: readonly string[],
): CommandSuccessJson<TResult> {
  return brand({
    schemaVersion: COMMAND_JSON_SCHEMA_VERSION,
    ok: true as const,
    command,
    status,
    result: result ?? null,
    warnings: [...warnings],
  });
}

/** A failure document. `error.details` is left out when it is `undefined`, so a reader can test for its presence. */
export function commandFailureJson(
  command: string,
  error: CommandErrorJson,
  warnings: readonly string[],
): CommandFailureJson {
  return brand({
    schemaVersion: COMMAND_JSON_SCHEMA_VERSION,
    ok: false as const,
    command,
    status: 'failure' as const,
    error: {
      code: error.code,
      message: error.message,
      suggestions: [...error.suggestions],
      ...(error.details === undefined ? {} : { details: error.details }),
    },
    warnings: [...warnings],
  });
}

/** Quotes an argument for a POSIX shell when it would otherwise split or be interpreted, so the line can be pasted. */
export function quoteForShell(argument: string): string {
  if (/^[\w@%+=:,./-]+$/u.test(argument)) return argument;
  return `'${argument.replaceAll("'", `'\\''`)}'`;
}

/** A suggestion's command as one line a person can paste into a shell, each argument quoted where it needs to be. */
export function formatCommandLine(line: CommandLine): string {
  return [line.command, ...line.args].map(quoteForShell).join(' ');
}

/** A suggestion as one line for a person: its message, followed by its command where it has one. */
export function renderSuggestion(suggestion: CommandSuggestion): string {
  if (suggestion.run === undefined) return suggestion.message;
  return `${suggestion.message} ${formatCommandLine(suggestion.run)}`;
}
