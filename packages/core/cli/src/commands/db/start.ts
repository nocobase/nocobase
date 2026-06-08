/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { formatMissingManagedAppEnvMessage, startDockerContainer } from '../../lib/app-runtime.js';
import { ensureBuiltinDbReady } from '../../lib/app-managed-resources.js';
import { announceTargetEnv, failTask, startTask, succeedTask, updateTask } from '../../lib/ui.js';
import { formatUnmanagedDbMessage, resolveDbRuntime } from './shared.js';

function formatDbStartFailure(envName: string, message: string): string {
  if (/does not exist/i.test(message)) {
    return [
      `Can't start the database for "${envName}" yet.`,
      'The saved built-in database container for this env could not be found on this machine.',
      'Try reinstalling the env, or check whether the container was removed outside the CLI.',
      `Details: ${message}`,
    ].join('\n');
  }

  return [
    `Couldn't start the database for "${envName}".`,
    'Check that the built-in database runtime for this env is still available, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

export default class DbStart extends Command {
  static override description = 'Start the built-in database container for the selected env.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --verbose',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to start the built-in database for. Defaults to the current env when omitted',
    }),
    verbose: Flags.boolean({
      description: 'Show raw startup output from the underlying Docker command',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DbStart);
    const requestedEnv = flags.env?.trim() || undefined;
    const verbose = Boolean(flags.verbose);

    const runtime = await resolveDbRuntime(requestedEnv);
    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind !== 'builtin') {
      this.error(formatUnmanagedDbMessage('start', runtime));
    }

    announceTargetEnv(runtime.envName);

    startTask(`Starting the built-in database for "${runtime.envName}"...`);
    try {
      try {
        const state = await startDockerContainer(runtime.containerName, {
          stdio: verbose ? 'inherit' : 'ignore',
        });
        succeedTask(
          state === 'already-running'
            ? `The built-in database is already running for "${runtime.envName}"${
                runtime.address ? ` at ${runtime.address}` : ''
              }.`
            : `The built-in database is running for "${runtime.envName}"${
                runtime.address ? ` at ${runtime.address}` : ''
              }.`,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/does not exist/i.test(message)) {
          throw error;
        }

        updateTask(`Restoring the built-in database for "${runtime.envName}"...`);
        await ensureBuiltinDbReady(runtime.appRuntime, {
          verbose,
        });
        succeedTask(
          `The built-in database is running for "${runtime.envName}"${
            runtime.address ? ` at ${runtime.address}` : ''
          }.`,
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      failTask(`Failed to start the built-in database for "${runtime.envName}".`);
      this.error(formatDbStartFailure(runtime.envName, message));
    }
  }
}
