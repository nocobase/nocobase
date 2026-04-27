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
} from '../lib/app-runtime.js';
import { run } from '../lib/run-npm.js';
import { printInfo } from '../lib/ui.js';

function formatLogsFailure(envName: string, message: string): string {
  return [
    `Couldn't show logs for "${envName}".`,
    'Check that the saved local app or Docker container still exists on this machine, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

export default class Logs extends Command {
  static override description =
    'Show NocoBase logs for the selected env. Local npm/git installs use pm2 logs, and Docker installs use docker logs.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --tail 200',
    '<%= config.bin %> <%= command.id %> --env app1 --no-follow',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to inspect logs for. Defaults to the current env when omitted',
    }),
    tail: Flags.integer({
      description: 'Number of recent log lines to show before following',
      default: 100,
      min: 0,
    }),
    follow: Flags.boolean({
      char: 'f',
      description: 'Keep streaming new log lines',
      default: true,
      allowNo: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Logs);
    const requestedEnv = flags.env?.trim() || undefined;

    const runtime = await resolveManagedAppRuntime(requestedEnv);
    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'http') {
      this.error(
        [
          `Can't show runtime logs for "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app or Docker container to read logs from.',
          'Connect it to a local checkout or reinstall it with npm, git, or Docker if you want CLI-managed logs.',
        ].join('\n'),
      );
    }

    if (runtime.kind === 'ssh') {
      this.error(
        [
          `Can't show runtime logs for "${runtime.envName}" yet.`,
          'SSH env support is reserved but not implemented yet.',
          'Use a local or Docker env for CLI-managed logs for now.',
        ].join('\n'),
      );
    }

    const tail = String(flags.tail ?? 100);
    const follow = flags.follow !== false;
    printInfo(
      follow
        ? `Showing logs for "${runtime.envName}" (press Ctrl+C to stop).`
        : `Showing recent logs for "${runtime.envName}".`,
    );

    try {
      if (runtime.kind === 'docker') {
        const dockerArgs = ['logs', '--tail', tail];
        if (follow) {
          dockerArgs.push('--follow');
        }
        dockerArgs.push(runtime.containerName);
        await run('docker', dockerArgs, {
          errorName: 'docker logs',
          stdio: 'inherit',
        });
        return;
      }

      const localArgs = ['pm2', 'logs', '--lines', tail];
      if (!follow) {
        localArgs.push('--nostream');
      }
      await runLocalNocoBaseCommand(runtime, localArgs, {
        stdio: 'inherit',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(formatLogsFailure(runtime.envName, message));
    }
  }
}
