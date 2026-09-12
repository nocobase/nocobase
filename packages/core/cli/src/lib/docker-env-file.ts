/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { access } from 'node:fs/promises';
import { resolveConfiguredEnvPath } from './cli-home.js';
import type { EnvConfigEntry } from './auth-store.js';
import { inferConfiguredAppPathFromLegacyConfig } from './env-paths.js';

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function appendDotEnvPath(basePath: string): string {
  return `${basePath.replace(/[\\/]+$/, '')}/.env`;
}

export function defaultDockerEnvFilePath(
  envName: string,
  config?: Partial<Pick<EnvConfigEntry, 'appPath' | 'appRootPath' | 'storagePath'>>,
): string {
  const appPath = inferConfiguredAppPathFromLegacyConfig(config ?? {});
  if (appPath) {
    return appendDotEnvPath(appPath);
  }

  return `${envName}/.env`;
}

export function resolveConfiguredDockerEnvFilePath(
  envName: string,
  config?: Partial<EnvConfigEntry>,
): string {
  return trimValue(config?.envFile) || defaultDockerEnvFilePath(envName, config);
}

export function hasExplicitDockerEnvFile(config?: Partial<EnvConfigEntry>): boolean {
  return Boolean(trimValue(config?.envFile));
}

export function resolveDockerEnvFilePath(
  envName: string,
  config?: Partial<EnvConfigEntry>,
): string | undefined {
  return resolveConfiguredEnvPath(resolveConfiguredDockerEnvFilePath(envName, config));
}

export async function dockerEnvFileExists(
  envName: string,
  config?: Partial<EnvConfigEntry>,
): Promise<boolean> {
  const filePath = resolveDockerEnvFilePath(envName, config);
  if (!filePath) {
    return false;
  }

  try {
    await access(filePath);
    return true;
  } catch (_error) {
    return false;
  }
}

export async function resolveDockerEnvFileArg(
  envName: string,
  config?: Partial<EnvConfigEntry>,
): Promise<string | undefined> {
  const filePath = resolveDockerEnvFilePath(envName, config);
  if (!filePath) {
    return undefined;
  }

  if (await dockerEnvFileExists(envName, config)) {
    return filePath;
  }

  if (hasExplicitDockerEnvFile(config)) {
    throw new Error(
      `The configured envFile for "${envName}" does not exist: ${resolveConfiguredDockerEnvFilePath(envName, config)}`,
    );
  }

  return undefined;
}
