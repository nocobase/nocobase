/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { getCurrentEnvName, listEnvs } from '../../../lib/auth-store.js';
import { renderTable } from '../../../lib/ui.js';
import { isAutostartEnabled } from './shared.js';

export default class AppAutostartList extends Command {
  static override description = 'List app autostart status for configured envs.';

  static override examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    await this.parse(AppAutostartList);
    const { envs } = await listEnvs();
    const currentEnv = await getCurrentEnvName();
    const names = Object.keys(envs).sort();

    if (!names.length) {
      this.log('No environments are configured.');
      return;
    }

    const rows = names.map((name) => {
      const env = envs[name];
      return [
        name === currentEnv ? '*' : '',
        name,
        env.kind ?? '-',
        env.source ? String(env.source) : '-',
        isAutostartEnabled(env) ? 'yes' : 'no',
      ];
    });

    this.log(renderTable(['Current', 'Env', 'Kind', 'Source', 'Autostart'], rows));
  }
}
