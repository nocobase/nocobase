/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { listEnvs } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { renderTable } from '../../lib/ui.js';

function resolveApiBaseUrl(config: { apiBaseUrl?: unknown; baseUrl?: unknown; apibaseUrl?: unknown }): string {
  return String(config.apiBaseUrl ?? config.baseUrl ?? config.apibaseUrl ?? '').trim();
}

export default class EnvList extends Command {
  static summary = 'List configured environments';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    await this.parse(EnvList);
    const { currentEnv, envs } = await listEnvs({ scope: resolveDefaultConfigScope() });
    const names = Object.keys(envs).sort();

    if (!names.length) {
      this.log('No envs configured.');
      this.log('Run `nb env add <name> --api-base-url <url>` to add one.');
      return;
    }

    const rows = names.map((name) => {
      const env = envs[name];
      return [name === currentEnv ? '*' : '', name, resolveApiBaseUrl(env), env.auth?.type ?? '', env.runtime?.version ?? ''];
    });

    this.log(renderTable(['Current', 'Name', 'Base URL', 'Auth', 'Runtime'], rows));
  }
}
