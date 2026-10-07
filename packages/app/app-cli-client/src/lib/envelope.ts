// The one JSON document `--json` prints on stdout, success or failure: the application CLI's envelope, built by
// `@nocobase/cli-envelope`, so a script reads `acme … --json` the way it reads `pnpm nocobase … --json`. A business
// command's `result` is the API's answer, `{ data, meta? }`; a failure's `error.code` is the error body's `reason`, and
// `details` carries the HTTP status, the canonical status and the body's metadata.
import {
  commandFailureJson,
  commandSuccessJson,
  type CommandErrorJson,
  type CommandJson,
  type CommandSuggestion,
} from '@nocobase/cli-envelope';
import { EXIT_CODES, type ExitCode } from '@nocobase/agent-protocol';
import { ZodError } from 'zod';

import { UsageError } from './command.ts';
import { AppApiError } from './http.ts';

export type Envelope = CommandJson;

/** A failure the CLI raises itself, with what the envelope says of it. */
export class CliCommandError extends Error {
  readonly code: string;
  readonly suggestions: readonly CommandSuggestion[];
  readonly details: unknown;
  /** The exit code; 1 when not given. */
  readonly exit: ExitCode;

  constructor(
    code: string,
    message: string,
    options: {
      readonly suggestions?: readonly CommandSuggestion[];
      readonly details?: unknown;
      readonly exit?: ExitCode;
    } = {},
  ) {
    super(message);
    this.name = 'CliCommandError';
    this.code = code;
    this.suggestions = options.suggestions ?? [];
    this.details = options.details;
    this.exit = options.exit ?? EXIT_CODES.general;
  }
}

/** What a step the caller can take next says, for the failures that have one. */
function suggestionsFor(reason: string, bin: string): CommandSuggestion[] {
  switch (reason) {
    case 'UNAUTHENTICATED':
    case 'AUTHENTICATION_REQUIRED':
    case 'CLI_UNAUTHENTICATED':
      return [
        { message: `Sign in again with \`${bin} login --server <url>\`.` },
      ];
    case 'PLAN_REQUIRED':
      return [
        {
          message: `Propose an operation plan instead: \`${bin} plan create --file plan.json\`.`,
        },
      ];
    default:
      return [];
  }
}

/** A failure as the envelope's `error`. */
export function errorJsonOf(
  error: unknown,
  bin = 'nocobase-cli',
): CommandErrorJson {
  if (error instanceof CliCommandError)
    return {
      code: error.code,
      message: error.message,
      suggestions: error.suggestions,
      ...(error.details === undefined ? {} : { details: error.details }),
    };
  if (error instanceof AppApiError) {
    const details = {
      ...(error.status ? { httpStatus: error.status } : {}),
      ...(error.apiStatus ? { status: error.apiStatus } : {}),
      ...(error.metadata === undefined ? {} : { metadata: error.metadata }),
    };
    return {
      code: error.reason,
      message: error.message,
      suggestions: suggestionsFor(error.reason, bin),
      ...(Object.keys(details).length > 0 ? { details } : {}),
    };
  }
  if (error instanceof UsageError)
    return { code: 'INVALID_USAGE', message: error.message, suggestions: [] };
  if (error instanceof ZodError)
    return {
      code: 'UNEXPECTED_RESPONSE',
      message: `The server answered in an unexpected shape: ${error.issues[0]?.message ?? 'invalid'}`,
      suggestions: [],
    };
  return {
    code: 'UNEXPECTED',
    message: error instanceof Error ? error.message : String(error),
    suggestions: [],
  };
}

export function successEnvelope(
  command: string,
  result: unknown,
  warnings: readonly string[] = [],
  status: 'success' | 'success-noop' = 'success',
): Envelope {
  return commandSuccessJson(command, status, result, warnings);
}

export function failureEnvelope(
  command: string,
  error: unknown,
  warnings: readonly string[] = [],
  bin?: string,
): Envelope {
  return commandFailureJson(command, errorJsonOf(error, bin), warnings);
}
