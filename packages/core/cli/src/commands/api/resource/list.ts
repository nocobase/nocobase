import { Command } from '@oclif/core';
import { buildListArgs, listFlags, runResourceCommand } from '../../../lib/resource-command.js';

export default class ResourceList extends Command {
  static summary = 'List records from a resource';

  static description =
    'List records from a generic resource. Use association resource names like posts.comments with --source-id when needed.';

  static examples = [
    '<%= config.bin %> <%= command.id %> --resource users',
    '<%= config.bin %> <%= command.id %> --resource posts.comments --source-id 1 --fields id --fields content',
    `<%= config.bin %> <%= command.id %> --resource users --filter '{"status":"active"}' --sort=-createdAt`,
  ];

  static flags = listFlags;

  async run(): Promise<void> {
    const { flags } = await this.parse(ResourceList);
    await runResourceCommand(this, 'list', flags, buildListArgs(flags));
  }
}
