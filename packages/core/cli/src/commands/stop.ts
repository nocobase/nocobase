/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { getEnv } from '../lib/auth-store.ts';
import type { CliHomeScope } from '../lib/cli-home.ts';
import { runNocoBaseCommand } from '../lib/run-npm.ts';

export default class Stop extends Command {
  static override description =
    'Stop the NocoBase application (runs `nocobase-v1 pm2 kill` in the env’s app root)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -e local',
    '<%= config.bin %> <%= command.id %> -e local -s project',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description:
        'CLI env name (from `nb env` / `nb install`). Defaults to the current env when omitted',
    }),
    scope: Flags.string({
      char: 's',
      description: 'Config scope for resolving the env',
      options: ['project', 'global'],
      default: 'project',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Stop);

    const scope = flags.scope as Exclude<CliHomeScope, 'auto'>;
    const env = await getEnv(flags.env?.trim() || undefined, { scope });

    if (!env) {
      this.error('Env is not configured');
    }

    if (!env.config.appRootPath) {
      this.error(
        `Env "${env.name}" is a remote (API-only) environment: no local app root is saved, so this command cannot stop that instance on your machine. Add appRootPath for a local checkout, or stop the app on the server yourself.`,
      );
    }

    try {
      await runNocoBaseCommand(['pm2', 'kill'], { cwd: env.appRootPath, env: env.envVars });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
