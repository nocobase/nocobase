import { Command } from '@oclif/core';
import { buildDestroyArgs, destroyFlags, runResourceCommand } from '../../../lib/resource-command.js';

export default class ResourceDestroy extends Command {
  static summary = 'Delete records from a resource';

  static description =
    'Delete records from a generic resource. Target records with --filter-by-tk or --filter.';

  static examples = [
    '<%= config.bin %> <%= command.id %> --resource users --filter-by-tk 1',
    `<%= config.bin %> <%= command.id %> --resource posts --filter '{"status":"archived"}'`,
  ];

  static flags = destroyFlags;

  async run(): Promise<void> {
    const { flags } = await this.parse(ResourceDestroy);
    await runResourceCommand(this, 'destroy', flags, buildDestroyArgs(flags));
  }
}
