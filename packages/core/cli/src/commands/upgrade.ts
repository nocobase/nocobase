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
} from '../lib/app-runtime.js';

export default class Upgrade extends Command {
  static override description =
    'Upgrade the selected local NocoBase app (npm/git runs `nocobase-v1 upgrade`; Docker runs the upgrade command inside the saved app container)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -e local',
    '<%= config.bin %> <%= command.id %> --skip-code-update',
    '<%= config.bin %> <%= command.id %> -e local-docker --skip-code-update',
  ];
  static override flags = {
    env: Flags.string({
      char: 'e',
      description:
        'CLI env name (from `nb env` / `nb install`). Defaults to the current env when omitted',
    }),
    'skip-code-update': Flags.boolean({ description: 'Skip code update', char: 'S', required: false }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Upgrade);

    const runtime = await resolveManagedAppRuntime(flags.env);

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(flags.env));
    }

    if (runtime.kind === 'remote') {
      this.error(
        `Env "${runtime.envName}" is a remote (API-only) environment: no local app root or Docker app is saved, so this command cannot run upgrade on your machine. Add appRootPath for a local checkout, or run upgrade on the server.`,
      );
    }

    const npmArgs = ['upgrade'];
    if (flags['skip-code-update']) {
      npmArgs.push('--skip-code-update');
    }
    try {
      if (runtime.kind === 'docker') {
        await runDockerNocoBaseCommand(runtime.containerName, npmArgs);
      } else {
        await runLocalNocoBaseCommand(runtime, npmArgs);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
