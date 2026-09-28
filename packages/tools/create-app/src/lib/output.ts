import {
  commandFailureJson,
  commandSuccessJson,
  type CommandJson,
  type CommandSuggestion,
} from '@nocobase/cli-envelope';

/**
 * The one JSON document `--json` prints on stdout: the application CLI's envelope, built by `@nocobase/cli-envelope`
 * so an agent that goes on to run `pnpm nocobase … --json` in the new project reads both the same way.
 */
export type Envelope = CommandJson;

export type Suggestion = CommandSuggestion;

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
  return commandSuccessJson(COMMAND, 'success', result, warnings);
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
  return commandFailureJson(
    COMMAND,
    {
      code: failure.code,
      message: failure.message,
      suggestions: failure.suggestions ?? [],
      details: failure.details,
    },
    warnings,
  );
}
