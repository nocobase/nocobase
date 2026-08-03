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
import { findPortalListItem, formatPortalInfo } from '../../lib/portal-info.js';
import { listPortalWorkspaces, toPortalOutputItem } from '../../lib/portal-list.js';

const portalInfoText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalInfo.${key}`, values, { fallback });

export default class PortalInfo extends Command {
  static override summary = 'Show portal record and local file details';

  static override examples = [
    '<%= config.bin %> <%= command.id %> customer',
    '<%= config.bin %> <%= command.id %> customer --env dev --yes',
    '<%= config.bin %> <%= command.id %> customer --json',
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
    'json-output': Flags.boolean({
      char: 'j',
      aliases: ['json'],
      description: 'Print portal details as JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PortalInfo);
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
        portalInfoText(
          requestedEnv ? 'errors.envNotConfigured' : 'errors.noEnvConfigured',
          { envName },
          requestedEnv
            ? `Env "${envName}" is not configured. Run \`nb env add ${envName} --api-base-url <url>\` first.`
            : 'No NocoBase env is configured yet. Run `nb init --ui` to create one first.',
        ),
      );
    }

    const result = await listPortalWorkspaces({
      env,
      envName,
      cliVersion: String(this.config.pjson.version ?? '').trim(),
    });
    const portal = findPortalListItem(result.items, args.portal);
    if (!portal) {
      this.error(portalInfoText('errors.notFound', { portal: args.portal }, `Portal "${args.portal}" was not found.`));
    }
    const outputItem = toPortalOutputItem(portal);

    if (flags['json-output']) {
      this.log(JSON.stringify(outputItem, null, 2));
      return;
    }

    this.log(formatPortalInfo(portal));
  }
}
