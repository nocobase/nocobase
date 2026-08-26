/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../../lib/env-guard.js';
import { getEnv } from '../../../lib/auth-store.js';
import { formatMissingManagedAppEnvMessage } from '../../../lib/app-runtime.js';
import { announceTargetEnv } from '../../../lib/ui.js';
import { updateAutostartSetting } from './shared.js';

export default class AppAutostartDisable extends Command {
  static override description = 'Disable app autostart for the selected env.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --yes',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to remove from app autostart. Defaults to the current env when omitted',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppAutostartDisable);
    const requestedEnv = flags.env?.trim() || undefined;

    if (requestedEnv && hasExplicitEnvSelection(this.argv)) {
      const confirmed = await ensureCrossEnvConfirmed({
        command: this,
        requestedEnv,
        yes: flags.yes,
      });
      if (!confirmed) {
        return;
      }
    }

    const env = await getEnv(requestedEnv);
    if (!env?.name) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    const envName = env.name;
    await updateAutostartSetting(envName, false);
    announceTargetEnv(envName);
    this.log(`Disabled app autostart for "${envName}".`);
  }
}
