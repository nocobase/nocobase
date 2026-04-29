/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { resolveManagedAppRuntime } from '../../lib/app-runtime.js';
import { listEnvs } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { renderTable } from '../../lib/ui.js';
import { apiStatus, appUrl, resolveApiBaseUrl } from './shared.js';

export default class EnvList extends Command {
  static summary = 'List configured environments and API auth status';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    await this.parse(EnvList);
    const scope = resolveDefaultConfigScope();
    const { currentEnv, envs } = await listEnvs({ scope });
    const names = Object.keys(envs).sort();

    if (!names.length) {
      this.log('No envs configured.');
      this.log('Run `nb env add <name> --api-base-url <url>` to add one.');
      return;
    }

    const rows: string[][] = [];
    for (const name of names) {
      const env = envs[name];
      const runtime = await resolveManagedAppRuntime(name);
      const statusConfig = {
        ...env,
        ...(runtime?.env.config ?? {}),
      };

      rows.push([
        name === currentEnv ? '*' : '',
        name,
        runtime?.kind ?? env.kind ?? '-',
        await apiStatus(name, statusConfig, { scope }),
        runtime ? appUrl(runtime) : resolveApiBaseUrl(env),
        env.auth?.type ?? '',
        env.runtime?.version ?? '',
      ]);
    }

    this.log(renderTable(['Current', 'Name', 'Kind', 'App Status', 'URL', 'Auth', 'Runtime'], rows));
  }
}
