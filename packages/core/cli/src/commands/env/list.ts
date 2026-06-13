/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { getCurrentEnvName, listEnvs, resolveConfiguredAuthType } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { translateCli } from '../../lib/cli-locale.js';
import { renderTable } from '../../lib/ui.js';
import { resolveApiBaseUrl } from './shared.js';

export default class EnvList extends Command {
  static summary = 'List configured environments';

  static override examples = ['<%= config.bin %> <%= command.id %>'];

  async run(): Promise<void> {
    await this.parse(EnvList);
    const scope = resolveDefaultConfigScope();
    const { envs } = await listEnvs({ scope });
    const currentEnv = await getCurrentEnvName({ scope });
    const names = Object.keys(envs).sort();

    if (!names.length) {
      this.log(translateCli('commands.env.messages.noEnvsConfigured'));
      this.log(translateCli('commands.env.messages.noEnvsConfiguredHelp'));
      return;
    }

    const rows: string[][] = [];
    for (const name of names) {
      const env = envs[name];

      rows.push([
        name === currentEnv ? '*' : '',
        name,
        env.kind ?? '-',
        resolveApiBaseUrl(env),
        resolveConfiguredAuthType(env) ?? env.auth?.type ?? '',
        env.runtime?.version ?? '',
      ]);
    }

    this.log(renderTable(['Current', 'Name', 'Kind', 'API Base URL', 'Auth', 'Runtime'], rows));
  }
}
