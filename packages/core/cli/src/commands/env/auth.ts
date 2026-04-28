/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { getCurrentEnvName } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { authenticateEnvWithOauth } from '../../lib/env-auth.js';
import { failTask, startTask, succeedTask } from '../../lib/ui.js';

export default class EnvAuth extends Command {
  static override summary = 'Sign in to a saved NocoBase environment with OAuth';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> prod',
  ];

  static override args = {
    name: Args.string({
      description: 'Environment name (omit to use the current env)',
      required: false,
    }),
  };

  static override flags = {
    env: Flags.string({
      char: 'e',
      hidden: true,
      deprecated: true,
      description:
        'Environment name (same as the optional positional argument; for compatibility with -e/--env on other commands)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvAuth);
    const nameArg = args.name?.trim();
    const nameFlag = flags.env?.trim() || undefined;
    if (nameArg && nameFlag && nameArg !== nameFlag) {
      this.error(
        `Environment name was provided both as the argument ("${nameArg}") and as --env ("${nameFlag}"). Please use only one.`,
      );
    }
    const envName = nameArg || nameFlag || (await getCurrentEnvName({ scope: resolveDefaultConfigScope() }));

    startTask(`Starting browser sign-in for "${envName}"...`);

    try {
      await authenticateEnvWithOauth({
        envName,
        scope: resolveDefaultConfigScope(),
      });
      succeedTask(`Signed in to "${envName}".`);
    } catch (error) {
      failTask(`Sign-in failed for "${envName}".`);
      throw error;
    }
  }
}
