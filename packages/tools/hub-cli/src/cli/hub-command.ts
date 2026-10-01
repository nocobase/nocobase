// What every hub command shares: the remote it acts on, the API key saved for it, and turning a library failure into a
// `CommandError` with what to run next.
//
// Every failure message comes from a fixed string or from values the user supplied. A parse failure is reported by
// `AppCommand` the way every command's is; a library failure carries the message the library chose, and anything else
// is reported by code alone because its message may quote a request, a response or an environment value.
// `NOCOBASE_CLI_DEBUG` prints that cause to stderr, redacted.
import {
  AppCommand,
  CommandError,
  type CommandSuggestion,
} from '@nocobase/app-cli';
import { Flags, type Interfaces } from '@oclif/core';

import { loadKey } from '../credentials.ts';
import { HubCliError } from '../errors.ts';
import { REMOTES_FILE, resolveRemote, type Remote } from '../remotes.ts';

export const remoteFlag: Interfaces.OptionFlag<string | undefined> =
  Flags.string({
    description: `Remote to act on, by name. Defaults to the default remote in ${REMOTES_FILE}.`,
  });

export const timeoutFlag: Interfaces.OptionFlag<number> = Flags.integer({
  default: 600,
  description: 'Deadline for talking to the Hub, in seconds.',
});

export abstract class HubCommand extends AppCommand {
  /** The code reported for a failure that is not the library's own. */
  protected abstract readonly failureCode: string;
  protected abstract readonly failureMessage: string;

  /** The remote the run resolved, so a failure can say what to run for it. */
  #remote: Remote | undefined;

  protected async remote(name: string | undefined): Promise<Remote> {
    this.#remote = await resolveRemote(this.rootDir, name);
    return this.#remote;
  }

  /** The API key saved for `remote`; fails with what to run when there is none. */
  protected async apiKey(remote: Remote): Promise<string> {
    const saved = await loadKey(remote.url);
    if (saved === undefined)
      throw new HubCliError(
        'NOT_LOGGED_IN',
        `No API key is saved for remote "${remote.name}" (${remote.url}).`,
        1,
        { remote: remote.name },
        [this.loginSuggestion(remote)],
      );
    return saved.apiKey;
  }

  protected loginSuggestion(remote: Remote): CommandSuggestion {
    return {
      message: `Save an API key created on the Hub's API Keys page for ${remote.url}:`,
      run: this.cliCommand(['hub', 'auth', 'login', '--remote', remote.name]),
    };
  }

  /** Runs `work`, turning a failure into the `CommandError` the command reports. */
  protected async report<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      throw this.toCommandError(error, this.#remote);
    }
  }

  private toCommandError(
    error: unknown,
    remote: Remote | undefined,
  ): CommandError {
    if (error instanceof CommandError) return error;
    if (error instanceof HubCliError) {
      const suggestions = [...(error.suggestions ?? [])];
      if (
        remote !== undefined &&
        suggestions.length === 0 &&
        (error.code === 'INVALID_API_KEY' || error.code === 'API_KEY_FORBIDDEN')
      )
        suggestions.push(this.loginSuggestion(remote));
      if (
        remote !== undefined &&
        suggestions.length === 0 &&
        error.code === 'HUB_NOT_FOUND'
      )
        suggestions.push({
          message: `Remote "${remote.name}" is ${remote.url}; its URL is <Hub URL>/apps/<App ID>. List the remotes:`,
          run: this.cliCommand(['hub', 'remote', 'list']),
        });
      if (error.code === 'NO_REMOTE' && suggestions.length === 0)
        suggestions.push({
          message:
            'Add the App as a remote with its URL on the Hub: pnpm nocobase hub remote add origin <Hub URL>/apps/<App ID>',
        });
      return new CommandError(error.message, {
        code: error.code,
        exit: error.exitCode,
        suggestions,
        ...(error.details === undefined ? {} : { details: error.details }),
      });
    }
    // The cause is kept out of the message and printed, redacted, only under NOCOBASE_CLI_DEBUG.
    return new CommandError(
      `${this.failureMessage} Set NOCOBASE_CLI_DEBUG=1 to print the cause.`,
      { code: this.failureCode, exit: 1, cause: error },
    );
  }
}
