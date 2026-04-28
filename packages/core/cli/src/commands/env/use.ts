/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command } from '@oclif/core';
import { setCurrentEnv } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';

export default class EnvUse extends Command {
  static override summary = 'Switch the current environment';

  static override examples = [
    '<%= config.bin %> <%= command.id %> local',
  ];

  static override args = {
    name: Args.string({
      description: 'Configured environment name',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(EnvUse);
    await setCurrentEnv(args.name, { scope: resolveDefaultConfigScope() });
    this.log(`Current env: ${args.name}`);
  }
}
