import { Command } from '@oclif/core';
import { buildGetArgs, getFlags, runResourceCommand } from '../../../lib/resource-command.js';

export default class ResourceGet extends Command {
  static summary = 'Get a record from a resource';

  static description =
    'Get a record from a generic resource. Use --filter-by-tk for the primary key and association resource names with --source-id when needed.';

  static examples = [
    '<%= config.bin %> <%= command.id %> --resource users --filter-by-tk 1',
    '<%= config.bin %> <%= command.id %> --resource posts.comments --source-id 1 --filter-by-tk 2',
  ];

  static flags = getFlags;

  async run(): Promise<void> {
    const { flags } = await this.parse(ResourceGet);
    await runResourceCommand(this, 'get', flags, buildGetArgs(flags));
  }
}
