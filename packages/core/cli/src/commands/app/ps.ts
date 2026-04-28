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
  buildDockerDbContainerName,
  dockerContainerExists,
  dockerContainerIsRunning,
  defaultWorkspaceName,
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  type ManagedAppRuntime,
} from '../../lib/app-runtime.js';
import { listEnvs } from '../../lib/auth-store.js';
import { renderTable } from '../../lib/ui.js';

type RuntimeStatus = 'running' | 'stopped' | 'missing' | 'http' | 'ssh' | 'external' | '-';

function resolveApiBaseUrl(config: { apiBaseUrl?: unknown; baseUrl?: unknown; apibaseUrl?: unknown }): string {
  return String(config.apiBaseUrl ?? config.baseUrl ?? config.apibaseUrl ?? '').trim();
}

function appUrl(runtime: ManagedAppRuntime): string {
  const port = String(runtime.env.config.appPort ?? '').trim();
  if (port) {
    return `http://127.0.0.1:${port}`;
  }

  const baseUrl = resolveApiBaseUrl(runtime.env.config);
  return baseUrl.replace(/\/api\/?$/, '');
}

function appNetwork(runtime: ManagedAppRuntime): string {
  if (runtime.kind === 'docker') {
    return runtime.workspaceName?.trim() || defaultWorkspaceName();
  }

  return '-';
}

function appRootPath(runtime: ManagedAppRuntime): string {
  if (runtime.kind === 'http' || runtime.kind === 'docker') {
    return '-';
  }

  if (runtime.kind === 'local') {
    return String(runtime.projectRoot ?? runtime.env.appRootPath ?? '').trim() || '-';
  }

  return String(runtime.env.appRootPath ?? '').trim() || '-';
}

function storagePath(runtime: ManagedAppRuntime): string {
  if (runtime.kind === 'http') {
    return '-';
  }

  const value = String(runtime.env.storagePath ?? runtime.env.config.storagePath ?? '').trim();
  return value || '-';
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
    return runtime.kind === 'http' ? 'external' : '-';
  }

  if (runtime.kind === 'http') {
    return 'external';
  }

  if (runtime.kind === 'ssh') {
    return '-';
  }

  const dbDialect = String(runtime.env.config.dbDialect ?? 'postgres').trim() || 'postgres';
  const containerName = buildDockerDbContainerName(runtime.envName, dbDialect, runtime.workspaceName);
  return await dockerStatus(containerName);
}

async function runtimeStatus(runtime: ManagedAppRuntime): Promise<RuntimeStatus> {
  if (runtime.kind === 'http') {
    return 'http';
  }

  if (runtime.kind === 'ssh') {
    return 'ssh';
  }

  if (runtime.kind === 'docker') {
    return await dockerStatus(runtime.containerName);
  }

  return await isLocalAppHealthy(runtime) ? 'running' : 'stopped';
}
export default class AppPs extends Command {
  static override hidden = false;
  static override description =
    'Show NocoBase runtime status for configured envs without starting or stopping anything.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to inspect. Omit to show all configured envs',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppPs);
    const requestedEnv = flags.env?.trim() || undefined;

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
        rows.push([envName, '-', 'missing', '-', '-', '-', '-', '']);
        continue;
      }

      rows.push([
        runtime.envName,
        runtime.kind,
        await runtimeStatus(runtime),
        await dbStatus(runtime),
        appNetwork(runtime),
        appRootPath(runtime),
        storagePath(runtime),
        appUrl(runtime),
      ]);
    }

    this.log(renderTable(['Env', 'Kind', 'App Status', 'Database Status', 'Network', 'App Root', 'Storage', 'URL'], rows));
  }
}
