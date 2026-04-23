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
  resolveManagedAppRuntime,
  runLocalNocoBaseCommand,
  stopDockerContainer,
} from '../lib/app-runtime.js';

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
    const { flags } = await this.parse(Stop);

    const runtime = await resolveManagedAppRuntime(flags.env);

    if (!runtime) {
      this.error('No NocoBase env is configured yet. Run `nb install` or `nb env add` first.');
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
      try {
        await stopDockerContainer(runtime.containerName);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.error(formatStopFailure(runtime.envName, message));
      }
      return;
    }

    try {
      await runLocalNocoBaseCommand(runtime, ['pm2', 'kill']);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(formatStopFailure(runtime.envName, message));
    }
  }
}
