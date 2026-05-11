/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command } from '@oclif/core';
import { assertSupportedCliConfigKey, setCliConfigValue } from '../../lib/cli-config.js';

export default class ConfigSet extends Command {
  static override summary = 'Set a CLI configuration value';
  static override description =
    'Set a supported CLI configuration key. Supported keys: license.pkg-url, docker.network, docker.container-prefix.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> license.pkg-url https://pkg.nocobase.com/',
    '<%= config.bin %> <%= command.id %> docker.network nocobase',
    '<%= config.bin %> <%= command.id %> docker.container-prefix nb',
  ];

  static override args = {
    key: Args.string({
      description: 'Configuration key',
      required: true,
    }),
    value: Args.string({
      description: 'Configuration value',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet);
    const key = assertSupportedCliConfigKey(args.key);
    const value = await setCliConfigValue(key, args.value);
    this.log(`${key}=${value}`);
  }
}
