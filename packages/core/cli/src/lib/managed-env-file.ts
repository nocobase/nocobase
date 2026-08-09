/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ManagedAppRuntime } from './app-runtime.js';
import { normalizeAppClientEntryMode } from './app-client-entry-mode.js';
import { resolveEnvKind, type EnvConfigEntry } from './auth-store.js';
import { resolveConfiguredEnvPath } from './cli-home.js';
import { resolveDockerEnvFileArg, resolveDockerEnvFilePath } from './docker-env-file.ts';
import { resolveConfiguredAppPath } from './env-paths.js';

export const DEFAULT_MANAGED_ENV_FILE_VALUES = {
  APP_DISCOVERY_ADAPTER: 'local',
  APP_PROCESS_ADAPTER: 'local',
  APP_CLIENT_ENTRY_MODE: 'modern-only',
} as const;

function buildManagedEnvFileDefaults(
  config?: Partial<EnvConfigEntry>,
  defaults: Record<string, string> = DEFAULT_MANAGED_ENV_FILE_VALUES,
) {
  return {
    ...defaults,
    APP_CLIENT_ENTRY_MODE:
      normalizeAppClientEntryMode(config?.appClientEntryMode) ??
      trimValue(defaults.APP_CLIENT_ENTRY_MODE) ??
      DEFAULT_MANAGED_ENV_FILE_VALUES.APP_CLIENT_ENTRY_MODE,
  };
}

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function stripWrappingQuotes(value: string) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }

  return value;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function upsertSimpleEnvContent(content: string, values: Record<string, string>): string {
  let nextContent = content;
  const missingEntries = new Map(Object.entries(values).filter(([, value]) => trimValue(value)));

  for (const key of Array.from(missingEntries.keys())) {
    const pattern = new RegExp(`^\\s*(?:export\\s+)?${escapeRegExp(key)}\\s*=.*$`, 'gm');
    if (!pattern.test(nextContent)) {
      continue;
    }

    nextContent = nextContent.replace(pattern, `${key}=${values[key]}`);
    missingEntries.delete(key);
  }

  if (missingEntries.size === 0) {
    return nextContent;
  }

  const separator = nextContent && !nextContent.endsWith('\n') ? '\n' : '';
  const appended = Array.from(missingEntries.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  return `${nextContent}${separator}${appended}\n`;
}

export function parseSimpleEnvFile(content: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const line = trimmed.startsWith('export ') ? trimmed.slice('export '.length).trim() : trimmed;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key) {
      continue;
    }

    values[key] = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());
  }

  return values;
}

export function resolveManagedLocalEnvFilePath(runtime: Extract<ManagedAppRuntime, { kind: 'local' }>): string {
  const config = runtime.env.config ?? {};
  const explicitEnvFile = trimValue(config.envFile);
  if (explicitEnvFile) {
    return resolveConfiguredEnvPath(explicitEnvFile) ?? explicitEnvFile;
  }

  const configuredAppPath = resolveConfiguredAppPath(config);
  if (configuredAppPath) {
    return path.join(configuredAppPath, '.env');
  }

  if (path.basename(runtime.projectRoot) === 'source') {
    return path.resolve(runtime.projectRoot, '..', '.env');
  }

  return path.join(runtime.projectRoot, '.env');
}

export function resolveManagedEnvFilePathFromConfig(
  envName: string,
  config?: Partial<EnvConfigEntry>,
): string | undefined {
  const kind = config?.kind ?? resolveEnvKind(config);

  if (kind === 'docker') {
    return resolveDockerEnvFilePath(envName, config);
  }

  if (kind !== 'local') {
    return undefined;
  }

  const explicitEnvFile = trimValue(config?.envFile);
  if (explicitEnvFile) {
    return resolveConfiguredEnvPath(explicitEnvFile) ?? explicitEnvFile;
  }

  const configuredAppPath = resolveConfiguredAppPath(config);
  if (configuredAppPath) {
    return path.join(configuredAppPath, '.env');
  }

  const configuredAppRootPath = trimValue(config?.appRootPath);
  if (configuredAppRootPath) {
    const appRootPath = resolveConfiguredEnvPath(configuredAppRootPath) ?? configuredAppRootPath;
    return path.basename(appRootPath) === 'source'
      ? path.resolve(appRootPath, '..', '.env')
      : path.join(appRootPath, '.env');
  }

  return undefined;
}

export async function ensureManagedEnvFileDefaults(
  envName: string,
  config?: Partial<EnvConfigEntry>,
  defaults: Record<string, string> = DEFAULT_MANAGED_ENV_FILE_VALUES,
): Promise<string | undefined> {
  const envFilePath = resolveManagedEnvFilePathFromConfig(envName, config);
  if (!envFilePath) {
    return undefined;
  }

  let content = '';
  try {
    content = await readFile(envFilePath, 'utf8');
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : '';
    if (code !== 'ENOENT') {
      throw error;
    }
  }

  const existing = parseSimpleEnvFile(content);
  const resolvedDefaults = buildManagedEnvFileDefaults(config, defaults);
  const missingEntries = Object.entries(resolvedDefaults).filter(([key, value]) => trimValue(value) && !existing[key]);
  if (missingEntries.length === 0) {
    return envFilePath;
  }

  const separator = content && !content.endsWith('\n') ? '\n' : '';
  const nextContent = `${content}${separator}${missingEntries.map(([key, value]) => `${key}=${value}`).join('\n')}\n`;
  await mkdir(path.dirname(envFilePath), { recursive: true });
  await writeFile(envFilePath, nextContent, 'utf8');

  return envFilePath;
}

export async function upsertManagedEnvFileValues(
  envName: string,
  config: Partial<EnvConfigEntry> | undefined,
  values: Record<string, string>,
): Promise<string | undefined> {
  const envFilePath = resolveManagedEnvFilePathFromConfig(envName, config);
  if (!envFilePath) {
    return undefined;
  }

  let content = '';
  try {
    content = await readFile(envFilePath, 'utf8');
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : '';
    if (code !== 'ENOENT') {
      throw error;
    }
  }

  const nextContent = upsertSimpleEnvContent(content, values);
  if (nextContent === content) {
    return envFilePath;
  }

  await mkdir(path.dirname(envFilePath), { recursive: true });
  await writeFile(envFilePath, nextContent, 'utf8');

  return envFilePath;
}

export async function resolveManagedRuntimeEnvFilePath(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
): Promise<string | undefined> {
  if (runtime.kind === 'local') {
    return resolveManagedLocalEnvFilePath(runtime);
  }

  return await resolveDockerEnvFileArg(runtime.envName, runtime.env.config ?? {});
}

export async function readManagedRuntimeEnvValues(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
): Promise<{ envFilePath?: string; envValues: Record<string, string> }> {
  const envFilePath = await resolveManagedRuntimeEnvFilePath(runtime);
  if (!envFilePath) {
    return {
      envFilePath: undefined,
      envValues: {},
    };
  }

  try {
    return {
      envFilePath,
      envValues: parseSimpleEnvFile(await readFile(envFilePath, 'utf8')),
    };
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : '';
    if (code === 'ENOENT') {
      return {
        envFilePath,
        envValues: {},
      };
    }

    throw error;
  }
}
