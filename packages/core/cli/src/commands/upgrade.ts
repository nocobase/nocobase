/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core'
import { runNocoBaseCommand } from '../lib/run-npm.ts'

export default class Upgrade extends Command {
  static override description = 'Run the legacy NocoBase upgrade (forwards to `npm run upgrade` in the repo root)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --skip-code-update',
  ]
  static override flags = {
    env: Flags.string({ description: 'Environment', char: 'e', required: false }),
    'skip-code-update': Flags.boolean({ description: 'Skip code update', char: 'S', required: false }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Upgrade)
    const npmArgs = ['upgrade'];
    if (flags['skip-code-update']) {
      npmArgs.push('--skip-code-update');
    }
    try {
      await runNocoBaseCommand(npmArgs, process.cwd());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
