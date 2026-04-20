/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import path from 'node:path';
import { runNocoBaseCommand, runNpm } from '../lib/run-npm.ts';
import { getEnv } from '../lib/auth-store.ts';

export default class Build extends Command {
  static override args = {
    /** Matches `nb build @nocobase/acl @nocobase/actions` — zero or more package names. */
    packages: Args.string({
      description: 'package names to build',
      multiple: true,
      required: false,
    }),
  };
  static override description = 'Run the legacy NocoBase build (forwards to `npm run build` in the repo root)';
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
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Build);
    let cwd = flags['cwd'] || process.cwd();
    if (!path.isAbsolute(cwd)) {
      cwd = path.resolve(process.cwd(), cwd);
    }
    const packages = args.packages ?? [];
    const npmArgs = ['build', ...packages];
    if (flags['no-dts']) {
      npmArgs.push('--no-dts');
    }
    if (flags.sourcemap) {
      npmArgs.push('--sourcemap');
    }
    try {
      await runNocoBaseCommand(npmArgs, cwd);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
