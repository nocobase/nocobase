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
  stopDockerContainer,
} from '../../lib/app-runtime.js';
import { failTask, startTask, succeedTask } from '../../lib/ui.js';
import { formatUnmanagedDbMessage, resolveDbRuntime } from './shared.js';

function formatDbStopFailure(envName: string, message: string): string {
  if (/does not exist/i.test(message)) {
    return [
      `Can't stop the database for "${envName}" yet.`,
      'The saved built-in database container for this env could not be found on this machine.',
      'If it was removed manually, reinstall or reconnect the env before trying again.',
      `Details: ${message}`,
    ].join('\n');
  }

  return [
    `Couldn't stop the database for "${envName}".`,
    'Check that the built-in database runtime for this env is still available, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

export default class DbStop extends Command {
  static override description =
    'Stop the built-in database container for the selected env.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --verbose',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to stop the built-in database for. Defaults to the current env when omitted',
    }),
    verbose: Flags.boolean({
      description: 'Show raw shutdown output from the underlying Docker command',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DbStop);
    const requestedEnv = flags.env?.trim() || undefined;

    const runtime = await resolveDbRuntime(requestedEnv);
    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind !== 'builtin') {
      this.error(formatUnmanagedDbMessage('stop', runtime));
    }

    startTask(`Stopping the built-in database for "${runtime.envName}"...`);
    try {
      const state = await stopDockerContainer(runtime.containerName, {
        stdio: flags.verbose ? 'inherit' : 'ignore',
      });
      succeedTask(
        state === 'already-stopped'
          ? `The built-in database is already stopped for "${runtime.envName}".`
          : `The built-in database has stopped for "${runtime.envName}".`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      failTask(`Failed to stop the built-in database for "${runtime.envName}".`);
      this.error(formatDbStopFailure(runtime.envName, message));
    }
  }
}
