/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command } from '@oclif/core';

export default class PmDisable extends Command {
  static override args = {
    packages: Args.string({
      required: true,
      multiple: true,
      description:
        'Plugin package name(s) to disable (e.g. `@nocobase/plugin-sample`). Pass one or more names as separate arguments.',
    }),
  };

  static override description = 'Disable one or more plugins';

  static override examples = [
    '<%= config.bin %> <%= command.id %> @nocobase/plugin-sample',
    '<%= config.bin %> <%= command.id %> @nocobase/plugin-a @nocobase/plugin-b',
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(PmDisable);
    const packages = args.packages;
    if (!Array.isArray(packages) || packages.length === 0) {
      this.error('Pass at least one plugin package name.');
    }
    await this.config.runCommand('api:pm:disable', ['--await-response', '--filter-by-tk', packages.join(',')]);
  }
}
