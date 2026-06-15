/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { runNocoBaseCommand } from '../../lib/run-npm.ts';
import { setVerboseMode } from '../../lib/ui.js';

export default class SourceBuild extends Command {
  static override hidden = false;
  static override args = {
    /** Matches `nb source build @nocobase/acl @nocobase/actions` — zero or more package names. */
    packages: Args.string({
      description: 'package names to build',
      multiple: true,
      required: false,
    }),
  };
  static override description = 'Run the legacy NocoBase build for the local source project (forwards to `npm run build` in the repo root)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --no-dts',
    '<%= config.bin %> <%= command.id %> --sourcemap',
    '<%= config.bin %> <%= command.id %> @nocobase/acl',
    '<%= config.bin %> <%= command.id %> @nocobase/acl @nocobase/actions',
  ];
  static override flags = {
    'cwd': Flags.string({ description: 'Current working directory', char: 'c', required: false }),
    'no-dts': Flags.boolean({ description: 'not generate dts' }),
    sourcemap: Flags.boolean({ description: 'generate sourcemap' }),
    verbose: Flags.boolean({ description: 'Show detailed command output', default: false }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SourceBuild);
    setVerboseMode(flags.verbose);
    const packages = args.packages ?? [];
    const npmArgs = ['build', ...packages];
    if (flags['no-dts']) {
      npmArgs.push('--no-dts');
    }
    if (flags.sourcemap) {
      npmArgs.push('--sourcemap');
    }
    try {
      await runNocoBaseCommand(npmArgs, {
        cwd: flags['cwd'],
        stdio: flags.verbose ? 'inherit' : 'ignore',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
