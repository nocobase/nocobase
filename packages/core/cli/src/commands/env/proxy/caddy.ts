/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { createEnvProxyCaddyFlags, ENV_PROXY_NAME_ARG, runEnvProxyCommand } from './index.js';

export default class EnvProxyCaddy extends Command {
  static override summary = 'Generate Caddy proxy files for one managed env';

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

  static override flags = createEnvProxyCaddyFlags();

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvProxyCaddy);
    await runEnvProxyCommand(this, args, flags, 'caddy');
  }
}
