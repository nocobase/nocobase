import type { Command } from '@oclif/core';

import { parseRemoteUrl, readRemotes, REMOTES_FILE } from '../../remotes.ts';
import { HubCommand } from '../hub-command.ts';

export interface RemoteListResult {
  remotes: {
    name: string;
    url: string;
    hub: string;
    appId: string;
    default: boolean;
  }[];
}

export default class HubRemoteList extends HubCommand {
  static override summary = 'List the Hub Apps this application deploys to.';
  static override description = `Reads ${REMOTES_FILE}. Nothing is sent to the Hub.`;

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  protected readonly failureCode = 'REMOTE_LIST_FAILED';
  protected readonly failureMessage = 'The remotes could not be read.';

  override async run(): Promise<RemoteListResult> {
    await this.parse(HubRemoteList);
    return await this.report(async () => {
      const file = await readRemotes(this.rootDir);
      const remotes = Object.entries(file.remotes).map(([name, url]) => ({
        name,
        ...parseRemoteUrl(url),
        default: name === file.default,
      }));
      if (remotes.length === 0)
        this.log('No remotes. Add one with hub remote add <name> <url>.');
      for (const remote of remotes)
        this.log(
          `${remote.default ? '* ' : '  '}${remote.name}\t${remote.url}`,
        );
      return { remotes };
    });
  }
}
