/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { runNpm } from '../lib/run-npm.ts';

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
    env: Flags.string({ description: 'Environment', char: 'e', required: false }),
    'no-dts': Flags.boolean({ description: 'not generate dts' }),
    sourcemap: Flags.boolean({ description: 'generate sourcemap' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Build);
    const packages = args.packages ?? [];
    const forwarded: string[] = [...packages];
    if (flags['no-dts']) {
      forwarded.push('--no-dts');
    }
    if (flags.sourcemap) {
      forwarded.push('--sourcemap');
    }

    const npmArgs = ['nocobase', 'build'];
    if (forwarded.length > 0) {
      npmArgs.push('--', ...forwarded);
    }

    try {
      await runNpm(process.cwd(), npmArgs);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(
        [
          'Failed to run `npm run build`.',
          'Run from the NocoBase repo root (where the `build` script runs `nocobase-v1 build`), or invoke the legacy CLI directly.',
          message,
        ].join('\n'),
        { exit: 1 },
      );
    }
  }
}
