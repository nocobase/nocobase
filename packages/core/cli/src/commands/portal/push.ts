/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { getCurrentEnvName, getEnv } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { translateCli } from '../../lib/cli-locale.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import { pushPortalSource } from '../../lib/portal-source.js';
import { printInfo, printSuccess } from '../../lib/ui.js';

const portalPushText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalPush.${key}`, values, { fallback });

export default class PortalPush extends Command {
  static override summary = 'Push local portal source changes to source storage';

  static override examples = [
    '<%= config.bin %> <%= command.id %> customer',
    '<%= config.bin %> <%= command.id %> customer --env prod --yes',
    '<%= config.bin %> <%= command.id %> customer --message "Update customer portal"',
  ];

  static override args = {
    portal: Args.string({
      required: true,
      description: 'Portal name',
    }),
  };

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name; omitted uses the current env',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    message: Flags.string({
      char: 'm',
      description: 'Source update message; used as the Git commit message for Git-managed source',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PortalPush);
    const requestedEnv = hasExplicitEnvSelection(this.argv) ? flags.env : undefined;
    const confirmed = await ensureCrossEnvConfirmed({
      command: this,
      requestedEnv,
      yes: flags.yes,
    });
    if (!confirmed) {
      return;
    }

    const scope = resolveDefaultConfigScope();
    const envName = requestedEnv ?? (await getCurrentEnvName({ scope }));
    const env = await getEnv(envName, { scope });
    if (!env) {
      this.error(
        portalPushText(
          requestedEnv ? 'errors.envNotConfigured' : 'errors.noEnvConfigured',
          { envName },
          requestedEnv
            ? `Env "${envName}" is not configured. Run \`nb env add ${envName} --api-base-url <url>\` first.`
            : 'No NocoBase env is configured yet. Run `nb init --ui` to create one first.',
        ),
      );
    }

    const result = await pushPortalSource({
      portal: args.portal,
      env,
      envName,
      cliVersion: String(this.config.pjson.version ?? '').trim(),
      message: flags.message,
    });

    if (!result.changed) {
      printInfo(result.noopReason ?? portalPushText('messages.noop', undefined, 'No push is needed.'));
      return;
    }

    printSuccess(
      portalPushText(
        'messages.pushed',
        { portal: result.portal, sourceRevision: result.sourceRevision ?? '' },
        result.sourceRevision
          ? `Pushed portal source "${result.portal}" (${result.sourceRevision}).`
          : `Pushed portal source "${result.portal}".`,
      ),
    );
  }
}
