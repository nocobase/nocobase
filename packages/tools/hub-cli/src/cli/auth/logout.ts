import type { Command, Interfaces } from '@oclif/core';

import { removeKey } from '../../credentials.ts';
import { HubCommand, remoteFlag } from '../hub-command.ts';

export interface AuthLogoutResult {
  remote: string;
  url: string;
  removed: boolean;
}

export default class HubAuthLogout extends HubCommand {
  static override summary = 'Remove the API key saved for a remote.';
  static override description =
    "Deletes the key hub auth login saved for the remote's URL. The key stays valid on the Hub: disable it on the Hub's API Keys page to revoke it.";

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --remote production',
  ];

  static override flags: {
    remote: Interfaces.OptionFlag<string | undefined>;
  } = { remote: remoteFlag };

  protected readonly failureCode = 'LOGOUT_FAILED';
  protected readonly failureMessage = 'The API key could not be removed.';

  override async run(): Promise<AuthLogoutResult> {
    const { flags } = await this.parse(HubAuthLogout);
    return await this.report(async () => {
      const remote = await this.remote(flags.remote);
      const removed = await removeKey(remote.url);
      this.log(
        removed
          ? `API key for ${remote.name} removed.`
          : `No API key was saved for ${remote.name}.`,
      );
      if (!removed) this.setStatus('success-noop');
      return { remote: remote.name, url: remote.url, removed };
    });
  }
}
