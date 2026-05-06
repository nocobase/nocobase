/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AuthConfig, AuthStoreOptions } from './auth-store.js';
import { loadExactAuthConfig, saveAuthConfig } from './auth-store.js';
import { resolveDefaultConfigScope } from './cli-home.js';

export const DEFAULT_LICENSE_PKG_URL = 'https://pkg.nocobase.com/';
export const DEFAULT_DOCKER_NETWORK = 'nocobase';
export const DEFAULT_DOCKER_CONTAINER_PREFIX = 'nb';

export const SUPPORTED_CLI_CONFIG_KEYS = [
  'license.pkg-url',
  'docker.network',
  'docker.container-prefix',
] as const;

export type SupportedCliConfigKey = (typeof SUPPORTED_CLI_CONFIG_KEYS)[number];

type CliConfigOptions = AuthStoreOptions;

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function resolveScope(options: CliConfigOptions = {}): AuthStoreOptions {
  return {
    scope: options.scope ?? resolveDefaultConfigScope(),
  };
}

export function isSupportedCliConfigKey(value: string): value is SupportedCliConfigKey {
  return (SUPPORTED_CLI_CONFIG_KEYS as readonly string[]).includes(value);
}

export function assertSupportedCliConfigKey(value: string): SupportedCliConfigKey {
  if (!isSupportedCliConfigKey(value)) {
    throw new Error(
      `Unsupported config key "${value}". Supported keys: ${SUPPORTED_CLI_CONFIG_KEYS.join(', ')}`,
    );
  }
  return value;
}

function cloneSettings(config: AuthConfig): NonNullable<AuthConfig['settings']> {
  return {
    license: config.settings?.license ? { ...config.settings.license } : undefined,
    docker: config.settings?.docker ? { ...config.settings.docker } : undefined,
  };
}

function pruneSettings(config: AuthConfig): void {
  const license = config.settings?.license;
  if (license && !trimValue(license.pkgUrl)) {
    delete config.settings?.license;
  }

  const docker = config.settings?.docker;
  if (docker && !trimValue(docker.network) && !trimValue(docker.containerPrefix)) {
    delete config.settings?.docker;
  }

  if (
    config.settings
    && !config.settings.license
    && !config.settings.docker
  ) {
    delete config.settings;
  }
}

export function getExplicitCliConfigValue(
  config: AuthConfig,
  key: SupportedCliConfigKey,
): string | undefined {
  switch (key) {
    case 'license.pkg-url':
      return trimValue(config.settings?.license?.pkgUrl);
    case 'docker.network':
      return trimValue(config.settings?.docker?.network);
    case 'docker.container-prefix':
      return trimValue(config.settings?.docker?.containerPrefix);
  }
}

export function getEffectiveCliConfigValue(
  config: AuthConfig,
  key: SupportedCliConfigKey,
): string {
  const explicit = getExplicitCliConfigValue(config, key);
  if (explicit) {
    return explicit;
  }

  switch (key) {
    case 'license.pkg-url':
      return DEFAULT_LICENSE_PKG_URL;
    case 'docker.network':
      return trimValue(config.name) || DEFAULT_DOCKER_NETWORK;
    case 'docker.container-prefix':
      return trimValue(config.name) || DEFAULT_DOCKER_CONTAINER_PREFIX;
  }
}

export function normalizeCliConfigValue(
  key: SupportedCliConfigKey,
  value: string,
): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Config key "${key}" requires a non-empty value.`);
  }

  if (key === 'license.pkg-url') {
    return normalized.replace(/\/+$/, '') + '/';
  }

  return normalized;
}

export async function loadCliConfig(options: CliConfigOptions = {}): Promise<AuthConfig> {
  return await loadExactAuthConfig(resolveScope(options));
}

export async function getCliConfigValue(
  key: SupportedCliConfigKey,
  options: CliConfigOptions = {},
): Promise<string> {
  const config = await loadCliConfig(options);
  return getEffectiveCliConfigValue(config, key);
}

export async function listExplicitCliConfigValues(
  options: CliConfigOptions = {},
): Promise<Partial<Record<SupportedCliConfigKey, string>>> {
  const config = await loadCliConfig(options);
  const out: Partial<Record<SupportedCliConfigKey, string>> = {};

  for (const key of SUPPORTED_CLI_CONFIG_KEYS) {
    const value = getExplicitCliConfigValue(config, key);
    if (value) {
      out[key] = value;
    }
  }

  return out;
}

export async function setCliConfigValue(
  key: SupportedCliConfigKey,
  value: string,
  options: CliConfigOptions = {},
): Promise<string> {
  const scope = resolveScope(options);
  const config = await loadExactAuthConfig(scope);
  const normalized = normalizeCliConfigValue(key, value);
  config.settings = cloneSettings(config);

  switch (key) {
    case 'license.pkg-url':
      config.settings.license = {
        ...(config.settings.license ?? {}),
        pkgUrl: normalized,
      };
      break;
    case 'docker.network':
      config.settings.docker = {
        ...(config.settings.docker ?? {}),
        network: normalized,
      };
      break;
    case 'docker.container-prefix':
      config.settings.docker = {
        ...(config.settings.docker ?? {}),
        containerPrefix: normalized,
      };
      break;
  }

  pruneSettings(config);
  await saveAuthConfig(config, scope);
  return normalized;
}

export async function deleteCliConfigValue(
  key: SupportedCliConfigKey,
  options: CliConfigOptions = {},
): Promise<boolean> {
  const scope = resolveScope(options);
  const config = await loadExactAuthConfig(scope);
  const hadValue = Boolean(getExplicitCliConfigValue(config, key));
  if (!hadValue) {
    return false;
  }

  config.settings = cloneSettings(config);

  switch (key) {
    case 'license.pkg-url':
      if (config.settings.license) {
        delete config.settings.license.pkgUrl;
      }
      break;
    case 'docker.network':
      if (config.settings.docker) {
        delete config.settings.docker.network;
      }
      break;
    case 'docker.container-prefix':
      if (config.settings.docker) {
        delete config.settings.docker.containerPrefix;
      }
      break;
  }

  pruneSettings(config);
  await saveAuthConfig(config, scope);
  return true;
}

export async function resolveDockerNetworkName(options: CliConfigOptions = {}): Promise<string> {
  return await getCliConfigValue('docker.network', options);
}

export async function resolveDockerContainerPrefix(options: CliConfigOptions = {}): Promise<string> {
  return await getCliConfigValue('docker.container-prefix', options);
}

export async function resolveLicensePkgUrlFromConfig(options: CliConfigOptions = {}): Promise<string> {
  return await getCliConfigValue('license.pkg-url', options);
}
