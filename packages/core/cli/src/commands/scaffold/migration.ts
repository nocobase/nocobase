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

export default class ScaffoldMigration extends Command {
  static override args = {
    name: Args.string({description: 'migration name', required: true}),
  }
  static override description = 'Generate a plugin migration file.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> migration-name --pkg @nocobase/plugin-acl',
    '<%= config.bin %> <%= command.id %> migration-name --pkg @nocobase/plugin-acl --on afterLoad',
  ]
  static override flags = {
    pkg: Flags.string({description: 'plugin package name', required: true}),
    on: Flags.string({description: 'on', required: false, options: ['beforeLoad', 'afterSync', 'afterLoad']}),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ScaffoldMigration)
    const npmArgs = ['create-migration', args.name, '--pkg', flags.pkg];
    if (flags.on) {
      npmArgs.push('--on', flags.on);
    }
    try {
      await runNocoBaseCommand(npmArgs, { env: { LOGGER_SILENT: 'true' } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
