/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { listExplicitCliConfigValues, SUPPORTED_CLI_CONFIG_KEYS } from '../../lib/cli-config.js';
import { renderTable } from '../../lib/ui.js';

export default class ConfigList extends Command {
  static override summary = 'List explicitly configured CLI settings';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    await this.parse(ConfigList);
    const values = await listExplicitCliConfigValues();
    const rows = SUPPORTED_CLI_CONFIG_KEYS
      .filter((key) => Boolean(values[key]))
      .map((key) => [key, values[key] ?? '']);

    if (!rows.length) {
      this.log('No CLI config values are set.');
      return;
    }

    this.log(renderTable(['Key', 'Value'], rows));
  }
}
