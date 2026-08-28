/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import {
  formatMissingManagedAppEnvMessage,
  type ManagedAppRuntime,
  resolveManagedAppRuntime,
  stopDockerContainer,
} from '../../lib/app-runtime.js';
import { formatAppUrl, resolveManagedAppApiBaseUrl, waitForAppReady } from '../../lib/app-health.js';
import { recreateSavedDockerApp } from '../../lib/app-managed-resources.js';
import { resolveAppUrlFromApiBaseUrl } from '../env/shared.js';
import { run } from '../../lib/run-npm.js';
import { announceTargetEnv, failTask, startTask, succeedTask } from '../../lib/ui.js';
import { buildHookContext, resolveHookScriptPath, runHookScriptHook } from '../../lib/hook-script.js';

function argvHasToken(argv: string[], tokens: string[]): boolean {
  return tokens.some((token) => argv.includes(token));
}

function pushFlag(argv: string[], flag: string, value: string | number | undefined): void {
  if (value !== undefined) {
    argv.push(flag, String(value));
  }
}

function buildLicenseSyncArgv(
  envName: string,
  options: {
    explicitEnvSelection: boolean;
    yes: boolean;
    verbose: boolean;
  },
): string[] {
  const argv = ['--env', envName, '--skip-if-no-license'];
  if (options.yes || options.explicitEnvSelection) {
    argv.push('--yes');
  }
  if (options.verbose) {
    argv.push('--verbose');
  }
  return argv;
}

async function runWithSuppressedTargetEnvLog<T>(task: () => Promise<T>): Promise<T> {
  const previousTargetEnv = process.env.NB_SKIP_TARGET_ENV_LOG;
  process.env.NB_SKIP_TARGET_ENV_LOG = '1';
  try {
    return await task();
  } finally {
    if (previousTargetEnv === undefined) {
      delete process.env.NB_SKIP_TARGET_ENV_LOG;
    } else {
      process.env.NB_SKIP_TARGET_ENV_LOG = previousTargetEnv;
    }
  }
}

function formatDockerRestartFailure(envName: string, message: string): string {
  return [
    `Couldn't restart NocoBase for "${envName}".`,
    'The CLI was not able to recreate the saved Docker app container successfully.',
    'Check the saved Docker image, envFile, container settings, and database connection, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

function resolveDisplayAppUrl(
  apiBaseUrl: string | undefined,
  port?: string,
  appPublicPath?: string,
): string | undefined {
  const resolvedFromApiBaseUrl = resolveAppUrlFromApiBaseUrl(apiBaseUrl);
  if (resolvedFromApiBaseUrl) {
    return resolvedFromApiBaseUrl;
  }

  return formatAppUrl(port, appPublicPath);
}

async function runDockerAfterAppStartHookIfNeeded(runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>): Promise<void> {
  const hookScript = runtime.env.config?.hookScript;
  if (!hookScript) {
    return;
  }

  const hookScriptPath = resolveHookScriptPath({
    appPath: runtime.env.appPath,
    hookScript,
  });
  if (!hookScriptPath) {
    return;
  }

  const context = buildHookContext({
    phase: 'app-start',
    command: 'app:restart',
    envName: runtime.envName,
    source: runtime.source,
    version: runtime.env.config?.downloadVersion,
    appPath: runtime.env.appPath,
    sourcePath: runtime.env.sourcePath,
    storagePath: runtime.env.storagePath,
    hookScript: String(hookScript).trim(),
    envConfig: runtime.env.config,
  });
  if (!context) {
    return;
  }

  await runHookScriptHook({
    hookScriptPath,
    hookName: 'afterAppStart',
    context,
  });
}

export default class AppRestart extends Command {
  static override hidden = false;
  static override description =
    'Restart NocoBase for the selected env. When applicable, the CLI synchronizes licensed commercial plugins first, then restarts the local app or recreates the saved Docker container.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env local',
    '<%= config.bin %> <%= command.id %> --env local --verbose',
    '<%= config.bin %> <%= command.id %> --env local-docker',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to restart. Defaults to the current env when omitted',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    quickstart: Flags.boolean({
      hidden: true,
      description: 'Quickstart the application after stopping it',
      required: false,
      default: true,
      allowNo: true,
    }),
    'sync-licensed-plugins': Flags.boolean({
      hidden: true,
      description: 'Synchronize licensed commercial plugins before restarting the application',
      required: false,
      default: true,
      allowNo: true,
    }),
    daemon: Flags.boolean({
      hidden: true,
      description:
        'Run the application as a daemon after stopping it (default: true; use --no-daemon to stay in the foreground)',
      char: 'd',
      required: false,
      default: true,
      allowNo: true,
    }),
    verbose: Flags.boolean({
      description: 'Show raw shutdown/startup output from the underlying local or Docker command',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppRestart);
    const quickstart = flags.quickstart ?? true;
    const requestedEnv = flags.env?.trim() || undefined;
    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv));
    const shouldSyncLicensedPlugins = flags['sync-licensed-plugins'] ?? true;
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
    const runCommand = this.config.runCommand.bind(this.config) as (id: string, argv?: string[]) => Promise<unknown>;
    const commandStdio = flags.verbose ? 'inherit' : 'ignore';

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'http') {
      this.error(
        [
          `Can't restart "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app or Docker runtime to restart here.',
          'Connect it to a local checkout or reinstall it with npm, git, or Docker if you want CLI-managed restart.',
        ].join('\n'),
      );
    }

    if (runtime.kind === 'ssh') {
      this.error(
        [
          `Can't restart "${runtime.envName}" yet.`,
          'SSH env support is reserved but not implemented yet.',
          'Use a local or Docker env if you need CLI-managed restart right now.',
        ].join('\n'),
      );
    }

    announceTargetEnv(runtime.envName);

    if (shouldSyncLicensedPlugins) {
      try {
        await runWithSuppressedTargetEnvLog(async () => {
          await runCommand(
            'license:plugins:sync',
            buildLicenseSyncArgv(runtime.envName, {
              explicitEnvSelection,
              yes: flags.yes,
              verbose: flags.verbose,
            }),
          );
        });
      } catch (error: unknown) {
        this.error(error instanceof Error ? error.message : String(error));
      }
    }

    if (runtime.kind === 'docker') {
      startTask(`Stopping NocoBase for "${runtime.envName}" before restart...`);
      try {
        const state = await stopDockerContainer(runtime.containerName, {
          stdio: commandStdio,
        });
        succeedTask(
          state === 'already-stopped'
            ? `NocoBase was already stopped for "${runtime.envName}".`
            : `Stopped NocoBase for "${runtime.envName}".`,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        failTask(`Failed to stop NocoBase for "${runtime.envName}".`);
        this.error(formatDockerRestartFailure(runtime.envName, message));
      }

      startTask(`Recreating the Docker app container for "${runtime.envName}"...`);
      try {
        await run('docker', ['rm', '-f', runtime.containerName], {
          errorName: 'docker rm',
          stdio: commandStdio,
        }).catch(() => undefined);
        await recreateSavedDockerApp(runtime, {
          verbose: flags.verbose,
        });
        succeedTask(`Docker app container is ready for "${runtime.envName}".`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        failTask(`Failed to recreate NocoBase for "${runtime.envName}".`);
        this.error(formatDockerRestartFailure(runtime.envName, message));
      }

      const apiBaseUrl = resolveManagedAppApiBaseUrl(runtime);
      const appUrl = resolveDisplayAppUrl(
        apiBaseUrl,
        runtime.env.appPort === undefined || runtime.env.appPort === null ? undefined : String(runtime.env.appPort),
        runtime.env.config?.appPublicPath,
      );
      await waitForAppReady({
        envName: runtime.envName,
        apiBaseUrl,
        containerName: runtime.containerName,
        logHint: `You can inspect startup logs with \`nb app logs --env ${runtime.envName}\`.`,
        ...(flags.verbose ? { verbose: true } : {}),
      });
      await runDockerAfterAppStartHookIfNeeded(runtime);
      succeedTask(`NocoBase is running for "${runtime.envName}"${appUrl ? ` at ${appUrl}` : ''}.`);
      return;
    }

    const stopArgv: string[] = [];
    const daemonFlagWasProvided = argvHasToken(this.argv, ['--daemon', '--no-daemon']);

    pushFlag(stopArgv, '--env', requestedEnv);
    if (flags.yes || explicitEnvSelection) {
      stopArgv.push('--yes');
    }
    if (flags.verbose) {
      stopArgv.push('--verbose');
    }

    await runWithSuppressedTargetEnvLog(async () => {
      await runCommand('app:stop', stopArgv);
    });

    const startArgv = [...stopArgv];
    if (quickstart) {
      startArgv.push('--quickstart');
    }
    startArgv.push('--no-sync-licensed-plugins');
    if (daemonFlagWasProvided) {
      startArgv.push(flags.daemon === false ? '--no-daemon' : '--daemon');
    }
    if (runtime.env.config?.hookScript) {
      startArgv.push('--hook-command', 'app:restart');
    }

    await runWithSuppressedTargetEnvLog(async () => {
      await runCommand('app:start', startArgv);
    });
  }
}
