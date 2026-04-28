/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import {
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
} from '../../lib/app-runtime.js';
import { listEnvs } from '../../lib/auth-store.js';
import { renderTable } from '../../lib/ui.js';
import { appNetwork, appRootPath, appUrl, dbStatus, runtimeStatus, storagePath } from './shared.js';
export default class AppPs extends Command {
  static override hidden = false;
  static override description =
    'Show NocoBase runtime status for configured envs without starting or stopping anything.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to inspect. Omit to show all configured envs',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppPs);
    const requestedEnv = flags.env?.trim() || undefined;

    const envNames = requestedEnv
      ? [requestedEnv]
      : Object.keys((await listEnvs()).envs).sort();

    if (!envNames.length) {
      this.log('No NocoBase env is configured yet. Run `nb init` to create one first.');
      return;
    }

    const rows: string[][] = [];
    for (const envName of envNames) {
      const runtime = await resolveManagedAppRuntime(envName);
      if (!runtime) {
        if (requestedEnv) {
          this.error(formatMissingManagedAppEnvMessage(envName));
        }
        rows.push([envName, '-', 'missing', '-', '-', '-', '-', '']);
        continue;
      }

      rows.push([
        runtime.envName,
        runtime.kind,
        await runtimeStatus(runtime),
        await dbStatus(runtime),
        appNetwork(runtime),
        appRootPath(runtime),
        storagePath(runtime),
        appUrl(runtime),
      ]);
    }

    this.log(renderTable(['Env', 'Kind', 'App Status', 'Database Status', 'Network', 'App Root', 'Storage', 'URL'], rows));
  }
}
