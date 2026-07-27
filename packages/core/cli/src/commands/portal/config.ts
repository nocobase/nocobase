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
import { configurePortalWorkspace } from '../../lib/portal-configure.js';
import { printInfo, printSuccess } from '../../lib/ui.js';

const portalConfigureText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalConfigure.${key}`, values, { fallback });

export default class PortalConfig extends Command {
  static override summary = 'Update portal source configuration';

  static override examples = [
    '<%= config.bin %> <%= command.id %> customer --source-storage nocobase',
    '<%= config.bin %> <%= command.id %> customer --source-storage git --git-repo git@github.com:nocobase/customer-portal.git',
    '<%= config.bin %> <%= command.id %> customer --git-branch main --git-path customer',
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
    'source-storage': Flags.string({
      description: 'Where portal source code is managed',
      options: ['nocobase', 'git'],
    }),
    'git-repo': Flags.string({
      description: 'Git repository URL used when --source-storage=git',
    }),
    'git-branch': Flags.string({
      description: 'Git branch used when --source-storage=git',
    }),
    'git-path': Flags.string({
      description: 'Directory inside the Git repository for this portal; defaults to the portal slug',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PortalConfig);
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
        portalConfigureText(
          requestedEnv ? 'errors.envNotConfigured' : 'errors.noEnvConfigured',
          { envName },
          requestedEnv
            ? `Env "${envName}" is not configured. Run \`nb env add ${envName} --api-base-url <url>\` first.`
            : 'No NocoBase env is configured yet. Run `nb init --ui` to create one first.',
        ),
      );
    }

    const result = await configurePortalWorkspace({
      portal: args.portal,
      env,
      envName,
      cliVersion: String(this.config.pjson.version ?? '').trim(),
      sourceStorage: flags['source-storage'] as 'nocobase' | 'git' | undefined,
      gitRepo: flags['git-repo'],
      gitBranch: flags['git-branch'],
      gitPath: flags['git-path'],
    });

    printSuccess(
      portalConfigureText(
        'messages.updated',
        { portal: result.portal, portalDir: result.portalDir },
        `Portal "${result.portal}" configuration updated at ${result.portalDir}/portal.config.json.`,
      ),
    );
    printInfo(
      result.remoteSynced
        ? portalConfigureText('messages.remoteSynced', undefined, 'Remote portal record: synced')
        : portalConfigureText(
            'messages.remoteSkipped',
            undefined,
            'Remote portal record: not found; local config only',
          ),
    );
  }
}
