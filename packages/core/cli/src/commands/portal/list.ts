/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { getCurrentEnvName, getEnv } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { translateCli } from '../../lib/cli-locale.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import { listPortalWorkspaces } from '../../lib/portal-list.js';
import { printInfo, renderTable } from '../../lib/ui.js';

const portalListText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalList.${key}`, values, { fallback });

function formatBoolean(value: boolean | null): string {
  if (value === null) {
    return '';
  }
  return value ? 'yes' : 'no';
}

export default class PortalList extends Command {
  static override summary = 'List Portal records and local workspace sync status';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env dev --yes',
  ];

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
    const { flags } = await this.parse(PortalList);
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
        portalListText(
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

    if (!result.items.length) {
      printInfo(portalListText('messages.empty', undefined, 'No Portal records found.'));
      return;
    }

    this.log(
      renderTable(
        [
          portalListText('table.name', undefined, 'Name'),
          portalListText('table.url', undefined, 'URL'),
          portalListText('table.developmentMode', undefined, 'Development mode'),
          portalListText('table.path', undefined, 'Local path'),
          portalListText('table.enabled', undefined, 'Enabled'),
          portalListText('table.localSynced', undefined, 'Local synced'),
        ],
        result.items.map((item) => [
          item.routeName,
          item.portalUrl,
          item.developmentMode,
          item.localSynced === true ? item.portalDir : '',
          formatBoolean(item.enabled),
          formatBoolean(item.localSynced),
        ]),
      ),
    );
  }
}
