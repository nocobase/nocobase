import type { CommandLine, CommandSuggestion } from '@nocobase/cli-envelope';

/**
 * Exit codes are part of the contract: CI and agents branch on them.
 *
 * - `0` success, including a run that found nothing to do
 * - `1` the operation failed, and the running application was not touched
 * - `2` invalid usage or a failed precheck, before anything was written
 * - `3` an upgrade failed after the switch and was rolled back; the previous release is running again
 * - `4` rolling back failed too; the application needs a person, and the error says what to do
 */
export const EXIT_OK = 0;
export const EXIT_FAILED = 1;
export const EXIT_INVALID = 2;
export const EXIT_ROLLED_BACK = 3;
export const EXIT_ROLLBACK_FAILED = 4;

export type { CommandLine };
/** A step the reader can take next: a sentence, and optionally the exact command that takes it. */
export type Suggestion = CommandSuggestion;

export interface InstallerErrorOptions {
  exitCode?: number;
  suggestions?: Suggestion[];
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class InstallerError extends Error {
  public readonly code: string;
  public readonly exitCode: number;
  public readonly suggestions: Suggestion[];
  public readonly details: Record<string, unknown> | undefined;

  public constructor(
    code: string,
    message: string,
    options: InstallerErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'InstallerError';
    this.code = code;
    this.exitCode = options.exitCode ?? EXIT_FAILED;
    this.suggestions = options.suggestions ?? [];
    this.details = options.details;
  }
}

export function isInstallerError(error: unknown): error is InstallerError {
  return error instanceof InstallerError;
}
