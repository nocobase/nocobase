import {
  commandFailureJson,
  commandSuccessJson,
  type CommandErrorJson,
  type CommandJson,
  type CommandSuggestion,
} from '@nocobase/cli-envelope';

/**
 * The one JSON document `--json` prints on stdout, success or failure: the application CLI's envelope, built by
 * `@nocobase/cli-envelope` so an agent that goes on to run `pnpm nocobase plugin register … --json` reads both the
 * same way. A `--dry-run` answers `success-noop`, as every application CLI dry run does.
 */
export type Envelope = CommandJson;

export type Suggestion = CommandSuggestion;

export type JsonCliError = CommandErrorJson;

const COMMAND = 'create-plugin';

export function successEnvelope(
  result: unknown,
  status: 'success' | 'success-noop' = 'success',
): Envelope {
  return commandSuccessJson(COMMAND, status, result, []);
}

export function failureEnvelope(error: JsonCliError): Envelope {
  return commandFailureJson(COMMAND, error, []);
}

/** Prints an envelope on stdout, where a caller reading `--json` looks for it whichever way the run ended. */
export function writeEnvelope(envelope: Envelope): void {
  process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
}
