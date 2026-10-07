// What every command of an application CLI shares: `--json`, which prints the cli-envelope (`envelope.ts`), the global
// flags (`globals.ts`), and failures reported with the CLI's exit codes (0 ok, 1 general, 2 network, 3 auth, 4 not found, 5 validation,
// 6 conflict, 7 a plan is required).
import { Command, Errors } from '@oclif/core';
import { ZodError } from 'zod';

import { EXIT_CODES, type ExitCode } from '@nocobase/agent-protocol';

import { appCliConfig, appCliPaths, type AppCliPaths } from '../config.ts';
import {
  CliCommandError,
  failureEnvelope,
  successEnvelope,
} from './envelope.ts';
import { globalFlags } from './globals.ts';
import { AppApiError } from './http.ts';

export class UsageError extends Error {
  readonly exit: ExitCode;

  constructor(message: string, exit: ExitCode = EXIT_CODES.validation) {
    super(message);
    this.name = 'UsageError';
    this.exit = exit;
  }
}

/** A failure as oclif reports it, with the CLI's exit code. */
export function asCliError(error: unknown): Error {
  if (error instanceof AppApiError) {
    return new Errors.CLIError(`${error.reason}: ${error.message}`, {
      exit: error.exitCode,
    });
  }
  if (error instanceof UsageError)
    return new Errors.CLIError(error.message, { exit: error.exit });
  if (error instanceof CliCommandError)
    return new Errors.CLIError(
      [
        error.message,
        ...error.suggestions.map((suggestion) =>
          suggestion.run
            ? `${suggestion.message} (${[suggestion.run.command, ...suggestion.run.args].join(' ')})`
            : suggestion.message,
        ),
      ].join('\n'),
      { exit: error.exit },
    );
  if (error instanceof ZodError)
    return new Errors.CLIError(
      `The server answered in an unexpected shape: ${error.issues[0]?.message ?? 'invalid'}`,
      { exit: EXIT_CODES.general },
    );
  return error instanceof Error ? error : new Error(String(error));
}

export abstract class AppCommand extends Command {
  static override enableJsonFlag = true;
  /** Whether the command honours the global `--dry-run`; one that does not refuses it. */
  static supportsDryRun: boolean = false;

  /** The failure as the command raised it, before it became oclif's error. */
  private failure: unknown;

  /** The command as typed, such as `whoami`. */
  protected get commandName(): string {
    return (this.id ?? '').split(':').join(' ');
  }

  protected override toSuccessJson(result: unknown): unknown {
    return successEnvelope(
      this.commandName,
      result,
      [],
      globalFlags().dryRun ? 'success-noop' : 'success',
    );
  }

  /** Whether `--dry-run` was given: the command then says what it would do and changes nothing. */
  protected get dryRun(): boolean {
    return globalFlags().dryRun;
  }

  /** Whether `--yes` was given. */
  protected get yes(): boolean {
    return globalFlags().yes;
  }

  public override async init(): Promise<void> {
    await super.init();
    const own = this.constructor as typeof AppCommand;
    if (globalFlags().dryRun && !own.supportsDryRun)
      throw new CliCommandError(
        'DRY_RUN_UNSUPPORTED',
        `\`${this.bin} ${this.commandName}\` has no dry run; run it without --dry-run.`,
        { exit: EXIT_CODES.validation },
      );
  }

  /** Under `--quiet` nothing but `--json`'s document is printed on success. */
  public override log(message?: string, ...args: unknown[]): void {
    if (globalFlags().quiet && !this.jsonEnabled()) return;
    super.log(message, ...args);
  }

  public override warn(input: string | Error): string | Error {
    if (globalFlags().quiet) return input;
    return super.warn(input);
  }

  protected override toErrorJson(error: unknown): unknown {
    return failureEnvelope(
      this.commandName,
      this.failure ?? error,
      [],
      appCliConfig().bin,
    );
  }

  protected get paths(): AppCliPaths {
    return appCliPaths();
  }

  /** The CLI's command name, for messages. */
  protected get bin(): string {
    return appCliConfig().bin;
  }

  protected override async catch(
    error: Error & { exitCode?: number },
  ): Promise<unknown> {
    this.failure = error;
    if (
      error instanceof AppApiError ||
      error instanceof UsageError ||
      error instanceof CliCommandError ||
      error instanceof ZodError
    )
      return super.catch(asCliError(error));
    return super.catch(error);
  }
}
