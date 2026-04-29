/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { EnvConfigEntry } from './auth-store.js';

const STRING_ENV_CONFIG_KEYS = [
  'source',
  'downloadVersion',
  'dockerRegistry',
  'dockerPlatform',
  'gitUrl',
  'npmRegistry',
  'appRootPath',
  'storagePath',
  'appPort',
  'appKey',
  'timezone',
  'dbDialect',
  'builtinDbImage',
  'dbHost',
  'dbPort',
  'dbDatabase',
  'dbUser',
  'dbPassword',
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
] as const;

type StringEnvConfigKey = (typeof STRING_ENV_CONFIG_KEYS)[number];
type BooleanEnvConfigKey = (typeof BOOLEAN_ENV_CONFIG_KEYS)[number];

export type StoredEnvConfigInput = {
  apiBaseUrl?: unknown;
  authType?: unknown;
  accessToken?: unknown;
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

function resolveEnvKind(input: StoredEnvConfigInput): EnvConfigEntry['kind'] {
  const source = trimConfigValue(input.source);
  const appRootPath = trimConfigValue(input.appRootPath);

  if (source === 'docker') {
    return 'docker';
  }

  if (source === 'npm' || source === 'git' || source === 'local' || appRootPath) {
    return 'local';
  }

  return 'http';
}

export function buildStoredEnvConfig(input: StoredEnvConfigInput): StoredEnvConfig {
  const envConfig: StoredEnvConfig = {
    kind: resolveEnvKind(input),
    apiBaseUrl: trimConfigValue(input.apiBaseUrl) ?? '',
  };

  for (const key of STRING_ENV_CONFIG_KEYS) {
    const value = trimConfigValue(input[key]);
    if (value) {
      envConfig[key] = value;
    }
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

  const authType = trimConfigValue(input.authType);
  const accessToken = trimConfigValue(input.accessToken);
  if (authType === 'token' && accessToken) {
    envConfig.accessToken = accessToken;
  }

  return envConfig;
}
