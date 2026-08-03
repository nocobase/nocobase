/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { getCurrentEnvName, getEnv, setEnvPortalPath } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { translateCli } from '../../lib/cli-locale.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import { pullPortalSource } from '../../lib/portal-source.js';
import { printInfo, printSuccess, printWarning } from '../../lib/ui.js';

const portalPullText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalPull.${key}`, values, { fallback });

export default class PortalPull extends Command {
  static override summary = 'Pull portal source into local files';

  static override examples = [
    '<%= config.bin %> <%= command.id %> customer',
    '<%= config.bin %> <%= command.id %> customer --env prod --yes',
    '<%= config.bin %> <%= command.id %> customer --path ./portals/customer',
    '<%= config.bin %> <%= command.id %> customer --force',
    '<%= config.bin %> <%= command.id %> customer --no-install',
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
    force: Flags.boolean({
      description: 'Delete the existing local files and pull them again',
      default: false,
    }),
    path: Flags.string({
      description: 'Portal workspace directory; defaults to the saved path, then ./<portal>',
    }),
    install: Flags.boolean({
      description: 'Run pnpm install after pulling the portal source',
      default: true,
      allowNo: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PortalPull);
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
        portalPullText(
          requestedEnv ? 'errors.envNotConfigured' : 'errors.noEnvConfigured',
          { envName },
          requestedEnv
            ? `Env "${envName}" is not configured. Run \`nb env add ${envName} --api-base-url <url>\` first.`
            : 'No NocoBase env is configured yet. Run `nb init --ui` to create one first.',
        ),
      );
    }

    const result = await pullPortalSource({
      portal: args.portal,
      env,
      envName,
      cliVersion: String(this.config.pjson.version ?? '').trim(),
      force: flags.force,
      installDependencies: flags.install,
      sourcePath: flags.path,
      defaultSourcePath: true,
    });

    if (!result.changed) {
      printInfo(result.noopReason ?? portalPullText('messages.noop', undefined, 'No pull is needed.'));
      return;
    }
    await setEnvPortalPath(envName, result.portal, result.portalDir, { scope });

    printSuccess(
      portalPullText(
        'messages.pulled',
        { portal: result.portal, portalDir: result.portalDir },
        `Pulled portal source "${result.portal}" into ${result.portalDir}`,
      ),
    );
    if (result.installFailed) {
      printWarning(
        portalPullText(
          'messages.installFailed',
          { portalDir: result.portalDir },
          `Dependency installation did not finish successfully. Run \`pnpm install\` manually in ${result.portalDir}.`,
        ),
      );
    }
  }
}
