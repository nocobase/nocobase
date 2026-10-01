import { Args, type Command, type Interfaces } from '@oclif/core';

import { HubCliError } from '../../errors.ts';
import { readRemotes, REMOTES_FILE, writeRemotes } from '../../remotes.ts';
import { HubCommand } from '../hub-command.ts';

export interface RemoteRemoveResult {
  name: string;
  url: string;
  /** The removed remote was the default, so there is no default now. */
  wasDefault: boolean;
}

export default class HubRemoteRemove extends HubCommand {
  static override summary = 'Remove a Hub App this application deploys to.';
  static override description = `Removes the remote from ${REMOTES_FILE}. The API key saved for it stays, because another checkout may use the same remote; remove it with hub auth logout. Removing the default remote leaves no default: pass --remote, or set "default" in the file.`;

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> staging',
  ];

  static override args: { name: Interfaces.Arg<string> } = {
    name: Args.string({
      required: true,
      description: 'Name of the remote to remove.',
    }),
  };

  protected readonly failureCode = 'REMOTE_REMOVE_FAILED';
  protected readonly failureMessage = 'The remote could not be removed.';

  override async run(): Promise<RemoteRemoveResult> {
    const { args } = await this.parse(HubRemoteRemove);
    return await this.report(async () => {
      const file = await readRemotes(this.rootDir);
      const url = Object.hasOwn(file.remotes, args.name)
        ? file.remotes[args.name]
        : undefined;
      if (url === undefined)
        throw new HubCliError(
          'NO_REMOTE',
          `Remote "${args.name}" is not in ${REMOTES_FILE}. List the remotes with hub remote list.`,
          2,
        );
      delete file.remotes[args.name];
      const wasDefault = file.default === args.name;
      if (wasDefault) delete file.default;
      await writeRemotes(this.rootDir, file);
      this.log(
        `Remote ${args.name} removed${wasDefault ? '; there is no default remote now' : ''}.`,
      );
      return { name: args.name, url, wasDefault };
    });
  }
}
