import { CommandError } from '@nocobase/app-cli';
import type { Command, Interfaces } from '@oclif/core';

import { loadKey } from '../../credentials.ts';
import { HubCliError } from '../../errors.ts';
import { HubClient } from '../../hub-client.ts';
import { parseRemoteUrl, readRemotes, type Remote } from '../../remotes.ts';
import { HubCommand, remoteFlag, timeoutFlag } from '../hub-command.ts';

export interface AuthStatusEntry {
  remote: string;
  url: string;
  loggedIn: boolean;
  /**
   * Whether the Hub accepted the key for the App; `null` when there is no key, or when the check failed for another
   * reason than the key, such as a Hub that could not be reached or answered something else.
   */
  valid: boolean | null;
  /** Why the key was not accepted, or why it could not be checked. */
  error?: string;
}

export interface AuthStatusResult {
  credentials: AuthStatusEntry[];
}

/** The codes with which the Hub rejects the key itself. */
const REJECTED_KEY = new Set(['INVALID_API_KEY', 'API_KEY_FORBIDDEN']);

export default class HubAuthStatus extends HubCommand {
  static override summary = 'Check the API keys saved for the remotes.';
  static override description =
    'For every remote, or the one --remote names, reports whether a key is saved and asks the Hub whether it still opens the App. Exits 1 when a saved key is rejected.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --remote production --json',
  ];

  static override flags: {
    remote: Interfaces.OptionFlag<string | undefined>;
    timeout: Interfaces.OptionFlag<number>;
  } = { remote: remoteFlag, timeout: timeoutFlag };

  protected readonly failureCode = 'AUTH_STATUS_FAILED';
  protected readonly failureMessage = 'The API keys could not be checked.';

  override async run(): Promise<AuthStatusResult> {
    const { flags } = await this.parse(HubAuthStatus);
    return await this.report(async () => {
      let remotes: Remote[];
      if (flags.remote === undefined) {
        const file = await readRemotes(this.rootDir);
        remotes = Object.entries(file.remotes).map(([name, url]) => ({
          name,
          ...parseRemoteUrl(url),
        }));
      } else {
        remotes = [await this.remote(flags.remote)];
      }
      if (remotes.length === 0)
        throw new HubCliError(
          'NO_REMOTE',
          'No remote is configured. Add one with hub remote add <name> <url>.',
          2,
        );
      const credentials = await Promise.all(
        remotes.map(async (remote): Promise<AuthStatusEntry> => {
          const saved = await loadKey(remote.url);
          const entry = { remote: remote.name, url: remote.url };
          if (saved === undefined)
            return { ...entry, loggedIn: false, valid: null };
          try {
            await new HubClient({
              target: remote,
              apiKey: saved.apiKey,
              timeout: flags.timeout,
            }).getApp();
            return { ...entry, loggedIn: true, valid: true };
          } catch (error) {
            if (!(error instanceof HubCliError)) throw error;
            // Only the Hub's own verdict on the key counts as a rejection; a wrong URL, a proxy's page or a Hub
            // failure says nothing about the key, and logging in again would not help.
            return {
              ...entry,
              loggedIn: true,
              valid: REJECTED_KEY.has(error.code) ? false : null,
              error: error.code,
            };
          }
        }),
      );
      for (const entry of credentials)
        this.log(
          `${entry.remote}\t${entry.url}\t${
            !entry.loggedIn
              ? 'not logged in'
              : entry.valid === true
                ? 'valid'
                : entry.valid === false
                  ? `rejected (${entry.error ?? ''})`
                  : `not checked (${entry.error ?? ''})`
          }`,
        );
      const rejected = credentials.filter((entry) => entry.valid === false);
      if (rejected.length > 0)
        throw new CommandError(
          `The Hub rejected the saved API key for ${rejected.map((entry) => entry.remote).join(', ')}.`,
          {
            code: 'INVALID_API_KEY',
            exit: 1,
            details: { credentials },
            suggestions: rejected.map((entry) => ({
              message: `Save a new key for ${entry.remote}:`,
              run: this.cliCommand([
                'hub',
                'auth',
                'login',
                '--remote',
                entry.remote,
              ]),
            })),
          },
        );
      return { credentials };
    });
  }
}
