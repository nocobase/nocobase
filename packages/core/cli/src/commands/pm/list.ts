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

export default class PmList extends Command {
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
      description:
        'CLI env name (from `nb env` / `nb install`). Defaults to the current env when omitted',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(PmList);

    const runtime = await resolveManagedAppRuntime(flags.env);

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(flags.env));
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

    await this.config.runCommand('api:pm:list', ['--mode=summary']);
  }
}
