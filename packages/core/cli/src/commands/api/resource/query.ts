import { Command } from '@oclif/core';
import { buildQueryArgs, queryFlags, runResourceCommand } from '../../../lib/resource-command.js';

export default class ResourceQuery extends Command {
  static summary = 'Run an aggregate query on a resource';

  static description =
    'Run an aggregate query on a generic resource. Pass measures, dimensions, and orders as JSON arrays.';

  static examples = [
    `<%= config.bin %> <%= command.id %> --resource orders --measures '[{"field":["id"],"aggregation":"count","alias":"count"}]'`,
    `<%= config.bin %> <%= command.id %> --resource orders --dimensions '[{"field":["status"],"alias":"status"}]' --orders '[{"field":["createdAt"],"order":"desc"}]'`,
  ];

  static flags = queryFlags;

  async run(): Promise<void> {
    const { flags } = await this.parse(ResourceQuery);
    await runResourceCommand(this, 'query', flags, buildQueryArgs(flags));
  }
}
