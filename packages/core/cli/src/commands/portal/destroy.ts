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
import { confirm } from '../../lib/inquirer.ts';
import { destroyPortalWorkspace } from '../../lib/portal-destroy.js';
import { isInteractiveTerminal, printInfo, printSuccess } from '../../lib/ui.js';

const portalDestroyText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalDestroy.${key}`, values, { fallback });

async function ensureDestroyConfirmed(options: { command: Command; portal: string; yes?: boolean }): Promise<boolean> {
  if (options.yes) {
    return true;
  }

  if (!isInteractiveTerminal()) {
    options.command.error(
      portalDestroyText(
        'errors.confirmationRequired',
        undefined,
        'Refusing to destroy a portal in non-interactive mode without --yes.',
      ),
    );
  }

  try {
    return Boolean(
      await confirm({
        message: portalDestroyText(
          'prompts.confirm',
          { portal: options.portal },
          `Destroy portal "${options.portal}" and delete its storage directory?`,
        ),
        default: false,
      }),
    );
  } catch {
    return false;
  }
}

export default class PortalDestroy extends Command {
  static override summary = 'Destroy a portal record and local files';

  static override examples = [
    '<%= config.bin %> <%= command.id %> customer --yes',
    '<%= config.bin %> <%= command.id %> customer --env dev --yes',
    '<%= config.bin %> <%= command.id %> customer --force --yes',
  ];

  static override args = {
    portal: Args.string({
      required: true,
      description: 'Portal name/slug',
    }),
  };

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name; omitted uses the current env',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip confirmation prompts',
      default: false,
    }),
    force: Flags.boolean({
      description: 'Ignore missing portal records or local files',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PortalDestroy);
    const requestedEnv = hasExplicitEnvSelection(this.argv) ? flags.env : undefined;
    const crossEnvConfirmed = await ensureCrossEnvConfirmed({
      command: this,
      requestedEnv,
      yes: flags.yes,
    });
    if (!crossEnvConfirmed) {
      return;
    }

    const destroyConfirmed = await ensureDestroyConfirmed({
      command: this,
      portal: args.portal,
      yes: flags.yes,
    });
    if (!destroyConfirmed) {
      return;
    }

    const scope = resolveDefaultConfigScope();
    const envName = requestedEnv ?? (await getCurrentEnvName({ scope }));
    const env = await getEnv(envName, { scope });
    if (!env) {
      this.error(
        portalDestroyText(
          requestedEnv ? 'errors.envNotConfigured' : 'errors.noEnvConfigured',
          { envName },
          requestedEnv
            ? `Env "${envName}" is not configured. Run \`nb env add ${envName} --api-base-url <url>\` first.`
            : 'No NocoBase env is configured yet. Run `nb init --ui` to create one first.',
        ),
      );
    }

    const result = await destroyPortalWorkspace({
      portal: args.portal,
      env,
      envName,
      cliVersion: String(this.config.pjson.version ?? '').trim(),
      force: flags.force,
    });

    printSuccess(
      portalDestroyText('messages.destroyed', { portal: result.portal }, `Portal "${result.portal}" destroyed.`),
    );
    printInfo(portalDestroyText('messages.mode', { mode: result.mode }, `Mode: ${result.mode}`));
    printInfo(portalDestroyText('messages.app', { app: result.app }, `App: ${result.app}`));
    printInfo(portalDestroyText('messages.base', { base: result.portalBase }, `Base: ${result.portalBase}`));
    printInfo(
      portalDestroyText(
        'messages.record',
        { status: result.recordDeleted ? 'deleted' : 'missing' },
        `Record: ${result.recordDeleted ? 'deleted' : 'missing'}`,
      ),
    );
    printInfo(
      portalDestroyText(
        'messages.workspace',
        { dir: result.portalDir, status: result.workspaceDeleted ? 'deleted' : 'missing' },
        `Portal files: ${result.workspaceDeleted ? 'deleted' : 'missing'} (${result.portalDir})`,
      ),
    );
  }
}
