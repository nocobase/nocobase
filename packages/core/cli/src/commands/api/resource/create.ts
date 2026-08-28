/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { buildCreateArgs, createFlags, runResourceCommand } from '../../../lib/resource-command.js';

export default class ResourceCreate extends Command {
  static summary = 'Create one or more records in a resource';

  static description =
    'Create records in a generic resource. Pass record content through --values as a JSON object, or as a JSON array of objects to create multiple records in a single request.';

  static examples = [
    `<%= config.bin %> <%= command.id %> --resource users --values '{"nickname":"Ada"}'`,
    `<%= config.bin %> <%= command.id %> --resource users --values '[{"nickname":"Ada"},{"nickname":"Grace"}]'`,
    `<%= config.bin %> <%= command.id %> --resource posts.comments --source-id 1 --values '{"content":"Hello"}'`,
  ];

  static flags = createFlags;

  async run(): Promise<void> {
    const { flags } = await this.parse(ResourceCreate);
    await runResourceCommand(this, 'create', flags, buildCreateArgs(flags));
  }
}
