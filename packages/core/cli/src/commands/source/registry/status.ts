/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { renderTable } from '../../../lib/ui.js';
import { resolveSourceRegistryInfo } from '../../../lib/source-registry.js';

export default class SourceRegistryStatus extends Command {
  static override description =
    'Show the status of the local Docker-based npm registry used for source tests.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static override flags = {
    json: Flags.boolean({
      description: 'Print the source registry status as JSON',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SourceRegistryStatus);
    const info = await resolveSourceRegistryInfo();

    if (flags.json) {
      this.log(JSON.stringify(info, null, 2));
      return;
    }

    this.log(renderTable(
      ['Container', 'Status', 'URL', 'Storage'],
      [[info.containerName, info.status, info.url, info.storageDir]],
    ));
  }
}
