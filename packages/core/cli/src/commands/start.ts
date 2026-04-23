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
  startDockerContainer,
} from '../lib/app-runtime.js';

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

export default class Start extends Command {
  static override description =
    'Start NocoBase for the selected env. Local npm/git installs run the app command, and Docker installs start the saved app container.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -e local',
    '<%= config.bin %> <%= command.id %> --quickstart',
    '<%= config.bin %> <%= command.id %> --port 12000',
    '<%= config.bin %> <%= command.id %> --daemon',
    '<%= config.bin %> <%= command.id %> --no-daemon',
    '<%= config.bin %> <%= command.id %> --instances 2',
    '<%= config.bin %> <%= command.id %> --launch-mode pm2',
    '<%= config.bin %> <%= command.id %> -e local-docker',
  ];
  static override flags = {
    env: Flags.string({
      char: 'e',
      description:
        'CLI env name (from `nb env` / `nb install`). Defaults to the current env when omitted',
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
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Start);
    const daemonFlagWasProvided = argvHasToken(this.argv, ['--daemon', '--no-daemon']);

    const runtime = await resolveManagedAppRuntime(flags.env);

    if (!runtime) {
      this.error('No NocoBase env is configured yet. Run `nb install` or `nb env add` first.');
    }

    if (runtime.kind === 'remote') {
      this.error(
        [
          `Can't start "${runtime.envName}" from this machine.`,
          'This env only has an API connection, so there is no saved local app or Docker runtime to launch here.',
          'Connect it to a local checkout or reinstall it with npm, git, or Docker if you want CLI-managed start and stop.',
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
            `Run \`nb start -e ${runtime.envName}\` to start the saved container, or recreate the env if you need different runtime settings.`,
          ].join('\n'),
        );
      }

      try {
        await startDockerContainer(runtime.containerName);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
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

    try {
      await runLocalNocoBaseCommand(runtime, npmArgs);
    } catch (error: unknown) {
      this.error(
        formatLocalStartFailure(runtime.envName, {
          port:
            flags.port
            || (runtime.env.appPort !== undefined && runtime.env.appPort !== null
              ? String(runtime.env.appPort).trim()
              : undefined),
          source: runtime.source,
        }),
      );
    }
  }
}
