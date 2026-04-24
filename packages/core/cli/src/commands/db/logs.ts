/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { formatMissingManagedAppEnvMessage } from '../../lib/app-runtime.js';
import { run } from '../../lib/run-npm.js';
import { printInfo } from '../../lib/ui.js';
import { formatUnmanagedDbLogsMessage, resolveDbRuntime } from './shared.js';

function formatDbLogsFailure(envName: string, message: string): string {
  if (/does not exist/i.test(message)) {
    return [
      `Can't show database logs for "${envName}" yet.`,
      'The saved built-in database container for this env could not be found on this machine.',
      'Try reinstalling the env, or check whether the container was removed outside the CLI.',
      `Details: ${message}`,
    ].join('\n');
  }

  return [
    `Couldn't show database logs for "${envName}".`,
    'Check that the built-in database runtime for this env is still available, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

export default class DbLogs extends Command {
  static override description =
    'Show logs for the built-in database container of the selected env.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --tail 200',
    '<%= config.bin %> <%= command.id %> --env app1 --no-follow',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to inspect built-in database logs for. Defaults to the current env when omitted',
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
    const { flags } = await this.parse(DbLogs);
    const requestedEnv = flags.env?.trim() || undefined;

    const runtime = await resolveDbRuntime(requestedEnv);
    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind !== 'builtin') {
      this.error(formatUnmanagedDbLogsMessage(runtime));
    }

    const tail = String(flags.tail ?? 100);
    const follow = flags.follow !== false;
    printInfo(
      follow
        ? `Showing built-in database logs for "${runtime.envName}" (press Ctrl+C to stop).`
        : `Showing recent built-in database logs for "${runtime.envName}".`,
    );

    const dockerArgs = ['logs', '--tail', tail];
    if (follow) {
      dockerArgs.push('--follow');
    }
    dockerArgs.push(runtime.containerName);

    try {
      await run('docker', dockerArgs, {
        errorName: 'docker logs',
        stdio: 'inherit',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(formatDbLogsFailure(runtime.envName, message));
    }
  }
}
