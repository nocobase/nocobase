/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import {
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  runDockerNocoBaseCommand,
  runLocalNocoBaseCommand,
} from '../../lib/app-runtime.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import { isCliManagedSourceApp, summarizePluginWorkspaceSync, syncPluginWorkspace } from '../../lib/plugin-workspace.js';
import { announceTargetEnv, printInfo, printWarning } from '../../lib/ui.js';

export default class PluginEnable extends Command {
  static override hidden = false;
  static override args = {
    packages: Args.string({
      required: true,
      multiple: true,
      description:
        'Plugin package name(s) to enable (e.g. `@nocobase/plugin-sample`). Pass one or more names as separate arguments.',
    }),
  };

  static override description = 'Enable one or more plugins in the selected env (npm/git runs locally, Docker runs inside the saved app container)';

  static override examples = [
    '<%= config.bin %> <%= command.id %> @nocobase/plugin-sample',
    '<%= config.bin %> <%= command.id %> @nocobase/plugin-a @nocobase/plugin-b',
    '<%= config.bin %> <%= command.id %> -e local @nocobase/plugin-sample',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to enable plugins for. Defaults to the current env when omitted',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PluginEnable);
    const requestedEnv = flags.env?.trim() || undefined;
    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv));
    if (explicitEnvSelection) {
      const confirmed = await ensureCrossEnvConfirmed({
        command: this,
        requestedEnv,
        yes: flags.yes,
      });
      if (!confirmed) {
        return;
      }
    }
    const packages = args.packages;
    if (!Array.isArray(packages) || packages.length === 0) {
      this.error('Pass at least one plugin package name.');
    }

    const runtime = await resolveManagedAppRuntime(requestedEnv);

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    announceTargetEnv(runtime.envName);

    if (runtime.kind === 'local') {
      try {
        if (isCliManagedSourceApp({ appPath: runtime.env.appPath, sourcePath: runtime.env.sourcePath })) {
          const syncResult = await syncPluginWorkspace({
            appPath: runtime.env.appPath,
            sourcePath: runtime.env.sourcePath,
            mode: 'targeted',
            targetPackageNames: packages,
          });
          const summary = summarizePluginWorkspaceSync(syncResult);
          if (summary.length > 0) {
            printInfo(`Plugin workspace synced: ${summary.join('; ')}`);
          }
          for (const warning of syncResult.warnings) {
            printWarning(warning);
          }
        }
        await runLocalNocoBaseCommand(runtime, ['pm', 'enable', ...packages]);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(message);
      }
      return;
    }

    if (runtime.kind === 'docker') {
      try {
        await runDockerNocoBaseCommand(runtime.containerName, ['pm', 'enable', ...packages]);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(message);
      }
      return;
    }

    await this.config.runCommand('api:pm:enable', explicitEnvSelection
      ? ['--await-response', '--filter-by-tk', packages.join(','), '--env', runtime.envName, '--yes']
      : ['--await-response', '--filter-by-tk', packages.join(',')]);
  }
}
