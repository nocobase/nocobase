/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ManagedAppRuntime } from './app-runtime.js';
import { resolveConfiguredEnvPath } from './cli-home.js';
import { resolveDockerEnvFileArg } from './docker-env-file.ts';
import { resolveConfiguredAppPath } from './env-paths.js';

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function normalizeEnvFilePath(value: string): string {
  return value.replace(/\\/g, '/');
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
    return normalizeEnvFilePath(resolveConfiguredEnvPath(explicitEnvFile) ?? explicitEnvFile);
  }

  const configuredAppPath = resolveConfiguredAppPath(config);
  if (configuredAppPath) {
    return normalizeEnvFilePath(path.join(configuredAppPath, '.env'));
  }

  if (path.basename(runtime.projectRoot) === 'source') {
    return normalizeEnvFilePath(path.resolve(runtime.projectRoot, '..', '.env'));
  }

  return normalizeEnvFilePath(path.join(runtime.projectRoot, '.env'));
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
