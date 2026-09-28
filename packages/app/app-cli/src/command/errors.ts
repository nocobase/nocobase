// The error a command throws when it fails, and how any error becomes the `error` of a `--json` document.
//
// `CommandError` extends oclif's `CLIError` so that without `--json` oclif's own handler prints it — the message, the
// suggestions under "Try this:", and the exit code — and nothing here re-implements terminal rendering.
import {
  renderSuggestion,
  type CommandErrorJson,
  type CommandSuggestion,
} from '@nocobase/cli-envelope';
import { Errors } from '@oclif/core';

export type { CommandErrorJson, CommandSuggestion };

export interface CommandErrorOptions {
  /** A stable, machine-readable name for the failure, such as `CONNECTION_FAILED`. Agents branch on it. */
  readonly code: string;
  /** What to do next. A string is shorthand for a suggestion with only a message. */
  readonly suggestions?: readonly (string | CommandSuggestion)[];
  /** The process exit code. Defaults to 1; use 2 for invalid usage. */
  readonly exit?: number;
  /**
   * What a caller needs to act on the failure, beyond the message — the findings a check produced, the connection
   * that failed. It becomes `error.details` under `--json`; keep it to plain data, and never put a secret in it.
   */
  readonly details?: unknown;
  /**
   * The error behind this one. It is printed only when `NOCOBASE_CLI_DEBUG` is set, and only after redaction, because
   * an underlying message may quote a request, a response or an environment value that `message` deliberately omits.
   */
  readonly cause?: unknown;
}

const COMMAND_ERROR = Symbol.for('@nocobase/app-cli.CommandError');

/**
 * A failure a command reports on purpose.
 *
 * Throw it instead of printing an error and calling `exit()`: with `--json` it becomes the `error` of the one document
 * the command prints, and without it oclif prints the message and suggestions and exits with `exit`.
 */
export class CommandError extends Errors.CLIError {
  public readonly errorCode: string;
  public readonly commandSuggestions: readonly CommandSuggestion[];
  public readonly exitCode: number;
  public readonly details: unknown;
  /**
   * `options.cause`, kept off the standard `cause` property: oclif prints that under "Caused by" whenever it prints the
   * error, which would show a person what the message was written to leave out.
   */
  public readonly underlyingError: unknown;

  public constructor(message: string, options: CommandErrorOptions) {
    const suggestions = (options.suggestions ?? []).map(toSuggestion);
    super(message, {
      code: options.code,
      exit: options.exit ?? 1,
      suggestions: suggestions.map(renderSuggestion),
    });
    // Not enumerable, so serializing the error never carries what the message leaves out.
    Object.defineProperty(this, 'underlyingError', {
      value: options.cause,
      enumerable: false,
    });
    this.errorCode = options.code;
    this.commandSuggestions = suggestions;
    this.exitCode = options.exit ?? 1;
    this.details = options.details;
    Object.defineProperty(this, COMMAND_ERROR, { value: true });
  }
}

/**
 * Whether `error` is a `CommandError`, including one created by another copy of this package. The brand is looked up
 * by a registered symbol rather than `instanceof`, which a duplicated installation would defeat.
 */
export function isCommandError(error: unknown): error is CommandError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as Record<symbol, unknown>)[COMMAND_ERROR] === true
  );
}

interface OclifErrorShape {
  readonly code?: string;
  readonly oclif?: { readonly exit?: number | false };
  /** What oclif's parse errors carry, and nothing else it raises does. */
  readonly parse?: unknown;
}

/** What oclif appends to every parse error, and to a flag's own parse failure whatever class that has. */
export const OCLIF_HELP_HINT = '\nSee more help with --help';

/** The code of a command line that was not understood: an unknown flag or command, a missing or invalid value. */
export const INVALID_USAGE = 'INVALID_USAGE';

/** The code of an oclif error a command raised itself, such as `this.error()`, which says nothing more specific. */
export const COMMAND_FAILED = 'COMMAND_FAILED';

/**
 * Whether oclif raised `error` while parsing the command line. A command's own `this.error()` is a `CLIError` too, so
 * the class alone cannot tell a usage error from a runtime failure.
 */
export function isOclifParseError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const { parse } = error as OclifErrorShape;
  return (
    (typeof parse === 'object' && parse !== null) ||
    error.message.endsWith(OCLIF_HELP_HINT)
  );
}

/** The `error` of a `--json` document for any thrown value, and the exit code the process ends with. */
export function describeCommandError(error: unknown): {
  readonly json: CommandErrorJson;
  readonly exit: number;
} {
  // A failure wrapped with a cleanup failure, which the lifecycle does when nothing reports cleanup failures separately:
  // the failure is what the caller acts on, so its code survives.
  if (error instanceof AggregateError && error.cause !== undefined) {
    const cause = describeCommandError(error.cause);
    return {
      json: { ...cause.json, message: error.message },
      exit: cause.exit,
    };
  }
  if (isCommandError(error)) {
    return {
      json: {
        code: error.errorCode,
        message: error.message,
        suggestions: error.commandSuggestions,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
      exit: error.exitCode,
    };
  }
  if (error instanceof Errors.CLIError || isOclifError(error)) {
    // oclif's own errors keep the exit code oclif gave them, which is also what its handler exits with when it prints
    // one, so a run ends the same way with and without --json. Only a parse error is invalid usage: `this.error()` in a
    // command is a `CLIError` as well, and a runtime failure reported that way is not the caller's arguments.
    const shape = error as OclifErrorShape & Error;
    const exit = shape.oclif?.exit;
    return {
      json: {
        code:
          shape.code ??
          (isOclifParseError(error) ? INVALID_USAGE : COMMAND_FAILED),
        message: shape.message,
        suggestions: [],
      },
      exit: typeof exit === 'number' ? exit : 2,
    };
  }
  return {
    json: {
      code: 'UNEXPECTED',
      message: error instanceof Error ? error.message : String(error),
      suggestions: [],
    },
    exit: 1,
  };
}

function isOclifError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as OclifErrorShape).oclif === 'object'
  );
}

function toSuggestion(
  suggestion: string | CommandSuggestion,
): CommandSuggestion {
  return typeof suggestion === 'string' ? { message: suggestion } : suggestion;
}
