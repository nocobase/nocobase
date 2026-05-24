/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command } from '@oclif/core';
import { assertSupportedCliConfigKey, getCliConfigValue } from '../../lib/cli-config.js';

export default class ConfigGet extends Command {
  static override summary = 'Get the effective CLI configuration value for a key';
  static override examples = [
    '<%= config.bin %> <%= command.id %> license.pkg-url',
    '<%= config.bin %> <%= command.id %> docker.network',
    '<%= config.bin %> <%= command.id %> docker.container-prefix',
    '<%= config.bin %> <%= command.id %> bin.docker',
    '<%= config.bin %> <%= command.id %> bin.git',
    '<%= config.bin %> <%= command.id %> bin.yarn',
  ];

  static override args = {
    key: Args.string({
      description: 'Configuration key',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigGet);
    const key = assertSupportedCliConfigKey(args.key);
    this.log(await getCliConfigValue(key));
  }
}
