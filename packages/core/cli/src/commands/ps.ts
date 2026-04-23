/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import {
  buildDockerDbContainerName,
  dockerContainerExists,
  dockerContainerIsRunning,
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  type ManagedAppRuntime,
} from '../lib/app-runtime.js';
import { listEnvs } from '../lib/auth-store.js';
import { renderTable } from '../lib/ui.js';

type RuntimeStatus = 'running' | 'stopped' | 'missing' | 'remote' | 'external' | '-';

function resolveRequestedEnv(positionalEnv?: string, flagEnv?: string): string | undefined {
  const fromArg = positionalEnv?.trim();
  const fromFlag = flagEnv?.trim();

  if (fromArg && fromFlag && fromArg !== fromFlag) {
    throw new Error(
      `Choose one env name for ps. You passed "${fromArg}" and --env "${fromFlag}".`,
    );
  }

  return fromArg || fromFlag || undefined;
}

function appUrl(runtime: ManagedAppRuntime): string {
  const port = String(runtime.env.config.appPort ?? '').trim();
  if (port) {
    return `http://127.0.0.1:${port}`;
  }

  const baseUrl = String(runtime.env.config.baseUrl ?? '').trim();
  return baseUrl.replace(/\/api\/?$/, '');
}

async function isLocalAppHealthy(runtime: Extract<ManagedAppRuntime, { kind: 'local' }>): Promise<boolean> {
  const port = String(runtime.env.config.appPort ?? '').trim();
  if (!port) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/__health_check`, {
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

async function dockerStatus(containerName: string): Promise<RuntimeStatus> {
  if (!(await dockerContainerExists(containerName))) {
    return 'missing';
  }
  return await dockerContainerIsRunning(containerName) ? 'running' : 'stopped';
}

async function dbStatus(runtime: ManagedAppRuntime): Promise<RuntimeStatus> {
  if (!runtime.env.config.builtinDb) {
    return runtime.kind === 'remote' ? 'external' : '-';
  }

  if (runtime.kind === 'remote') {
    return 'external';
  }

  const dbDialect = String(runtime.env.config.dbDialect ?? 'postgres').trim() || 'postgres';
  const containerName = buildDockerDbContainerName(runtime.envName, dbDialect, runtime.workspaceName);
  return await dockerStatus(containerName);
}

async function appStatus(runtime: ManagedAppRuntime): Promise<RuntimeStatus> {
  if (runtime.kind === 'remote') {
    return 'remote';
  }

  if (runtime.kind === 'docker') {
    return await dockerStatus(runtime.containerName);
  }

  return await isLocalAppHealthy(runtime) ? 'running' : 'stopped';
}

function sourceLabel(runtime: ManagedAppRuntime): string {
  if (runtime.kind === 'remote') {
    return 'remote';
  }
  return runtime.source;
}

export default class Ps extends Command {
  static override description =
    'Show NocoBase runtime status for configured envs without starting or stopping anything.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> app1',
    '<%= config.bin %> <%= command.id %> -e app1',
  ];

  static override args = {
    envName: Args.string({
      description: 'CLI env name (same as --env). Defaults to all envs when omitted',
      required: false,
    }),
  };

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to inspect',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Ps);
    let requestedEnv: string | undefined;

    try {
      requestedEnv = resolveRequestedEnv(args.envName, flags.env);
    } catch (error: unknown) {
      this.error(error instanceof Error ? error.message : String(error));
    }

    const envNames = requestedEnv
      ? [requestedEnv]
      : Object.keys((await listEnvs()).envs).sort();

    if (!envNames.length) {
      this.log('No NocoBase env is configured yet. Run `nb init` to create one first.');
      return;
    }

    const rows: string[][] = [];
    for (const envName of envNames) {
      const runtime = await resolveManagedAppRuntime(envName);
      if (!runtime) {
        if (requestedEnv) {
          this.error(formatMissingManagedAppEnvMessage(envName));
        }
        rows.push([envName, '-', 'missing', '-', '']);
        continue;
      }

      rows.push([
        runtime.envName,
        sourceLabel(runtime),
        await appStatus(runtime),
        await dbStatus(runtime),
        appUrl(runtime),
      ]);
    }

    this.log(renderTable(['Env', 'Source', 'App', 'Database', 'URL'], rows));
  }
}
