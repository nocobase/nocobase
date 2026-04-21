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

export default class Start extends Command {
  static override description =
    'Start NocoBase (`nocobase-v1 start` in the env’s local app root from CLI config)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -e local',
    '<%= config.bin %> <%= command.id %> --quickstart',
    '<%= config.bin %> <%= command.id %> --port 12000',
    '<%= config.bin %> <%= command.id %> --daemon',
    '<%= config.bin %> <%= command.id %> --instances 2',
    '<%= config.bin %> <%= command.id %> --launch-mode pm2',
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
    quickstart: Flags.boolean({ description: 'Quickstart the application', required: false }),
    port: Flags.string({ description: 'Port (overrides appPort from env config when set)', char: 'p', required: false }),
    daemon: Flags.boolean({ description: 'Run the application as a daemon', char: 'd', required: false }),
    instances: Flags.integer({ description: 'Number of instances to run', char: 'i', required: false }),
    'launch-mode': Flags.string({ description: 'Launch Mode', required: false, options: ['pm2', 'node'] }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Start);

    const scope = flags.scope as Exclude<CliHomeScope, 'auto'>;
    const env = await getEnv(flags.env?.trim() || undefined, { scope });

    if (!env) {
      this.error('Env is not configured');
    }

    if (!env.config.appRootPath) {
      this.error(
        `Env "${env.name}" is a remote (API-only) environment: no local app root is saved, so this command cannot start an app on your machine. Add appRootPath for a local checkout, or run the app on the server.`,
      );
    }

    const npmArgs = ['start'];

    if (flags.quickstart) {
      npmArgs.push('--quickstart');
    }
    if (flags.port) {
      npmArgs.push('--port', flags.port);
    } else if (env.appPort !== undefined && env.appPort !== null && String(env.appPort).trim() !== '') {
      npmArgs.push('--port', String(env.appPort));
    }
    if (flags.daemon) {
      npmArgs.push('--daemon');
    }
    if (flags.instances !== undefined) {
      npmArgs.push('--instances', flags.instances.toString());
    }
    if (flags['launch-mode']) {
      npmArgs.push('--launch-mode', flags['launch-mode']);
    }

    try {
      await runNocoBaseCommand(npmArgs, { cwd: env.appRootPath, env: env.envVars });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
