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
import { resolveSessionIdentity } from '../../lib/session-id.js';
import { isInteractiveTerminal, printInfo } from '../../lib/ui.js';

export default class EnvUse extends Command {
  static override summary = 'Switch the current environment';

  static override examples = [
    '<%= config.bin %> <%= command.id %> local',
  ];

  static override args = {
    name: Args.string({
      description: 'Configured environment name to switch to',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(EnvUse);
    await setCurrentEnv(args.name, { scope: resolveDefaultConfigScope() });
    this.log(`Current env: ${args.name}`);

    const identity = resolveSessionIdentity();
    if (identity || !isInteractiveTerminal()) {
      return;
    }

    this.log('Session mode is not enabled for the current shell or runtime.');
    this.log('Without session mode, switching the current env here can affect other sessions running in parallel.');
    this.log('');
    printInfo('Run `nb session setup` to enable session mode for this shell or runtime.');
  }
}
