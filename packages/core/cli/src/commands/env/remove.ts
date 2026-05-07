/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { getCurrentEnvName, removeEnv } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { confirmAction, isInteractiveTerminal, printVerbose, setVerboseMode } from '../../lib/ui.js';

export default class EnvRemove extends Command {
  static override summary = 'Remove a configured environment';

  static override examples = [
    '<%= config.bin %> <%= command.id %> staging',
    '<%= config.bin %> <%= command.id %> staging -f',
  ];

  static override flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Remove without confirmation',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed progress output',
      default: false,
    }),
  };

  static override args = {
    name: Args.string({
      description: 'Configured environment name',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvRemove);
    setVerboseMode(flags.verbose);
    const currentEnv = await getCurrentEnvName({ scope: resolveDefaultConfigScope() });

    if (args.name === currentEnv && !flags.force) {
      if (!isInteractiveTerminal()) {
        this.error('Refusing to remove the current env without confirmation. Re-run with `--force`.');
      }

      const confirmed = await confirmAction(`Remove current env "${args.name}"?`, { defaultValue: false });
      if (!confirmed) {
        this.log('Canceled.');
        return;
      }
    }

    printVerbose(`Removing env "${args.name}"`);
    const result = await removeEnv(args.name, { scope: resolveDefaultConfigScope() });

    this.log(`Removed env "${result.removed}".`);

    if (result.hasEnvs) {
      this.log(`Current env: ${result.currentEnv}`);
      return;
    }

    this.log('No envs configured.');
  }
}
