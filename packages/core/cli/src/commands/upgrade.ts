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
import { runNocoBaseCommand } from '../lib/run-npm.ts';

export default class Upgrade extends Command {
  static override description =
    'Run the legacy NocoBase upgrade (forwards to `nocobase-v1 upgrade` in the env’s local app root from CLI config)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -e local',
    '<%= config.bin %> <%= command.id %> --skip-code-update',
  ];
  static override flags = {
    env: Flags.string({
      char: 'e',
      description:
        'CLI env name (from `nb env` / `nb install`). Defaults to the current env when omitted',
    }),
    'skip-code-update': Flags.boolean({ description: 'Skip code update', char: 'S', required: false }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Upgrade);

    const env = await getEnv(flags.env);

    if (!env) {
      this.error('Env is not configured');
    }

    if (!env.config.appRootPath) {
      this.error(
        `Env "${env.name}" is a remote (API-only) environment: no local app root is saved, so this command cannot run upgrade on your machine. Add appRootPath for a local checkout, or run upgrade on the server.`,
      );
    }

    const npmArgs = ['upgrade'];
    if (flags['skip-code-update']) {
      npmArgs.push('--skip-code-update');
    }
    try {
      await runNocoBaseCommand(npmArgs, { cwd: env.appRootPath, env: env.envVars });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
