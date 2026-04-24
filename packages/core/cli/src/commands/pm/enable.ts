/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import {
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  runDockerNocoBaseCommand,
  runLocalNocoBaseCommand,
} from '../../lib/app-runtime.js';

export default class PmEnable extends Command {
  static override args = {
    packages: Args.string({
      required: true,
      multiple: true,
      description:
        'Plugin package name(s) to enable (e.g. `@nocobase/plugin-sample`). Pass one or more names as separate arguments.',
    }),
  };

  static override description = 'Enable one or more plugins in the selected env (npm/git runs locally, Docker runs inside the saved app container)';

  static override examples = [
    '<%= config.bin %> <%= command.id %> @nocobase/plugin-sample',
    '<%= config.bin %> <%= command.id %> @nocobase/plugin-a @nocobase/plugin-b',
    '<%= config.bin %> <%= command.id %> -e local @nocobase/plugin-sample',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description:
        'CLI env name (from `nb env` / `nb install`). Defaults to the current env when omitted',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PmEnable);
    const packages = args.packages;
    if (!Array.isArray(packages) || packages.length === 0) {
      this.error('Pass at least one plugin package name.');
    }

    const runtime = await resolveManagedAppRuntime(flags.env);

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(flags.env));
    }

    if (runtime.kind === 'local') {
      try {
        await runLocalNocoBaseCommand(runtime, ['pm', 'enable', ...packages]);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(message);
      }
      return;
    }

    if (runtime.kind === 'docker') {
      try {
        await runDockerNocoBaseCommand(runtime.containerName, ['pm', 'enable', ...packages]);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(message);
      }
      return;
    }

    await this.config.runCommand('api:pm:enable', ['--await-response', '--filter-by-tk', packages.join(',')]);
  }
}
