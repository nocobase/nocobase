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
} from '../../lib/app-runtime.js';
import { printInfo } from '../../lib/ui.js';

function formatUnsupportedRuntimeMessage(kind: 'docker' | 'http' | 'ssh', envName: string): string {
  if (kind === 'docker') {
    return [
      `Can't run dev mode for "${envName}".`,
      'This env is managed by Docker, but `nb source dev` requires a local npm or Git source directory.',
      `Use \`nb app logs --env ${envName}\` to inspect the Docker app, or create a source-based env with \`nb init --env ${envName} --source git\`.`,
    ].join('\n');
  }

  if (kind === 'ssh') {
    return [
      `Can't run dev mode for "${envName}" yet.`,
      'SSH env support is reserved but not implemented yet.',
      `Create a source-based env with \`nb init --env ${envName} --source git\` if you want local development mode right now.`,
    ].join('\n');
  }

  return [
    `Can't run dev mode for "${envName}".`,
    'This env only has an API connection, but `nb source dev` requires a local npm or Git source directory.',
    `Create a source-based env with \`nb init --env ${envName} --source git\` if you want local development mode.`,
  ].join('\n');
}

function appUrlForPort(port?: string): string | undefined {
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

export default class SourceDev extends Command {
  static override hidden = false;
  static override description =
    'Run NocoBase in local development mode for an npm or Git source env.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --db-sync',
    '<%= config.bin %> <%= command.id %> --env app1 --port 12000',
    '<%= config.bin %> <%= command.id %> --env app1 --client',
    '<%= config.bin %> <%= command.id %> --env app1 --server',
    '<%= config.bin %> <%= command.id %> --env app1 --inspect 9229',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name for dev mode. Defaults to the current env when omitted',
      required: false,
    }),
    'db-sync': Flags.boolean({
      description: 'Synchronize the database before starting dev mode',
      required: false,
    }),
    port: Flags.string({
      description: 'Development server port',
      char: 'p',
      required: false,
    }),
    client: Flags.boolean({
      description: 'Run client dev mode only',
      char: 'c',
      required: false,
    }),
    server: Flags.boolean({
      description: 'Run server dev mode only',
      char: 's',
      required: false,
    }),
    inspect: Flags.string({
      description: 'Node.js inspect port for server debugging',
      char: 'i',
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SourceDev);
    const requestedEnv = flags.env?.trim() || undefined;

    const runtime = await resolveManagedAppRuntime(requestedEnv);

    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'docker' || runtime.kind === 'http' || runtime.kind === 'ssh') {
      this.error(formatUnsupportedRuntimeMessage(runtime.kind, runtime.envName));
    }

    const devPort = flags.port
      || (runtime.env.appPort !== undefined && runtime.env.appPort !== null
        ? String(runtime.env.appPort).trim()
        : undefined);
    const appUrl = appUrlForPort(devPort);
    if (await isAppAlreadyRunning(appUrl)) {
      this.error(
        [
          `NocoBase is already running for "${runtime.envName}"${appUrl ? ` at ${appUrl}` : ''}.`,
          flags.port
            ? `Choose another dev port with --port, or stop the running app with \`nb app stop --env ${runtime.envName}\` first.`
            : `Run \`nb app stop --env ${runtime.envName}\` before starting dev mode, or choose another dev port with --port.`,
        ].join('\n'),
      );
    }

    const npmArgs = ['dev', '--rsbuild'];
    if (flags['db-sync']) {
      npmArgs.push('--db-sync');
    }
    if (devPort) {
      npmArgs.push('--port', devPort);
    }
    if (flags.client) {
      npmArgs.push('--client');
    }
    if (flags.server) {
      npmArgs.push('--server');
    }
    if (flags.inspect) {
      npmArgs.push('--inspect', flags.inspect);
    }

    printInfo(
      `Starting NocoBase dev mode for "${runtime.envName}" from ${runtime.projectRoot}. Press Ctrl+C to stop.`,
    );

    try {
      await runLocalNocoBaseCommand(runtime, npmArgs, {
        stdio: 'inherit',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(
        [
          `Couldn't start dev mode for "${runtime.envName}".`,
          'Check that dependencies are installed and the saved env settings are valid, then try again.',
          `Details: ${message}`,
        ].join('\n'),
      );
    }
  }
}
