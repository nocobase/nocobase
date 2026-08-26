/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildDockerDbContainerName, type ManagedAppRuntime } from './app-runtime.js';
import { commandOutput } from './run-npm.js';

export type BuiltinDbConnection = {
  builtinDb: true;
  dbDialect: string;
  dbHost: string;
  dbPort: string;
  containerName: string;
  networkName?: string;
};

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

export function defaultBuiltinDbPortForDialect(value: unknown): string {
  const dialect = trimValue(value) || 'postgres';
  switch (dialect) {
    case 'mysql':
    case 'mariadb':
      return '3306';
    case 'kingbase':
      return '54321';
    case 'postgres':
    default:
      return '5432';
  }
}

export function resolveBuiltinDbContainerName(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  dbDialect?: string,
): string {
  const dialect = trimValue(dbDialect ?? runtime.env.config.dbDialect) || 'postgres';
  return buildDockerDbContainerName(
    runtime.envName,
    dialect,
    runtime.dockerContainerPrefix || runtime.workspaceName,
  );
}

export function deriveBuiltinDbConnection(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  overrides: {
    dbDialect?: unknown;
    dbPort?: unknown;
  } = {},
): BuiltinDbConnection {
  const dbDialect = trimValue(overrides.dbDialect ?? runtime.env.config.dbDialect) || 'postgres';
  const containerName = resolveBuiltinDbContainerName(runtime, dbDialect);
  const networkName = trimValue(runtime.dockerNetworkName || runtime.workspaceName) || undefined;

  if (runtime.source === 'docker') {
    return {
      builtinDb: true,
      dbDialect,
      dbHost: containerName,
      dbPort: defaultBuiltinDbPortForDialect(dbDialect),
      containerName,
      networkName,
    };
  }

  const dbPort = trimValue(overrides.dbPort ?? runtime.env.config.dbPort) || defaultBuiltinDbPortForDialect(dbDialect);
  return {
    builtinDb: true,
    dbDialect,
    dbHost: '127.0.0.1',
    dbPort,
    containerName,
    networkName,
  };
}

export async function resolveBuiltinDbConnection(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
): Promise<BuiltinDbConnection> {
  const derived = deriveBuiltinDbConnection(runtime);
  if (runtime.source === 'docker') {
    return derived;
  }

  const mappedPort = await inspectBuiltinDbPublishedPort(derived.containerName, derived.dbDialect);
  if (mappedPort) {
    return {
      ...derived,
      dbPort: mappedPort,
    };
  }

  return derived;
}

async function inspectBuiltinDbPublishedPort(containerName: string, dbDialect: string): Promise<string | undefined> {
  const containerPort = defaultBuiltinDbPortForDialect(dbDialect);
  try {
    const output = await commandOutput(
      'docker',
      [
        'inspect',
        '--format',
        `{{with index .NetworkSettings.Ports "${containerPort}/tcp"}}{{(index . 0).HostPort}}{{end}}`,
        containerName,
      ],
      {
        errorName: 'docker inspect',
      },
    );
    const hostPort = trimValue(output);
    return hostPort || undefined;
  } catch {
    return undefined;
  }
}
