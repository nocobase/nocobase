/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { getEnv } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { translateCli } from '../../lib/cli-locale.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import { createPortalWorkspace } from '../../lib/portal-create.js';
import { printInfo, printSuccess } from '../../lib/ui.js';

const DEFAULT_PORTAL_TEMPLATE = '@nocobase/portal-template-default';
const portalCreateText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalCreate.${key}`, values, { fallback });

export default class PortalCreate extends Command {
  static override summary = 'Create a local Portal workspace from a template';

  static override examples = [
    '<%= config.bin %> <%= command.id %> customer',
    '<%= config.bin %> <%= command.id %> customer --template @nocobase/portal-template-default',
    '<%= config.bin %> <%= command.id %> customer --env dev --yes',
  ];

  static override args = {
    portal: Args.string({
      required: true,
      description: 'Portal name/slug',
    }),
  };

  static override flags = {
    template: Flags.string({
      description: 'Template package, local path, or file:// URL',
      default: DEFAULT_PORTAL_TEMPLATE,
    }),
    env: Flags.string({
      char: 'e',
      description: 'CLI env name; omitted uses the current env',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    title: Flags.string({
      description: 'Portal display title; defaults to a title generated from the portal slug',
    }),
    force: Flags.boolean({
      description: 'Delete the existing Portal workspace and recreate it',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PortalCreate);
    const requestedEnv = hasExplicitEnvSelection(this.argv) ? flags.env : undefined;
    const confirmed = await ensureCrossEnvConfirmed({
      command: this,
      requestedEnv,
      yes: flags.yes,
    });
    if (!confirmed) {
      return;
    }

    const env = await getEnv(flags.env, { scope: resolveDefaultConfigScope() });
    if (!env) {
      this.error(
        flags.env
          ? portalCreateText(
              'errors.envNotConfigured',
              { envName: flags.env },
              `Env "${flags.env}" is not configured. Run \`nb env add ${flags.env} --api-base-url <url>\` first.`,
            )
          : portalCreateText(
              'errors.noEnvConfigured',
              undefined,
              'No NocoBase env is configured yet. Run `nb init --ui` to create one first.',
            ),
      );
    }

    const result = await createPortalWorkspace({
      portal: args.portal,
      title: flags.title,
      template: flags.template,
      env,
      force: flags.force,
      onSkipInstall: (message) => printInfo(message),
    });

    printSuccess(
      portalCreateText(
        'messages.created',
        { portal: result.portal, portalDir: result.portalDir },
        `Portal "${result.portal}" created at ${result.portalDir}.`,
      ),
    );
    printInfo(portalCreateText('messages.app', { app: result.app }, `App: ${result.app}`));
    printInfo(portalCreateText('messages.base', { base: result.portalBase }, `Base: ${result.portalBase}`));
  }
}
