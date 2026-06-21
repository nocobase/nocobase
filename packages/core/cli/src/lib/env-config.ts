/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { EnvConfigEntry } from './auth-store.js';
import { resolveAppPublicPath } from './app-public-path.js';

const STRING_ENV_CONFIG_KEYS = [
  'source',
  'downloadVersion',
  'dockerRegistry',
  'dockerPlatform',
  'gitUrl',
  'npmRegistry',
  'appPath',
  'appRootPath',
  'storagePath',
  'appPublicPath',
  'cdnBaseUrl',
  'envFile',
  'appPort',
  'appKey',
  'timezone',
  'authUsername',
  'dbDialect',
  'builtinDbImage',
  'dbHost',
  'dbPort',
  'dbDatabase',
  'dbUser',
  'dbPassword',
  'dbSchema',
  'dbTablePrefix',
  'lang',
  'rootUsername',
  'rootEmail',
  'rootPassword',
  'rootNickname',
] as const;

const BOOLEAN_ENV_CONFIG_KEYS = [
  'builtinDb',
  'devDependencies',
  'build',
  'buildDts',
  'dbUnderscored',
] as const;

type StringEnvConfigKey = (typeof STRING_ENV_CONFIG_KEYS)[number];
type BooleanEnvConfigKey = (typeof BOOLEAN_ENV_CONFIG_KEYS)[number];

export const ENV_CONFIG_SCHEMA_VERSION = 1;

export type StoredEnvConfigInput = {
  apiBaseUrl?: unknown;
  authType?: unknown;
  accessToken?: unknown;
  setupState?: unknown;
  schemaVersion?: unknown;
} & Partial<Record<StringEnvConfigKey | BooleanEnvConfigKey, unknown>>;

export type StoredEnvConfig = Partial<
  Omit<EnvConfigEntry, 'auth' | 'runtime' | 'baseUrl' | 'apibaseUrl'>
> & {
  accessToken?: string;
};

function trimConfigValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function resolveSetupState(value: unknown): EnvConfigEntry['setupState'] {
  return value === 'prepared' || value === 'installed' ? value : undefined;
}

export function normalizeEnvConfigSchemaVersion(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

function resolveEnvKind(input: StoredEnvConfigInput): EnvConfigEntry['kind'] {
  const source = trimConfigValue(input.source);
  const appPath = trimConfigValue(input.appPath);
  const appRootPath = trimConfigValue(input.appRootPath);

  if (source === 'docker') {
    return 'docker';
  }

  if (source === 'npm' || source === 'git' || source === 'local' || appPath || appRootPath) {
    return 'local';
  }

  return 'http';
}

export function buildStoredEnvConfig(input: StoredEnvConfigInput): StoredEnvConfig {
  const envConfig: StoredEnvConfig = {
    schemaVersion: normalizeEnvConfigSchemaVersion(input.schemaVersion) ?? ENV_CONFIG_SCHEMA_VERSION,
    kind: resolveEnvKind(input),
    apiBaseUrl: trimConfigValue(input.apiBaseUrl) ?? '',
  };

  for (const key of STRING_ENV_CONFIG_KEYS) {
    const value = trimConfigValue(input[key]);
    if (value) {
      envConfig[key] = key === 'appPublicPath' ? resolveAppPublicPath(value) : value;
    }
  }

  const setupState = resolveSetupState(input.setupState);
  if (setupState) {
    envConfig.setupState = setupState;
  }

  for (const key of BOOLEAN_ENV_CONFIG_KEYS) {
    const value = input[key];
    if (typeof value === 'boolean') {
      envConfig[key] = value;
    }
  }

  if (input.builtinDb === false) {
    envConfig.builtinDbImage = undefined;
  }

  if (input.builtinDb === true) {
    delete envConfig.dbHost;
    const source = trimConfigValue(input.source);
    if (source === 'docker') {
      delete envConfig.dbPort;
    }
  }

  const authType = trimConfigValue(input.authType);
  if (authType === 'basic' || authType === 'token' || authType === 'oauth') {
    envConfig.authType = authType;
  }
  const accessToken = trimConfigValue(input.accessToken);
  if ((authType === 'basic' || authType === 'token') && accessToken) {
    envConfig.accessToken = accessToken;
  }

  return envConfig;
}
