import { Command } from '@oclif/core';
import { buildUpdateArgs, runResourceCommand, updateFlags } from '../../../lib/resource-command.js';

export default class ResourceUpdate extends Command {
  static summary = 'Update records in a resource';

  static description =
    'Update records in a generic resource. Target records with --filter-by-tk or --filter, and pass updated values through --values.';

  static examples = [
    `<%= config.bin %> <%= command.id %> --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'`,
    `<%= config.bin %> <%= command.id %> --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'`,
  ];

  static flags = updateFlags;

  async run(): Promise<void> {
    const { flags } = await this.parse(ResourceUpdate);
    await runResourceCommand(this, 'update', flags, buildUpdateArgs(flags));
  }
}
