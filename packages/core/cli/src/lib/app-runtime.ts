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
import {
  DEFAULT_DOCKER_CONTAINER_PREFIX,
  DEFAULT_DOCKER_NETWORK,
  getEffectiveCliConfigValue,
} from './cli-config.js';
import { resolveConfiguredAppPath } from './env-paths.js';
import { resolveManagedLocalEnvFilePath } from './managed-env-file.js';
import { commandOutput, commandSucceeds, run, runNocoBaseCommand } from './run-npm.js';
import { buildRuntimeEnvVars } from './runtime-env-vars.js';

const DOCKER_APP_WORKDIR = '/app/nocobase';

export type ManagedAppRuntime =
  | {
      kind: 'local';
      env: Env;
      envName: string;
      source: 'npm' | 'git' | 'local';
      projectRoot: string;
      dockerNetworkName?: string;
      dockerContainerPrefix?: string;
      workspaceName?: string;
    }
  | {
      kind: 'docker';
      env: Env;
      envName: string;
      source: 'docker';
      dockerNetworkName: string;
      dockerContainerPrefix: string;
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

export function defaultDockerContainerPrefix(cwd = process.cwd()): string {
  const configured = String(DEFAULT_DOCKER_CONTAINER_PREFIX ?? '').trim();
  if (configured) {
    return sanitizeDockerResourceName(configured);
  }
  return defaultWorkspaceName(cwd);
}

export function defaultDockerNetworkName(): string {
  return sanitizeDockerResourceName(DEFAULT_DOCKER_NETWORK);
}

export function buildDockerAppContainerName(envName: string, containerPrefix?: string): string {
  const prefix = containerPrefix?.trim() || defaultDockerContainerPrefix();
  return sanitizeDockerResourceName(`${prefix}-${envName}-app`);
}

export function buildDockerDbContainerName(
  envName: string,
  dbDialect: string,
  containerPrefix?: string,
): string {
  const prefix = containerPrefix?.trim() || defaultDockerContainerPrefix();
  const dialect = dbDialect.trim() || 'postgres';
  return sanitizeDockerResourceName(`${prefix}-${envName}-${dialect}`);
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

  const resolvedName = env.name || envName?.trim() || config.lastEnv || 'default';
  const source = normalizeEnvSource(env);
  const dockerNetworkName = sanitizeDockerResourceName(
    getEffectiveCliConfigValue(config, 'docker.network') || defaultDockerNetworkName(),
  );
  const dockerContainerPrefix = sanitizeDockerResourceName(
    getEffectiveCliConfigValue(config, 'docker.container-prefix') || defaultDockerContainerPrefix(),
  );
  const kind = env.kind ?? resolveEnvKind(env.config);

  if (kind === 'docker') {
    return {
      kind: 'docker',
      env,
      envName: resolvedName,
      source: 'docker',
      dockerNetworkName,
      dockerContainerPrefix,
      workspaceName: dockerNetworkName,
      containerName: buildDockerAppContainerName(resolvedName, dockerContainerPrefix),
    };
  }

  if (kind === 'local') {
    return {
      kind: 'local',
      env,
      envName: resolvedName,
      source: source === 'git' ? 'git' : source === 'npm' ? 'npm' : 'local',
      projectRoot: env.sourcePath,
      dockerNetworkName,
      dockerContainerPrefix,
      workspaceName: dockerNetworkName,
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
      `If you want to create a new NocoBase AI environment, run \`nb init --ui --env ${requested}\` first.`,
    ].join('\n');
  }

  return 'No NocoBase env is configured yet. Run `nb init --ui` to create one first.';
}

export function managedAppLifecycleEnvVars(): Record<string, string> {
  return {
    APP_ENV: 'production',
    NODE_ENV: 'production',
  };
}

export async function runLocalNocoBaseCommand(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' }>,
  args: string[],
  options?: {
    stdio?: 'inherit' | 'pipe' | 'ignore';
    env?: Record<string, string>;
    onStdout?: (chunk: string) => void;
    onStderr?: (chunk: string) => void;
  },
): Promise<void> {
  const envVars = await buildRuntimeEnvVars(runtime);
  const appEnvPath = resolveManagedLocalEnvFilePath(runtime);
  await runNocoBaseCommand(args, {
    cwd: runtime.projectRoot,
    env: {
      ...envVars,
      APP_ENV_PATH: appEnvPath,
      ...options?.env,
    },
    stdio: options?.stdio,
    onStdout: options?.onStdout,
    onStderr: options?.onStderr,
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

export async function runDockerNocoBaseCommand(
  containerName: string,
  args: string[],
  options?: {
    stdio?: 'inherit' | 'pipe' | 'ignore';
    env?: Record<string, string>;
    onStdout?: (chunk: string) => void;
    onStderr?: (chunk: string) => void;
  },
): Promise<void> {
  await startDockerContainer(containerName, { stdio: options?.stdio });
  const dockerEnvArgs = Object.entries(options?.env ?? {}).flatMap(([key, value]) => ['-e', `${key}=${value}`]);
  await run(
    'docker',
    ['exec', ...dockerEnvArgs, '-w', DOCKER_APP_WORKDIR, containerName, 'yarn', 'nocobase', ...args],
    {
      errorName: 'docker exec',
      stdio: options?.stdio,
      onStdout: options?.onStdout,
      onStderr: options?.onStderr,
    },
  );
}
