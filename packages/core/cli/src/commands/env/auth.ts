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
import { type CliHomeScope, formatCliHomeScope } from '../../lib/cli-home.js';
import { authenticateEnvWithOauth } from '../../lib/env-auth.js';
import { failTask, startTask, succeedTask } from '../../lib/ui.js';

export default class EnvAuth extends Command {
  static override summary = 'Sign in to a saved NocoBase environment with OAuth';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> prod',
    '<%= config.bin %> <%= command.id %> --scope global',
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
    scope: Flags.string({
      char: 's',
      description: 'Config scope',
      options: ['project', 'global'],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvAuth);
    const scope = flags.scope as Exclude<CliHomeScope, 'auto'> | undefined;
    const nameArg = args.name?.trim();
    const nameFlag = flags.env?.trim() || undefined;
    if (nameArg && nameFlag && nameArg !== nameFlag) {
      this.error(
        `Environment name was provided both as the argument ("${nameArg}") and as --env ("${nameFlag}"). Please use only one.`,
      );
    }
    const envName = nameArg || nameFlag || (await getCurrentEnvName({ scope }));

    startTask(`Starting browser sign-in for "${envName}"${scope ? ` (${formatCliHomeScope(scope)} scope)` : ''}...`);

    try {
      await authenticateEnvWithOauth({
        envName,
        scope,
      });
      succeedTask(`Signed in to "${envName}"${scope ? ` in ${formatCliHomeScope(scope)} scope` : ''}.`);
    } catch (error) {
      failTask(`Sign-in failed for "${envName}"${scope ? ` in ${formatCliHomeScope(scope)} scope` : ''}.`);
      throw error;
    }
  }
}
