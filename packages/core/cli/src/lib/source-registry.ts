/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import path from 'node:path';
import { commandOutput, commandSucceeds, resolveCwd, resolveProjectCwd, run } from './run-npm.js';
import { resolveCliHomeDir } from './cli-home.js';

export const DEFAULT_SOURCE_REGISTRY_HOST = '127.0.0.1';
export const DEFAULT_SOURCE_REGISTRY_PORT = 4873;
export const DEFAULT_SOURCE_REGISTRY_CONTAINER_NAME = 'nb-source-registry';
export const DEFAULT_SOURCE_REGISTRY_IMAGE = 'verdaccio/verdaccio';

export type SourceRegistryStatus = 'running' | 'stopped' | 'missing';

export type SourceRegistryInfo = {
  containerName: string;
  image: string;
  host: string;
  port: number;
  url: string;
  rootDir: string;
  configPath: string;
  storageDir: string;
  status: SourceRegistryStatus;
};

export function parseSourceRegistryUrl(url: string): { host: string; port: number } {
  const parsed = new URL(url);
  const host = trimValue(parsed.hostname) || DEFAULT_SOURCE_REGISTRY_HOST;
  const portText = trimValue(parsed.port);
  const port = portText ? Number(portText) : DEFAULT_SOURCE_REGISTRY_PORT;
  return {
    host,
    port: Number.isFinite(port) && port > 0 ? port : DEFAULT_SOURCE_REGISTRY_PORT,
  };
}

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function asPosixPathForDockerMount(value: string): string {
  return resolveCwd(value).replace(/\\/g, '/');
}

export function resolveSourceRegistryRootDir(): string {
  return path.join(resolveCliHomeDir(), 'verdaccio');
}

export function resolveSourceRegistryConfigPath(): string {
  return path.join(resolveSourceRegistryRootDir(), 'config.yaml');
}

export function resolveSourceRegistryStorageDir(): string {
  return path.join(resolveSourceRegistryRootDir(), 'storage');
}

export function resolveSourceRegistryUrl(
  host = DEFAULT_SOURCE_REGISTRY_HOST,
  port = DEFAULT_SOURCE_REGISTRY_PORT,
): string {
  return `http://${host}:${port}`;
}

export function getSourceRegistryInfo(): SourceRegistryInfo {
  const host = DEFAULT_SOURCE_REGISTRY_HOST;
  const port = DEFAULT_SOURCE_REGISTRY_PORT;
  const rootDir = resolveSourceRegistryRootDir();
  return {
    containerName: DEFAULT_SOURCE_REGISTRY_CONTAINER_NAME,
    image: DEFAULT_SOURCE_REGISTRY_IMAGE,
    host,
    port,
    url: resolveSourceRegistryUrl(host, port),
    rootDir,
    configPath: resolveSourceRegistryConfigPath(),
    storageDir: resolveSourceRegistryStorageDir(),
    status: 'missing',
  };
}

export function resolveSourceRegistryTemplatePath(cwd?: string): string {
  return path.join(resolveProjectCwd(cwd), 'config.yaml');
}

function applySourceRegistryTemplateOverrides(template: string): string {
  return template
    .replace(/\r\n/g, '\n')
    .replace(/^storage:\s*.+$/m, 'storage: /verdaccio/storage')
    .replace(/^(\s*)file:\s*\.\/*htpasswd\s*$/m, '$1file: /verdaccio/storage/htpasswd')
    .replace(/^(\s*)publish:\s+\$authenticated\s*$/gm, '$1publish: $all')
    .replace(/^(\s*)unpublish:\s+\$authenticated\s*$/gm, '$1unpublish: $all');
}

async function buildFallbackSourceRegistryConfigTemplate(): Promise<string> {
  return [
    'storage: ./storage',
    'auth:',
    '  htpasswd:',
    '    file: ./htpasswd',
    'uplinks:',
    '  npmjs:',
    '    url: https://registry.npmmirror.com/',
    'packages:',
    "  '@*/*':",
    '    access: $all',
    '    publish: $authenticated',
    '    unpublish: $authenticated',
    '    proxy: npmjs',
    "  '**':",
    '    access: $all',
    '    publish: $authenticated',
    '    unpublish: $authenticated',
    '    proxy: npmjs',
    'server:',
    '  keepAliveTimeout: 60',
    '  dotfiles: ignore',
    'max_body_size: 100mb',
    'middlewares:',
    '  audit:',
    '    enabled: true',
    '',
  ].join('\n');
}

export async function buildSourceRegistryConfig(cwd?: string): Promise<string> {
  const templatePath = resolveSourceRegistryTemplatePath(cwd);
  try {
    const template = await fsp.readFile(templatePath, 'utf8');
    return applySourceRegistryTemplateOverrides(template);
  } catch {
    const fallback = await buildFallbackSourceRegistryConfigTemplate();
    return applySourceRegistryTemplateOverrides(fallback);
  }
}

export async function ensureSourceRegistryFiles(cwd?: string): Promise<SourceRegistryInfo> {
  const info = getSourceRegistryInfo();
  await fsp.mkdir(info.storageDir, { recursive: true });
  await fsp.mkdir(info.rootDir, { recursive: true });
  await fsp.writeFile(info.configPath, await buildSourceRegistryConfig(cwd), 'utf8');
  return info;
}

export async function sourceRegistryContainerExists(
  containerName = DEFAULT_SOURCE_REGISTRY_CONTAINER_NAME,
): Promise<boolean> {
  return await commandSucceeds('docker', ['container', 'inspect', containerName]);
}

export async function sourceRegistryContainerIsRunning(
  containerName = DEFAULT_SOURCE_REGISTRY_CONTAINER_NAME,
): Promise<boolean> {
  try {
    const output = await commandOutput(
      'docker',
      ['inspect', '--format', '{{.State.Running}}', containerName],
      { errorName: 'docker inspect' },
    );
    return trimValue(output) === 'true';
  } catch {
    return false;
  }
}

export async function resolveSourceRegistryInfo(): Promise<SourceRegistryInfo> {
  const base = getSourceRegistryInfo();
  if (!(await sourceRegistryContainerExists(base.containerName))) {
    return base;
  }

  return {
    ...base,
    status: (await sourceRegistryContainerIsRunning(base.containerName)) ? 'running' : 'stopped',
  };
}

export async function startSourceRegistry(
  options?: { stdio?: 'inherit' | 'pipe' | 'ignore'; cwd?: string },
): Promise<'started' | 'already-running'> {
  const info = await ensureSourceRegistryFiles(options?.cwd);
  const exists = await sourceRegistryContainerExists(info.containerName);
  if (exists) {
    if (await sourceRegistryContainerIsRunning(info.containerName)) {
      return 'already-running';
    }

    await run('docker', ['start', info.containerName], {
      errorName: 'docker start',
      stdio: options?.stdio,
    });
    return 'started';
  }

  const configMount = `${asPosixPathForDockerMount(info.configPath)}:/verdaccio/conf/config.yaml`;
  const storageMount = `${asPosixPathForDockerMount(info.storageDir)}:/verdaccio/storage`;
  await run('docker', [
    'run',
    '-d',
    '--name',
    info.containerName,
    '-p',
    `${info.port}:4873`,
    '-v',
    configMount,
    '-v',
    storageMount,
    info.image,
  ], {
    errorName: 'docker run',
    stdio: options?.stdio,
  });
  return 'started';
}

export async function stopSourceRegistry(
  options?: { stdio?: 'inherit' | 'pipe' | 'ignore' },
): Promise<'stopped' | 'already-stopped'> {
  const info = getSourceRegistryInfo();
  if (!(await sourceRegistryContainerExists(info.containerName))) {
    return 'already-stopped';
  }

  if (!(await sourceRegistryContainerIsRunning(info.containerName))) {
    return 'already-stopped';
  }

  await run('docker', ['stop', info.containerName], {
    errorName: 'docker stop',
    stdio: options?.stdio,
  });
  return 'stopped';
}
