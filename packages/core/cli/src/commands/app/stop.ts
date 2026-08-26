/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { getCurrentEnvName } from '../../lib/auth-store.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import {
  formatMissingManagedAppEnvMessage,
  managedAppLifecycleEnvVars,
  resolveManagedAppRuntime,
  runLocalNocoBaseCommand,
  type ManagedAppRuntime,
} from '../../lib/app-runtime.js';
import { announceTargetEnv, failTask, isInteractiveTerminal, printInfo, startTask, succeedTask } from '../../lib/ui.js';
import { builtinDbContainerName, removeDockerContainerIfExists } from './shared.js';

function formatStopFailure(envName: string, message: string): string {
  return [
    `Couldn't stop NocoBase for "${envName}".`,
    'Check that the local app or Docker runtime is still available, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

function formatStopCrossEnvConfirmationRequiredMessage(currentEnv: string, requestedEnv: string): string {
  return [
    `Refusing to stop env "${requestedEnv}" because the current env is "${currentEnv}" and interactive confirmation is unavailable in the current session.`,
    '',
    'Re-run the command with `--yes` to confirm this one-off cross-env stop, or switch the current env first.',
  ].join('\n');
}

function shouldIgnoreLocalStopError(message: string): boolean {
  return (
    message.includes('spawn nocobase-v1 ENOENT') ||
    message.includes('The specified --cwd does not exist:') ||
    message.includes('The specified --cwd is not a directory:') ||
    message.includes("Couldn't find a NocoBase source project from --cwd:")
  );
}

async function stopLocalRuntimeWithFallback(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' }>,
  options: { stdio: 'inherit' | 'ignore' },
): Promise<void> {
  const env = managedAppLifecycleEnvVars();

  try {
    await runLocalNocoBaseCommand(runtime, ['pm2', 'kill'], {
      env,
      stdio: options.stdio,
    });
    return;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (!shouldIgnoreLocalStopError(message)) {
      throw error;
    }
  }
}

export default class AppStop extends Command {
  static override hidden = false;
  static override description =
    'Stop NocoBase for the selected env. Local npm/git installs stop the app process, and Docker installs remove the saved app container.';
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
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    force: Flags.boolean({
      char: 'f',
      hidden: true,
      default: false,
    }),
    'with-db': Flags.boolean({
      description: 'Also remove the CLI-managed built-in database container when present',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show raw shutdown output from the underlying local or Docker command',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppStop);
    const requestedEnv = flags.env?.trim() || undefined;
    if (requestedEnv && hasExplicitEnvSelection(this.argv)) {
      const skipCrossEnvConfirmation = flags.yes || flags.force;
      if (!isInteractiveTerminal()) {
        const currentEnv = await getCurrentEnvName();
        const normalizedCurrentEnv = String(currentEnv ?? '').trim() || undefined;
        if (normalizedCurrentEnv && normalizedCurrentEnv !== requestedEnv && !skipCrossEnvConfirmation) {
          this.error(formatStopCrossEnvConfirmationRequiredMessage(normalizedCurrentEnv, requestedEnv));
        }
      } else {
        const confirmed = await ensureCrossEnvConfirmed({
          command: this,
          requestedEnv,
          yes: skipCrossEnvConfirmation,
        });
        if (!confirmed) {
          return;
        }
      }
    }

    const runtime = await resolveManagedAppRuntime(requestedEnv);
    const commandStdio = flags.verbose ? 'inherit' : 'ignore';

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'http') {
      this.error(
        [
          `Can't stop "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app or Docker runtime to stop here.',
          'If the app is running on a server, stop it there or reconnect this env to a local runtime first.',
        ].join('\n'),
      );
    }

    if (runtime.kind === 'ssh') {
      this.error(
        [
          `Can't stop "${runtime.envName}" yet.`,
          'SSH env support is reserved but not implemented yet.',
          'Use a local or Docker env if you need CLI-managed stop right now.',
        ].join('\n'),
      );
    }

    announceTargetEnv(runtime.envName);

    if (runtime.kind === 'docker') {
      startTask(`Removing the saved Docker app container for "${runtime.envName}"...`);
      try {
        const state = await removeDockerContainerIfExists(runtime.containerName, {
          stdio: commandStdio,
        });
        succeedTask(
          state === 'removed'
            ? `Docker app container removed for "${runtime.envName}".`
            : `No Docker app container found for "${runtime.envName}".`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failTask(`Failed to stop NocoBase for "${runtime.envName}".`);
        this.error(formatStopFailure(runtime.envName, message));
      }
    } else {
      startTask(`Stopping NocoBase for "${runtime.envName}"...`);
      try {
        await stopLocalRuntimeWithFallback(runtime, {
          stdio: commandStdio,
        });
        succeedTask(`NocoBase has stopped for "${runtime.envName}".`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failTask(`Failed to stop NocoBase for "${runtime.envName}".`);
        this.error(formatStopFailure(runtime.envName, message));
      }
    }

    if (!flags['with-db']) {
      return;
    }

    if (runtime.kind !== 'local' && runtime.kind !== 'docker') {
      return;
    }

    const dbContainerName = builtinDbContainerName(runtime);
    if (!dbContainerName) {
      printInfo(
        `Env "${runtime.envName}" does not use a CLI-managed built-in database. Only the app runtime was stopped.`,
      );
      return;
    }

    startTask(`Removing the built-in database container for "${runtime.envName}"...`);
    try {
      const state = await removeDockerContainerIfExists(dbContainerName, {
        stdio: commandStdio,
      });
      succeedTask(
        state === 'removed'
          ? `Built-in database container removed for "${runtime.envName}".`
          : `No built-in database container found for "${runtime.envName}".`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failTask(`Failed to stop the built-in database for "${runtime.envName}".`);
      this.error(formatStopFailure(runtime.envName, message));
    }
  }
}
