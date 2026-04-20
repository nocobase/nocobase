/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core'
import { runNocoBaseCommand } from '../lib/run-npm.ts';

export default class Start extends Command {
  static override description = 'Run the legacy NocoBase start (forwards to `npm run start` in the repo root)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --quickstart',
    '<%= config.bin %> <%= command.id %> --port 12000',
    '<%= config.bin %> <%= command.id %> --daemon',
    '<%= config.bin %> <%= command.id %> --instances 2',
    '<%= config.bin %> <%= command.id %> --launch-mode pm2',
  ]
  static override flags = {
    env: Flags.string({ description: 'Environment', char: 'e', required: false }),
    quickstart: Flags.boolean({ description: 'Quickstart the application', required: false }),
    port: Flags.string({ description: 'Port', char: 'p', required: false }),
    daemon: Flags.boolean({ description: 'Run the application as a daemon', char: 'd', required: false }),
    instances: Flags.integer({ description: 'Number of instances to run', char: 'i', required: false }),
    'launch-mode': Flags.string({ description: 'Launch Mode', required: false, options: ['pm2', 'node'] }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Start);

    const npmArgs = ['start'];

    if (flags.quickstart) {
      npmArgs.push('--quickstart');
    }
    if (flags.port) {
      npmArgs.push('--port', flags.port);
    }
    if (flags.daemon) {
      npmArgs.push('--daemon');
    }
    if (flags.instances) {
      npmArgs.push('--instances', flags.instances.toString());
    }
    if (flags['launch-mode']) {
      npmArgs.push('--launch-mode', flags['launch-mode']);
    }
    try {
      await runNocoBaseCommand(npmArgs);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}

