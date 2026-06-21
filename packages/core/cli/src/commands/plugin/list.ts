/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import {
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  runDockerNocoBaseCommand,
  runLocalNocoBaseCommand,
} from '../../lib/app-runtime.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';

export default class PluginList extends Command {
  static override hidden = false;
  static override args = {};
  static override summary = 'List plugins for the selected env';
  static override description =
    'List installed plugins in the selected env (npm/git runs locally, Docker runs inside the saved app container, HTTP envs fall back to the API)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -e local',
    '<%= config.bin %> <%= command.id %> -e local-docker',
  ];
  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to inspect plugins for. Defaults to the current env when omitted',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(PluginList);
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

    const runtime = await resolveManagedAppRuntime(requestedEnv);

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'local') {
      try {
        await runLocalNocoBaseCommand(runtime, ['pm', 'list']);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(message);
      }
      return;
    }

    if (runtime.kind === 'docker') {
      try {
        await runDockerNocoBaseCommand(runtime.containerName, ['pm', 'list']);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(message);
      }
      return;
    }

    if (runtime.kind === 'ssh') {
      this.error(
        [
          `Can't list plugins for "${runtime.envName}" yet.`,
          'SSH env support is reserved but not implemented yet.',
          'Use a local, Docker, or HTTP env for plugin inspection right now.',
        ].join('\n'),
      );
    }

    await this.config.runCommand('api:pm:list', explicitEnvSelection
      ? ['--mode=summary', '--env', runtime.envName, '--yes']
      : ['--mode=summary']);
  }
}
