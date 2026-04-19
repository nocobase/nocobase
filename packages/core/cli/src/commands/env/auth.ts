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
  static summary = 'Authenticate an environment with OAuth';
  static id = 'env auth';

  static args = {
    name: Args.string({
      description: 'Environment name (omit to use the current env)',
      required: false,
    }),
  };

  static flags = {
    scope: Flags.string({
      char: 's',
      description: 'Config scope',
      options: ['project', 'global'],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvAuth);
    const scope = flags.scope as Exclude<CliHomeScope, 'auto'> | undefined;
    const envName = args.name;
    const envLabel = envName ?? (await getCurrentEnvName({ scope }));

    startTask(`Authenticating env: ${envLabel}${scope ? ` (${formatCliHomeScope(scope)})` : ''}`);

    try {
      await authenticateEnvWithOauth({
        envName,
        scope,
      });
      succeedTask(`Authenticated env "${envLabel}" with OAuth${scope ? ` in ${formatCliHomeScope(scope)} scope` : ''}.`);
    } catch (error) {
      failTask(`Failed to authenticate env "${envLabel}".`);
      throw error;
    }
  }
}
