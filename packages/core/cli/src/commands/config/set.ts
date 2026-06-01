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
import { clearLegacyStartupUpdatePolicyForCurrentInstall } from '../../lib/startup-update.js';

export default class ConfigSet extends Command {
  static override summary = 'Set a CLI configuration value';
  static override description =
    'Set a supported CLI configuration key. Supported keys: locale, update.policy, license.pkg-url, docker.network, docker.container-prefix, bin.docker, bin.git, bin.yarn.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> locale zh-CN',
    '<%= config.bin %> <%= command.id %> update.policy prompt',
    '<%= config.bin %> <%= command.id %> license.pkg-url https://pkg.nocobase.com/',
    '<%= config.bin %> <%= command.id %> docker.network nocobase',
    '<%= config.bin %> <%= command.id %> docker.container-prefix nb',
    '<%= config.bin %> <%= command.id %> bin.docker /usr/local/bin/docker',
    '<%= config.bin %> <%= command.id %> bin.git /usr/bin/git',
    '<%= config.bin %> <%= command.id %> bin.yarn yarn',
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
    if (key === 'update.policy') {
      await clearLegacyStartupUpdatePolicyForCurrentInstall();
    }
    this.log(`${key}=${value}`);
  }
}
