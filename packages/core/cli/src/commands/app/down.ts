/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { printWarning } from '../../lib/ui.js';

export default class AppDown extends Command {
  static override hidden = true;
  static override description =
    'Deprecated compatibility alias for `nb app stop --with-db` and `nb env remove <name> --purge`.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --all --force',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to bring down. Defaults to the current env when omitted',
    }),
    all: Flags.boolean({
      description: 'Delete everything for this env, including storage data and the saved env config',
      default: false,
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Compatibility alias for confirmation flags on the replacement command',
      default: false,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Compatibility alias for confirmation flags on the replacement command',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show raw output from shutdown commands',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppDown);
    const runCommand = this.config.runCommand.bind(this.config) as (id: string, argv?: string[]) => Promise<unknown>;
    const envName = flags.env?.trim();
    const argv: string[] = [];

    if (envName) {
      argv.push('--env', envName);
    }
    if (flags.verbose) {
      argv.push('--verbose');
    }

    if (flags.all) {
      printWarning('`nb app down --all` is deprecated. Use `nb env remove <name> --purge` instead.');
      if (flags.force || flags.yes) {
        argv.push('--force');
      }
      await runCommand('app:destroy', argv);
      return;
    }

    printWarning('`nb app down` is deprecated. Use `nb app stop --with-db` instead.');
    argv.push('--with-db');
    if (flags.yes) {
      argv.push('--yes');
    }
    if (flags.force) {
      argv.push('--force');
    }
    await runCommand('app:stop', argv);
  }
}
