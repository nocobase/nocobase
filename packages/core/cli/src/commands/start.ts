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
  startDockerContainer,
} from '../lib/app-runtime.js';
import { failTask, printInfo, startTask, succeedTask } from '../lib/ui.js';

function argvHasToken(argv: string[], tokens: string[]): boolean {
  return tokens.some((token) => argv.includes(token));
}

function formatDockerStartFailure(envName: string, message: string): string {
  if (/does not exist/i.test(message)) {
    return [
      `Can't start NocoBase for "${envName}" yet.`,
      'The saved Docker app for this env could not be found on this machine.',
      `Try reinstalling the env, or check whether the container was removed outside the CLI.`,
      `Details: ${message}`,
    ].join('\n');
  }

  return [
    `Couldn't start NocoBase for "${envName}".`,
    'Check that the Docker runtime for this env is still available, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

function formatLocalStartFailure(envName: string, options?: { port?: string; source?: string }): string {
  const sourceLabel =
    options?.source === 'git'
      ? 'the local Git checkout'
      : options?.source === 'npm'
        ? 'the local npm app'
        : 'the local app';
  const portHint = options?.port ? ` Expected app port: ${options.port}.` : '';

  return [
    `Couldn't start NocoBase for "${envName}".`,
    `The CLI was not able to start ${sourceLabel} successfully.`,
    `Check that the app dependencies, database connection, and local env settings are ready, then try again.${portHint}`,
  ].join('\n');
}

function formatAppUrl(port?: string) {
  const value = String(port ?? '').trim();
  if (!value) {
    return undefined;
  }

  return `http://127.0.0.1:${value}`;
}

async function isAppAlreadyRunning(appUrl?: string): Promise<boolean> {
  if (!appUrl) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`${appUrl}/api/__health_check`, {
      signal: controller.signal,
    });
    const text = await response.text();
    return response.ok && text.trim().toLowerCase() === 'ok';
  } catch (_error) {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export default class Start extends Command {
  static override description =
    'Start NocoBase for the selected env. Local npm/git installs run the app command, and Docker installs start the saved app container.';
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
      description: 'CLI env name to start. Defaults to the current env when omitted',
    }),
    quickstart: Flags.boolean({ description: 'Quickstart the application', required: false }),
    port: Flags.string({ description: 'Port (overrides appPort from env config when set)', char: 'p', required: false }),
    daemon: Flags.boolean({
      description: 'Run the application as a daemon (default: true; use --no-daemon to stay in the foreground)',
      char: 'd',
      required: false,
      default: true,
      allowNo: true,
    }),
    instances: Flags.integer({ description: 'Number of instances to run', char: 'i', required: false }),
    'launch-mode': Flags.string({ description: 'Launch Mode', required: false, options: ['pm2', 'node'] }),
    verbose: Flags.boolean({
      description: 'Show raw startup output from the underlying local or Docker command',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Start);
    const requestedEnv = flags.env?.trim() || undefined;

    const daemonFlagWasProvided = argvHasToken(this.argv, ['--daemon', '--no-daemon']);
    const runtime = await resolveManagedAppRuntime(requestedEnv);
    const commandStdio = flags.verbose ? 'inherit' : 'ignore';

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'http') {
      this.error(
        [
          `Can't start "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app or Docker runtime to launch here.',
          'Connect it to a local checkout or reinstall it with npm, git, or Docker if you want CLI-managed start and stop.',
        ].join('\n'),
      );
    }

    if (runtime.kind === 'ssh') {
      this.error(
        [
          `Can't start "${runtime.envName}" yet.`,
          'SSH env support is reserved but not implemented yet.',
          'Use a local or Docker env if you need CLI-managed start and stop right now.',
        ].join('\n'),
      );
    }

    if (runtime.kind === 'docker') {
      const unsupportedFlags = [
        flags.quickstart ? '--quickstart' : undefined,
        flags.port ? '--port' : undefined,
        daemonFlagWasProvided ? (flags.daemon ? '--daemon' : '--no-daemon') : undefined,
        flags.instances !== undefined ? '--instances' : undefined,
        flags['launch-mode'] ? '--launch-mode' : undefined,
      ].filter(Boolean);

      if (unsupportedFlags.length > 0) {
        this.error(
          [
            `Can't apply ${unsupportedFlags.join(', ')} to "${runtime.envName}".`,
            'This env is managed by Docker, so those options are only available for local npm/git installs.',
            `Run \`nb start --env ${runtime.envName}\` to start the saved container, or recreate the env if you need different runtime settings.`,
          ].join('\n'),
        );
      }

      const appUrl = formatAppUrl(runtime.env.appPort === undefined || runtime.env.appPort === null
        ? undefined
        : String(runtime.env.appPort));
      startTask(`Starting NocoBase for "${runtime.envName}"...`);
      try {
        const state = await startDockerContainer(runtime.containerName, {
          stdio: commandStdio,
        });
        succeedTask(
          state === 'already-running'
            ? `NocoBase is already running for "${runtime.envName}"${appUrl ? ` at ${appUrl}` : ''}.`
            : `NocoBase is running for "${runtime.envName}"${appUrl ? ` at ${appUrl}` : ''}.`,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        failTask(`Failed to start NocoBase for "${runtime.envName}".`);
        this.error(formatDockerStartFailure(runtime.envName, message));
      }
      return;
    }

    const npmArgs = ['start'];

    if (flags.quickstart) {
      npmArgs.push('--quickstart');
    }
    if (flags.port) {
      npmArgs.push('--port', flags.port);
    } else if (runtime.env.appPort !== undefined && runtime.env.appPort !== null && String(runtime.env.appPort).trim() !== '') {
      npmArgs.push('--port', String(runtime.env.appPort));
    }
    if (flags.daemon !== false) {
      npmArgs.push('--daemon');
    }
    if (flags.instances !== undefined) {
      npmArgs.push('--instances', flags.instances.toString());
    }
    if (flags['launch-mode']) {
      npmArgs.push('--launch-mode', flags['launch-mode']);
    }

    const appUrl = formatAppUrl(
      flags.port
      || (runtime.env.appPort !== undefined && runtime.env.appPort !== null
        ? String(runtime.env.appPort).trim()
        : undefined),
    );

    if (await isAppAlreadyRunning(appUrl)) {
      if (flags.daemon === false) {
        printInfo(
          `NocoBase is already running for "${runtime.envName}"${appUrl ? ` at ${appUrl}` : ''}. Use \`nb stop --env ${runtime.envName}\` before starting it again in the foreground.`,
        );
      } else {
        succeedTask(
          `NocoBase is already running for "${runtime.envName}"${appUrl ? ` at ${appUrl}` : ''}.`,
        );
      }
      return;
    }

    if (flags.daemon === false) {
      printInfo(
        `Starting NocoBase for "${runtime.envName}" in the foreground${appUrl ? ` at ${appUrl}` : ''}. Press Ctrl+C to stop.`,
      );
    } else {
      startTask(`Starting NocoBase for "${runtime.envName}" in the background...`);
    }

    try {
      await runLocalNocoBaseCommand(runtime, npmArgs, {
        stdio: commandStdio,
      });
      if (flags.daemon !== false) {
        succeedTask(
          `NocoBase is starting for "${runtime.envName}"${appUrl ? ` at ${appUrl}` : ''}.`,
        );
      }
    } catch (error: unknown) {
      failTask(`Failed to start NocoBase for "${runtime.envName}".`);
      this.error(
        formatLocalStartFailure(runtime.envName, {
          port: flags.port || (runtime.env.appPort !== undefined && runtime.env.appPort !== null
            ? String(runtime.env.appPort).trim()
            : undefined),
          source: runtime.source,
        }),
      );
    }
  }
}
