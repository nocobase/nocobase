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
  runLocalNocoBaseCommand,
  stopDockerContainer,
} from '../lib/app-runtime.js';
import { failTask, startTask, succeedTask } from '../lib/ui.js';

function formatStopFailure(envName: string, message: string): string {
  if (/does not exist/i.test(message)) {
    return [
      `Can't stop NocoBase for "${envName}" yet.`,
      'The saved Docker app for this env could not be found on this machine.',
      'If it was removed manually, reinstall or reconnect the env before trying again.',
      `Details: ${message}`,
    ].join('\n');
  }

  return [
    `Couldn't stop NocoBase for "${envName}".`,
    'Check that the local app or Docker runtime is still available, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

export default class Stop extends Command {
  static override description =
    'Stop NocoBase for the selected env. Local npm/git installs stop the app process, and Docker installs stop the saved app container.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env local',
    '<%= config.bin %> <%= command.id %> --env local --verbose',
    '<%= config.bin %> <%= command.id %> --env local-docker',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to stop. Defaults to the current env when omitted',
    }),
    verbose: Flags.boolean({
      description: 'Show raw shutdown output from the underlying local or Docker command',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Stop);
    const requestedEnv = flags.env?.trim() || undefined;

    const runtime = await resolveManagedAppRuntime(requestedEnv);
    const commandStdio = flags.verbose ? 'inherit' : 'ignore';

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'remote') {
      this.error(
        [
          `Can't stop "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app or Docker runtime to stop here.',
          'If the app is running on a server, stop it there or reconnect this env to a local runtime first.',
        ].join('\n'),
      );
    }

    if (runtime.kind === 'docker') {
      startTask(`Stopping NocoBase for "${runtime.envName}"...`);
      try {
        const state = await stopDockerContainer(runtime.containerName, {
          stdio: commandStdio,
        });
        succeedTask(
          state === 'already-stopped'
            ? `NocoBase is already stopped for "${runtime.envName}".`
            : `NocoBase has stopped for "${runtime.envName}".`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failTask(`Failed to stop NocoBase for "${runtime.envName}".`);
        this.error(formatStopFailure(runtime.envName, message));
      }
      return;
    }

    startTask(`Stopping NocoBase for "${runtime.envName}"...`);
    try {
      await runLocalNocoBaseCommand(runtime, ['pm2', 'kill'], {
        stdio: commandStdio,
      });
      succeedTask(`NocoBase has stopped for "${runtime.envName}".`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failTask(`Failed to stop NocoBase for "${runtime.envName}".`);
      this.error(formatStopFailure(runtime.envName, message));
    }
  }
}
