/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { resolveEnvKind, type Env } from './auth-store.js';
import { getEnv, loadAuthConfig } from './auth-store.js';
import { commandOutput, commandSucceeds, run, runNocoBaseCommand } from './run-npm.js';

const DOCKER_APP_WORKDIR = '/app/nocobase';

export type ManagedAppRuntime =
  | {
      kind: 'local';
      env: Env;
      envName: string;
      source: 'npm' | 'git' | 'local';
      projectRoot: string;
      workspaceName?: string;
    }
  | {
      kind: 'docker';
      env: Env;
      envName: string;
      source: 'docker';
      containerName: string;
      workspaceName: string;
    }
  | {
      kind: 'http';
      env: Env;
      envName: string;
      source?: string;
    }
  | {
      kind: 'ssh';
      env: Env;
      envName: string;
      source?: string;
    };

function sanitizeDockerResourceName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'nocobase';
}

export function defaultWorkspaceName(cwd = process.cwd()): string {
  return sanitizeDockerResourceName(`nb-${path.basename(cwd)}`);
}

export function buildDockerAppContainerName(envName: string, workspaceName?: string): string {
  const workspace = workspaceName?.trim() || defaultWorkspaceName();
  return sanitizeDockerResourceName(`${workspace}-${envName}-app`);
}

export function buildDockerDbContainerName(
  envName: string,
  dbDialect: string,
  workspaceName?: string,
): string {
  const workspace = workspaceName?.trim() || defaultWorkspaceName();
  const dialect = dbDialect.trim() || 'postgres';
  return sanitizeDockerResourceName(`${workspace}-${envName}-${dialect}`);
}

function normalizeEnvSource(env: Env): ManagedAppRuntime['source'] {
  const source = String(env.config.source ?? '').trim();
  if (source === 'docker' || source === 'npm' || source === 'git') {
    return source;
  }

  const kind = resolveEnvKind(env.config);
  if (kind === 'local') {
    return 'local';
  }

  return undefined;
}

export async function resolveManagedAppRuntime(envName?: string): Promise<ManagedAppRuntime | undefined> {
  const config = await loadAuthConfig();
  const env = await getEnv(envName, { config });
  if (!env) {
    return undefined;
  }

  const resolvedName = env.name || envName?.trim() || config.currentEnv || 'default';
  const source = normalizeEnvSource(env);
  const workspaceName = config.name?.trim() || defaultWorkspaceName();
  const kind = env.kind ?? resolveEnvKind(env.config);

  if (kind === 'docker') {
    return {
      kind: 'docker',
      env,
      envName: resolvedName,
      source: 'docker',
      workspaceName,
      containerName: buildDockerAppContainerName(resolvedName, workspaceName),
    };
  }

  if (kind === 'local') {
    return {
      kind: 'local',
      env,
      envName: resolvedName,
      source: source === 'git' ? 'git' : source === 'npm' ? 'npm' : 'local',
      projectRoot: env.appRootPath,
      workspaceName,
    };
  }

  if (kind === 'ssh') {
    return {
      kind: 'ssh',
      env,
      envName: resolvedName,
      source,
    };
  }

  return {
    kind: 'http',
    env,
    envName: resolvedName,
    source,
  };
}

export function formatMissingManagedAppEnvMessage(envName?: string): string {
  const requested = String(envName ?? '').trim();
  if (requested) {
    return [
      `Env "${requested}" is not configured in this workspace.`,
      `If you want to create a new NocoBase AI environment, run \`nb init --env ${requested}\` first.`,
    ].join('\n');
  }

  return 'No NocoBase env is configured yet. Run `nb init` to create one first.';
}

export async function runLocalNocoBaseCommand(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' }>,
  args: string[],
  options?: { stdio?: 'inherit' | 'pipe' | 'ignore' },
): Promise<void> {
  await runNocoBaseCommand(args, {
    cwd: runtime.projectRoot,
    env: runtime.env.envVars,
    stdio: options?.stdio,
  });
}

export async function dockerContainerExists(containerName: string): Promise<boolean> {
  return await commandSucceeds('docker', ['container', 'inspect', containerName]);
}

export async function dockerContainerIsRunning(containerName: string): Promise<boolean> {
  try {
    const output = await commandOutput(
      'docker',
      ['inspect', '--format', '{{.State.Running}}', containerName],
      { errorName: 'docker inspect' },
    );
    return output.trim() === 'true';
  } catch (_error) {
    return false;
  }
}

export async function startDockerContainer(
  containerName: string,
  options?: { stdio?: 'inherit' | 'pipe' | 'ignore' },
): Promise<'started' | 'already-running'> {
  const exists = await dockerContainerExists(containerName);
  if (!exists) {
    throw new Error(`Docker app container "${containerName}" does not exist.`);
  }

  if (await dockerContainerIsRunning(containerName)) {
    return 'already-running';
  }

  await run('docker', ['start', containerName], {
    errorName: 'docker start',
    stdio: options?.stdio,
  });
  return 'started';
}

export async function stopDockerContainer(
  containerName: string,
  options?: { stdio?: 'inherit' | 'pipe' | 'ignore' },
): Promise<'stopped' | 'already-stopped'> {
  const exists = await dockerContainerExists(containerName);
  if (!exists) {
    throw new Error(`Docker app container "${containerName}" does not exist.`);
  }

  if (!(await dockerContainerIsRunning(containerName))) {
    return 'already-stopped';
  }

  await run('docker', ['stop', containerName], {
    errorName: 'docker stop',
    stdio: options?.stdio,
  });
  return 'stopped';
}

export async function runDockerNocoBaseCommand(containerName: string, args: string[]): Promise<void> {
  await startDockerContainer(containerName);
  await run(
    'docker',
    ['exec', '-w', DOCKER_APP_WORKDIR, containerName, 'yarn', 'nocobase', ...args],
    {
      errorName: 'docker exec',
    },
  );
}
