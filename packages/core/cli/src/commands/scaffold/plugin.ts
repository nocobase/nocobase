/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {Args, Command, Flags} from '@oclif/core'
import { runNocoBaseCommand } from '../../lib/run-npm.ts';

export default class ScaffoldPlugin extends Command {
  static override args = {
    pkg: Args.string({description: 'plugin package name', required: true}),
  }
  static override description = 'Run the legacy NocoBase scaffold plugin (forwards to `npm run scaffold:plugin` in the repo root)';
  static override examples = [
    '<%= config.bin %> <%= command.id %> @nocobase-example/plugin-hello',
    '<%= config.bin %> <%= command.id %> @nocobase-example/plugin-hello --force-recreate',
  ]

  static override flags = {
    'force-recreate': Flags.boolean({description: 'Force recreate the plugin', char: 'f', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ScaffoldPlugin)
    const npmArgs = ['pm', 'create', args.pkg];
    if (flags['force-recreate']) {
      npmArgs.push('--force-recreate');
    }
    try {
      await runNocoBaseCommand(npmArgs, { env: { LOGGER_SILENT: 'true' } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
