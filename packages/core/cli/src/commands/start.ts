/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core'
import { runNpm } from '../lib/run-npm.ts';

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
    quickstart: Flags.boolean({ description: 'Quickstart the application', required: false }),
    port: Flags.string({ description: 'Port', char: 'p', required: false }),
    daemon: Flags.boolean({ description: 'Run the application as a daemon', char: 'd', required: false }),
    instances: Flags.integer({ description: 'Number of instances to run', char: 'i', required: false }),
    'launch-mode': Flags.string({ description: 'Launch Mode', required: false, options: ['pm2', 'node'] }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Start);
    const forwarded: string[] = [];
    if (flags.port) {
      forwarded.push('--port', flags.port);
    }
    if (flags.daemon) {
      forwarded.push('--daemon');
    }
    if (flags.instances) {
      forwarded.push('--instances', flags.instances.toString());
    }
    if (flags['launch-mode']) {
      forwarded.push('--launch-mode', flags['launch-mode']);
    }
    const npmArgs = ['nocobase', 'start'];
    if (forwarded.length > 0) {
      npmArgs.push('--', ...forwarded);
    }
    try {
      await runNpm(process.cwd(), npmArgs);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(
        [
          'Failed to run `npm run start`.',
          'Run from the NocoBase repo root (where the `start` script runs `nocobase-v1 start`), or invoke the legacy CLI directly.',
          message,
        ].join('\n'),
        { exit: 1 },
      );
    }
  }
}

