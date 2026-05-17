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
  resolveManagedAppRuntime,
  stopDockerContainer,
} from '../../lib/app-runtime.js';
import { formatAppUrl, resolveManagedAppApiBaseUrl, waitForAppReady } from '../../lib/app-health.js';
import { recreateSavedDockerApp } from '../../lib/app-managed-resources.js';
import { run } from '../../lib/run-npm.js';
import { announceTargetEnv, failTask, startTask, succeedTask } from '../../lib/ui.js';

function argvHasToken(argv: string[], tokens: string[]): boolean {
  return tokens.some((token) => argv.includes(token));
}

function pushFlag(argv: string[], flag: string, value: string | number | undefined): void {
  if (value !== undefined) {
    argv.push(flag, String(value));
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

export default class AppRestart extends Command {
  static override hidden = false;
  static override description =
    'Restart NocoBase for the selected env. Local npm/git installs stop and start the app again, and Docker installs recreate the saved app container so saved env changes can take effect.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env local',
    '<%= config.bin %> <%= command.id %> --env local --quickstart',
    '<%= config.bin %> <%= command.id %> --env local --port 12000',
    '<%= config.bin %> <%= command.id %> --env local --daemon',
    '<%= config.bin %> <%= command.id %> --env local --no-daemon',
    '<%= config.bin %> <%= command.id %> --env local --instances 2',
    '<%= config.bin %> <%= command.id %> --env local --launch-mode pm2',
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
    quickstart: Flags.boolean({ description: 'Quickstart the application after stopping it', required: false }),
    port: Flags.string({ description: 'Port (overrides appPort from env config when set)', char: 'p', required: false }),
    daemon: Flags.boolean({
      description: 'Run the application as a daemon after stopping it (default: true; use --no-daemon to stay in the foreground)',
      char: 'd',
      required: false,
      default: true,
      allowNo: true,
    }),
    instances: Flags.integer({ description: 'Number of instances to run after stopping it', char: 'i', required: false }),
    'launch-mode': Flags.string({ description: 'Launch Mode', required: false, options: ['pm2', 'node'] }),
    verbose: Flags.boolean({
      description: 'Show raw shutdown/startup output from the underlying local or Docker command',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppRestart);
    const requestedEnv = flags.env?.trim() || undefined;
    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv));
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
    const commandStdio = flags.verbose ? 'inherit' : 'ignore';

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'docker') {
      announceTargetEnv(runtime.envName);

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

      const appUrl = formatAppUrl(
        runtime.env.appPort === undefined || runtime.env.appPort === null
          ? undefined
          : String(runtime.env.appPort),
      );
      await waitForAppReady({
        envName: runtime.envName,
        apiBaseUrl: resolveManagedAppApiBaseUrl(runtime),
        containerName: runtime.containerName,
        logHint: `You can inspect startup logs with \`nb app logs --env ${runtime.envName}\`.`,
      });
      succeedTask(
        `NocoBase is running for "${runtime.envName}"${appUrl ? ` at ${appUrl}` : ''}.`,
      );
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

    await this.config.runCommand('app:stop', stopArgv);

    const startArgv = [...stopArgv];
    if (flags.quickstart) {
      startArgv.push('--quickstart');
    }
    pushFlag(startArgv, '--port', flags.port);
    if (daemonFlagWasProvided) {
      startArgv.push(flags.daemon === false ? '--no-daemon' : '--daemon');
    }
    pushFlag(startArgv, '--instances', flags.instances);
    pushFlag(startArgv, '--launch-mode', flags['launch-mode']);

    await this.config.runCommand('app:start', startArgv);
  }
}
