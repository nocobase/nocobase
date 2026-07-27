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
import { devPortalWorkspace } from '../../lib/portal-dev.js';
import { printInfo } from '../../lib/ui.js';

const portalDevText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalDev.${key}`, values, { fallback });

export default class PortalDev extends Command {
  static override summary = 'Start a portal in development mode';

  static override examples = [
    '<%= config.bin %> <%= command.id %> customer',
    '<%= config.bin %> <%= command.id %> customer --env dev --yes',
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
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PortalDev);
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
        portalDevText(
          requestedEnv ? 'errors.envNotConfigured' : 'errors.noEnvConfigured',
          { envName },
          requestedEnv
            ? `Env "${envName}" is not configured. Run \`nb env add ${envName} --api-base-url <url>\` first.`
            : 'No NocoBase env is configured yet. Run `nb init --ui` to create one first.',
        ),
      );
    }

    await devPortalWorkspace({
      portal: args.portal,
      env,
      onStart: (result) => {
        printInfo(
          portalDevText('messages.starting', { portal: result.portal }, `Starting portal "${result.portal}"...`),
        );
        printInfo(portalDevText('messages.mode', { mode: result.mode }, `Mode: ${result.mode}`));
        printInfo(portalDevText('messages.app', { app: result.app }, `App: ${result.app}`));
        printInfo(portalDevText('messages.base', { base: result.portalBase }, `Base: ${result.portalBase}`));
        printInfo(portalDevText('messages.dir', { dir: result.portalDir }, `Dir: ${result.portalDir}`));
      },
    });
  }
}
