/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { getEnv } from '../../lib/auth-store.ts';
import { runNocoBaseCommand } from '../../lib/run-npm.ts';

export default class PmList extends Command {
  static override args = {};
  static override summary = 'List all plugins';
  static override examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> -e local'];
  static override flags = {
    env: Flags.string({
      char: 'e',
      description:
        'CLI env name (from `nb env` / `nb install`). Defaults to the current env when omitted',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(PmList);

    const env = await getEnv(flags.env);

    if (!env) {
      this.error('Env is not configured');
    }

    if (env.config.appRootPath) {
      try {
        await runNocoBaseCommand(['pm', 'list'], { cwd: env.appRootPath, env: env.envVars });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(message);
      }
      return;
    } else {
      await this.config.runCommand('api:pm:list', ['--mode=summary']);
    }
  }
}
