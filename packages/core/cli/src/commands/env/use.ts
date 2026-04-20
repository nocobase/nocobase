/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { setCurrentEnv } from '../../lib/auth-store.js';
import { formatCliHomeScope, type CliHomeScope } from '../../lib/cli-home.js';

export default class EnvUse extends Command {
  static override summary = 'Switch the current environment';

  static override examples = [
    '<%= config.bin %> <%= command.id %> local',
  ];

  static override flags = {
    scope: Flags.string({
      char: 's',
      description: 'Config scope',
      options: ['project', 'global'],
    }),
  };

  static override args = {
    name: Args.string({
      description: 'Configured environment name',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvUse);
    const scope = flags.scope as Exclude<CliHomeScope, 'auto'> | undefined;
    await setCurrentEnv(args.name, { scope });
    this.log(`Current env: ${args.name}${scope ? ` (${formatCliHomeScope(scope)} scope)` : ''}`);
  }
}
