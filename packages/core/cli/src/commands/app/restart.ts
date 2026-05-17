/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';

function argvHasToken(argv: string[], tokens: string[]): boolean {
  return tokens.some((token) => argv.includes(token));
}

function pushFlag(argv: string[], flag: string, value: string | number | undefined): void {
  if (value !== undefined) {
    argv.push(flag, String(value));
  }
}

export default class AppRestart extends Command {
  static override hidden = false;
  static override description =
    'Restart NocoBase for the selected env by stopping it first, then starting it again.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env local',
    '<%= config.bin %> <%= command.id %> --env local --quickstart',
    '<%= config.bin %> <%= command.id %> --env local --port 12000',
    '<%= config.bin %> <%= command.id %> --env local --daemon',
    '<%= config.bin %> <%= command.id %> --env local --no-daemon',
    '<%= config.bin %> <%= command.id %> --env local --instances 2',
    '<%= config.bin %> <%= command.id %> --env local --launch-mode pm2',
    '<%= config.bin %> <%= command.id %> --env local --verbose',
    '<%= config.bin %> <%= command.id %> --env local-docker',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to restart. Defaults to the current env when omitted',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    quickstart: Flags.boolean({ description: 'Quickstart the application after stopping it', required: false }),
    port: Flags.string({ description: 'Port (overrides appPort from env config when set)', char: 'p', required: false }),
    daemon: Flags.boolean({
      description: 'Run the application as a daemon after stopping it (default: true; use --no-daemon to stay in the foreground)',
      char: 'd',
      required: false,
      default: true,
      allowNo: true,
    }),
    instances: Flags.integer({ description: 'Number of instances to run after stopping it', char: 'i', required: false }),
    'launch-mode': Flags.string({ description: 'Launch Mode', required: false, options: ['pm2', 'node'] }),
    verbose: Flags.boolean({
      description: 'Show raw shutdown/startup output from the underlying local or Docker command',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppRestart);
    const requestedEnv = flags.env?.trim() || undefined;
    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv));
    if (explicitEnvSelection) {
      const confirmed = await ensureCrossEnvConfirmed({
        command: this,
        requestedEnv,
        yes: flags.yes,
      });
      if (!confirmed) {
        return;
      }
    }
    const stopArgv: string[] = [];
    const daemonFlagWasProvided = argvHasToken(this.argv, ['--daemon', '--no-daemon']);

    pushFlag(stopArgv, '--env', requestedEnv);
    if (flags.yes || explicitEnvSelection) {
      stopArgv.push('--yes');
    }
    if (flags.verbose) {
      stopArgv.push('--verbose');
    }

    await this.config.runCommand('app:stop', stopArgv);

    const startArgv = [...stopArgv];
    if (flags.quickstart) {
      startArgv.push('--quickstart');
    }
    pushFlag(startArgv, '--port', flags.port);
    if (daemonFlagWasProvided) {
      startArgv.push(flags.daemon === false ? '--no-daemon' : '--daemon');
    }
    pushFlag(startArgv, '--instances', flags.instances);
    pushFlag(startArgv, '--launch-mode', flags['launch-mode']);

    await this.config.runCommand('app:start', startArgv);
  }
}
