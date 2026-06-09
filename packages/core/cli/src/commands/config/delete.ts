/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command } from '@oclif/core';
import { assertSupportedCliConfigKey, deleteCliConfigValue } from '../../lib/cli-config.js';
import { clearLegacyStartupUpdatePolicyForCurrentInstall } from '../../lib/startup-update.js';

export default class ConfigDelete extends Command {
  static override summary = 'Delete an explicitly configured CLI setting';
  static override examples = [
    '<%= config.bin %> <%= command.id %> locale',
    '<%= config.bin %> <%= command.id %> update.policy',
    '<%= config.bin %> <%= command.id %> docker.network',
    '<%= config.bin %> <%= command.id %> docker.container-prefix',
    '<%= config.bin %> <%= command.id %> bin.docker',
    '<%= config.bin %> <%= command.id %> bin.caddy',
    '<%= config.bin %> <%= command.id %> bin.git',
    '<%= config.bin %> <%= command.id %> bin.nginx',
    '<%= config.bin %> <%= command.id %> proxy.nb-cli-root',
    '<%= config.bin %> <%= command.id %> proxy.upstream-host',
    '<%= config.bin %> <%= command.id %> bin.yarn',
    '<%= config.bin %> <%= command.id %> log.enabled',
    '<%= config.bin %> <%= command.id %> log.retention-days',
  ];

  static override args = {
    key: Args.string({
      description: 'Configuration key',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigDelete);
    const key = assertSupportedCliConfigKey(args.key);
    const removed = await deleteCliConfigValue(key);
    const clearedLegacy = key === 'update.policy' ? await clearLegacyStartupUpdatePolicyForCurrentInstall() : false;
    this.log(removed || clearedLegacy ? `Deleted ${key}` : `${key} was not set`);
  }
}
