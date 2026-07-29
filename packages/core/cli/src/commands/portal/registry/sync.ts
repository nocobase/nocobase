/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { getCurrentEnvName, getEnv } from '../../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../../lib/cli-home.js';
import { translateCli } from '../../../lib/cli-locale.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../../lib/env-guard.js';
import { resolveAccessToken } from '../../../lib/env-auth.js';
import { syncPortalRegistries } from '../../../lib/portal-registry-sync.js';
import { printInfo, printSuccess, printWarning } from '../../../lib/ui.js';

const portalRegistrySyncText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalRegistrySync.${key}`, values, { fallback });

export default class PortalRegistrySync extends Command {
  static override summary = 'Install enabled NocoBase Portal Registries into an AI portal';

  static override examples = [
    '<%= config.bin %> <%= command.id %> customer',
    '<%= config.bin %> <%= command.id %> customer ai acl auth-sms',
    '<%= config.bin %> <%= command.id %> customer ai --overwrite',
    '<%= config.bin %> <%= command.id %> customer --overwrite --overwrite-ui',
    '<%= config.bin %> <%= command.id %> customer ai --diff',
  ];

  static override args = {
    portal: Args.string({ required: true, description: 'AI Portal name' }),
    items: Args.string({
      required: false,
      multiple: true,
      description: 'Registry item names; omitted installs all Registries exposed by enabled plugins',
    }),
  };

  static override flags = {
    env: Flags.string({ char: 'e', description: 'CLI env name; omitted uses the current env' }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    overwrite: Flags.boolean({
      description: 'Overwrite installed Registry files while preserving existing src/components/ui files',
      default: false,
    }),
    'overwrite-ui': Flags.boolean({
      description: 'Allow --overwrite to replace existing src/components/ui files',
      default: false,
    }),
    diff: Flags.boolean({
      description: 'Show Registry file differences without changing the portal',
      default: false,
    }),
    build: Flags.boolean({
      description: 'Build the portal after installing Registry items',
      default: false,
    }),
    'skip-if-unsupported': Flags.boolean({
      description: 'Skip automatic Registry installation when the service does not expose Portal Registries',
      hidden: true,
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PortalRegistrySync);
    const requestedEnv = hasExplicitEnvSelection(this.argv) ? flags.env : undefined;
    const confirmed = await ensureCrossEnvConfirmed({ command: this, requestedEnv, yes: flags.yes });
    if (!confirmed) {
      return;
    }

    const scope = resolveDefaultConfigScope();
    const envName = requestedEnv ?? (await getCurrentEnvName({ scope }));
    const env = await getEnv(envName, { scope });
    if (!env) {
      this.error(
        portalRegistrySyncText(
          requestedEnv ? 'errors.envNotConfigured' : 'errors.noEnvConfigured',
          { envName },
          requestedEnv
            ? `Env "${envName}" is not configured. Run \`nb env add ${envName} --api-base-url <url>\` first.`
            : 'No NocoBase env is configured yet. Run `nb init --ui` to create one first.',
        ),
      );
    }
    const token = await resolveAccessToken({ envName, baseUrl: env.apiBaseUrl, scope });

    const result = await syncPortalRegistries({
      portal: args.portal,
      items: args.items,
      env,
      overwrite: flags.overwrite,
      overwriteUi: flags['overwrite-ui'],
      diff: flags.diff,
      build: flags.build,
      skipIfUnsupported: flags['skip-if-unsupported'],
      token,
      onWarning: (message) => printWarning(message),
    });
    if (result.status === 'unsupported') {
      return;
    }
    if (result.status === 'diffed') {
      printInfo(
        portalRegistrySyncText(
          'messages.diffCompleted',
          { portal: result.portal },
          `Portal Registry diff completed for "${result.portal}".`,
        ),
      );
      return;
    }
    if (result.skippedItems.length > 0) {
      printInfo(
        portalRegistrySyncText(
          'messages.skipped',
          { items: result.skippedItems.join(', ') },
          `Already installed, skipped: ${result.skippedItems.join(', ')}.`,
        ),
      );
    }
    if (result.items.length === 0) {
      printSuccess(
        portalRegistrySyncText(
          'messages.upToDate',
          { portal: result.portal },
          `Portal Registry items in "${result.portal}" are up to date.`,
        ),
      );
      return;
    }
    printSuccess(
      portalRegistrySyncText(
        'messages.synced',
        { portal: result.portal, items: result.items.join(', ') },
        `Portal Registry items installed in "${result.portal}": ${result.items.join(', ')}.`,
      ),
    );
  }
}
