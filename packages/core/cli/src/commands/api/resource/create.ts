import { Command } from '@oclif/core';
import { buildCreateArgs, createFlags, runResourceCommand } from '../../../lib/resource-command.js';

export default class ResourceCreate extends Command {
  static summary = 'Create a record in a resource';

  static description =
    'Create a record in a generic resource. Pass record content through --values as a JSON object.';

  static examples = [
    `<%= config.bin %> <%= command.id %> --resource users --values '{"nickname":"Ada"}'`,
    `<%= config.bin %> <%= command.id %> --resource posts.comments --source-id 1 --values '{"content":"Hello"}'`,
  ];

  static flags = createFlags;

  async run(): Promise<void> {
    const { flags } = await this.parse(ResourceCreate);
    await runResourceCommand(this, 'create', flags, buildCreateArgs(flags));
  }
}
