/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildDockerDbContainerName,
  dockerContainerExists,
  dockerContainerIsRunning,
  type ManagedAppRuntime,
  resolveManagedAppRuntime,
} from '../../lib/app-runtime.js';

export type DbStatus = 'running' | 'stopped' | 'missing' | 'external' | 'remote';

export type ResolvedDbRuntime =
  | {
      kind: 'builtin';
      envName: string;
      source: string;
      dbDialect: string;
      address: string;
      containerName: string;
      appRuntime: Exclude<ManagedAppRuntime, { kind: 'remote' }>;
    }
  | {
      kind: 'external';
      envName: string;
      source: string;
      dbDialect: string;
      address: string;
      status: 'external' | 'remote';
      appRuntime: ManagedAppRuntime;
    };

function formatAddress(host?: string, port?: string | number, fallbackHost?: string): string {
  const normalizedHost = String(host ?? '').trim() || String(fallbackHost ?? '').trim();
  const normalizedPort = String(port ?? '').trim();

  if (normalizedHost && normalizedPort) {
    return `${normalizedHost}:${normalizedPort}`;
  }

  return normalizedHost || normalizedPort || '';
}

export async function resolveDbRuntime(envName?: string): Promise<ResolvedDbRuntime | undefined> {
  const runtime = await resolveManagedAppRuntime(envName);
  if (!runtime) {
    return undefined;
  }

  const source = runtime.kind === 'remote' ? 'remote' : runtime.source;
  const dbDialect = String(runtime.env.config.dbDialect ?? 'postgres').trim() || 'postgres';

  if (runtime.kind !== 'remote' && runtime.env.config.builtinDb) {
    const containerName = buildDockerDbContainerName(runtime.envName, dbDialect, runtime.workspaceName);
    return {
      kind: 'builtin',
      envName: runtime.envName,
      source,
      dbDialect,
      containerName,
      address: formatAddress(runtime.env.config.dbHost, runtime.env.config.dbPort, containerName),
      appRuntime: runtime,
    };
  }

  return {
    kind: 'external',
    envName: runtime.envName,
    source,
    dbDialect,
    address: formatAddress(runtime.env.config.dbHost, runtime.env.config.dbPort),
    status: runtime.kind === 'remote' ? 'remote' : 'external',
    appRuntime: runtime,
  };
}

export async function builtinDbStatus(containerName: string): Promise<Exclude<DbStatus, 'external' | 'remote'>> {
  if (!(await dockerContainerExists(containerName))) {
    return 'missing';
  }

  return await dockerContainerIsRunning(containerName) ? 'running' : 'stopped';
}

export function formatUnmanagedDbMessage(
  action: 'start' | 'stop',
  runtime: ResolvedDbRuntime,
): string {
  const verb = action === 'start' ? 'start' : 'stop';

  if (runtime.appRuntime.kind === 'remote') {
    return [
      `Can't ${verb} the database for "${runtime.envName}" from this machine.`,
      'This env only has an API connection, so there is no CLI-managed database container here.',
      'If you need CLI-managed database start and stop, create a local env with the built-in database option enabled.',
    ].join('\n');
  }

  return [
    `Can't ${verb} the database for "${runtime.envName}" from this machine.`,
    'This env does not use a CLI-managed built-in database, so there is no saved database container to manage here.',
    'If you need CLI-managed database start and stop, recreate the env with the built-in database option enabled.',
  ].join('\n');
}

export function formatUnmanagedDbLogsMessage(runtime: ResolvedDbRuntime): string {
  if (runtime.appRuntime.kind === 'remote') {
    return [
      `Can't show database logs for "${runtime.envName}" from this machine.`,
      'This env only has an API connection, so there is no CLI-managed database container here.',
      'If you need CLI-managed database logs, create a local env with the built-in database option enabled.',
    ].join('\n');
  }

  return [
    `Can't show database logs for "${runtime.envName}" from this machine.`,
    'This env does not use a CLI-managed built-in database, so there is no saved database container to read logs from here.',
    'If you need CLI-managed database logs, recreate the env with the built-in database option enabled.',
  ].join('\n');
}
