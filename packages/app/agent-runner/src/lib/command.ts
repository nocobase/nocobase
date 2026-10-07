// What every `nocobase-runner` command shares: `--json`, which prints the cli-envelope of `@nocobase/cli-envelope`, the
// state directory, and failures reported with exit codes (0 ok, 1 general, 2 network, 3 auth, 4 not found,
// 5 validation, 6 conflict).
import {
  commandFailureJson,
  commandSuccessJson,
  type CommandErrorJson,
} from '@nocobase/cli-envelope';
import { Command, Errors } from '@oclif/core';
import { ZodError } from 'zod';

import { EXIT_CODES, type ExitCode } from '../protocol/index.ts';
import { runnerPaths, type RunnerPaths } from './home.ts';
import { ApiError } from './http.ts';

export class UsageError extends Error {
  readonly exit: ExitCode;

  constructor(message: string, exit: ExitCode = EXIT_CODES.validation) {
    super(message);
    this.name = 'UsageError';
    this.exit = exit;
  }
}

/** A failure as the envelope's `error`: the server's reason, a usage error, or anything else. */
export function runnerErrorJson(error: unknown): CommandErrorJson {
  if (error instanceof ApiError)
    return {
      code: error.reason,
      message: error.message,
      suggestions: [],
      ...(error.status ? { details: { httpStatus: error.status } } : {}),
    };
  if (error instanceof UsageError)
    return { code: 'INVALID_USAGE', message: error.message, suggestions: [] };
  return {
    code: 'UNEXPECTED',
    message: error instanceof Error ? error.message : String(error),
    suggestions: [],
  };
}

export abstract class RunnerCommand extends Command {
  static override enableJsonFlag = true;

  private failure: unknown;

  private get commandName(): string {
    return (this.id ?? '').split(':').join(' ');
  }

  protected override toSuccessJson(result: unknown): unknown {
    return commandSuccessJson(this.commandName, 'success', result, []);
  }

  protected override toErrorJson(error: unknown): unknown {
    return commandFailureJson(
      this.commandName,
      runnerErrorJson(this.failure ?? error),
      [],
    );
  }

  protected get paths(): RunnerPaths {
    return runnerPaths();
  }

  protected override async catch(
    error: Error & { exitCode?: number },
  ): Promise<unknown> {
    this.failure = error;
    if (error instanceof ApiError) {
      return super.catch(
        new Errors.CLIError(`${error.reason}: ${error.message}`, {
          exit: error.exitCode,
        }),
      );
    }
    if (error instanceof UsageError) {
      return super.catch(
        new Errors.CLIError(error.message, { exit: error.exit }),
      );
    }
    if (error instanceof ZodError) {
      return super.catch(
        new Errors.CLIError(
          `The server answered in an unexpected shape: ${error.issues[0]?.message ?? 'invalid'}`,
          {
            exit: EXIT_CODES.general,
          },
        ),
      );
    }
    return super.catch(error);
  }
}
