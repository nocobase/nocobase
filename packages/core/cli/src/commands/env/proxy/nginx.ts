/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { createEnvProxyNginxFlags, ENV_PROXY_NAME_ARG, runEnvProxyCommand } from './index.js';

export default class EnvProxyNginx extends Command {
  static override summary = 'Generate nginx proxy files for one managed env';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --host a.local.nocobase.com --port 8080',
    '<%= config.bin %> <%= command.id %> --env app1 --install --reload',
    '<%= config.bin %> <%= command.id %> --env app1 --print',
  ];

  static override args = {
    name: ENV_PROXY_NAME_ARG,
  };

  static override flags = createEnvProxyNginxFlags();

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvProxyNginx);
    await runEnvProxyCommand(this, args, flags, 'nginx');
  }
}
