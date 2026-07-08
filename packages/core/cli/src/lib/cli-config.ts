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
import { resolveCliHomeRoot, resolveDefaultConfigScope } from './cli-home.js';
import { CLI_LOCALE_FLAG_OPTIONS, normalizeCliLocale, resolveCliLocale } from './cli-locale.js';
import {
  DEFAULT_NB_IMAGE_REGISTRY,
  DEFAULT_NB_IMAGE_VARIANT,
  NB_IMAGE_REGISTRY_OPTIONS,
  NB_IMAGE_VARIANT_OPTIONS,
  normalizeNbImageRegistry,
  normalizeNbImageVariant,
  type NbImageRegistry,
  type NbImageVariant,
} from './docker-image.js';

export const DEFAULT_LICENSE_PKG_URL = 'https://pkg.nocobase.com/';
export const DEFAULT_DOCKER_NETWORK = 'nocobase';
export const DEFAULT_DOCKER_CONTAINER_PREFIX = 'nb';
export const DEFAULT_DOCKER_BIN = 'docker';
export const DEFAULT_CADDY_BIN = 'caddy';
export const DEFAULT_GIT_BIN = 'git';
export const DEFAULT_NGINX_BIN = 'nginx';
export const DEFAULT_PNPM_BIN = 'pnpm';
export const PROXY_PROVIDER_OPTIONS = ['nginx', 'caddy'] as const;
export type ProxyProvider = (typeof PROXY_PROVIDER_OPTIONS)[number];
export const DEFAULT_PROXY_PROVIDER: ProxyProvider = 'nginx';
export const NGINX_PROXY_DRIVER_OPTIONS = ['local', 'docker'] as const;
export type NginxProxyDriver = (typeof NGINX_PROXY_DRIVER_OPTIONS)[number];
export const DEFAULT_NGINX_PROXY_DRIVER: NginxProxyDriver = 'local';
export const CADDY_PROXY_DRIVER_OPTIONS = ['local', 'docker'] as const;
export type CaddyProxyDriver = (typeof CADDY_PROXY_DRIVER_OPTIONS)[number];
export const DEFAULT_CADDY_PROXY_DRIVER: CaddyProxyDriver = 'local';
export const DEFAULT_PROXY_HOST = '127.0.0.1';
export const DEFAULT_YARN_BIN = 'yarn';
export const DEFAULT_LOG_RETENTION_DAYS = 14;
export const DEFAULT_LOG_ENABLED = true;
export const CLI_UPDATE_POLICY_OPTIONS = ['prompt', 'auto', 'off'] as const;
export type CliUpdatePolicy = (typeof CLI_UPDATE_POLICY_OPTIONS)[number];
export const DEFAULT_UPDATE_POLICY: CliUpdatePolicy = 'prompt';

export const SUPPORTED_CLI_CONFIG_KEYS = [
  'locale',
  'default-ui-host',
  'default-api-host',
  'update.policy',
  'license.pkg-url',
  'docker.network',
  'docker.container-prefix',
  'nb-image-registry',
  'nb-image-variant',
  'bin.docker',
  'bin.caddy',
  'bin.git',
  'bin.nginx',
  'bin.pnpm',
  'proxy.nb-cli-root',
  'proxy.caddy-driver',
  'proxy.nginx-driver',
  'proxy.upstream-host',
  'bin.yarn',
  'log.enabled',
  'log.retention-days',
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
    throw new Error(`Unsupported config key "${value}". Supported keys: ${SUPPORTED_CLI_CONFIG_KEYS.join(', ')}`);
  }
  return value;
}

export function normalizeCliUpdatePolicy(value: unknown): CliUpdatePolicy | undefined {
  const normalized = trimValue(value);
  if (!normalized) {
    return undefined;
  }

  return (CLI_UPDATE_POLICY_OPTIONS as readonly string[]).includes(normalized) ? (normalized as CliUpdatePolicy) : undefined;
}

export function normalizeProxyProvider(value: unknown): ProxyProvider | undefined {
  const normalized = trimValue(value);
  if (!normalized) {
    return undefined;
  }

  return (PROXY_PROVIDER_OPTIONS as readonly string[]).includes(normalized) ? (normalized as ProxyProvider) : undefined;
}

export function normalizeNginxProxyDriver(value: unknown): NginxProxyDriver | undefined {
  const normalized = trimValue(value);
  if (!normalized) {
    return undefined;
  }

  return (NGINX_PROXY_DRIVER_OPTIONS as readonly string[]).includes(normalized)
    ? (normalized as NginxProxyDriver)
    : undefined;
}

export function normalizeCaddyProxyDriver(value: unknown): CaddyProxyDriver | undefined {
  const normalized = trimValue(value);
  if (!normalized) {
    return undefined;
  }

  return (CADDY_PROXY_DRIVER_OPTIONS as readonly string[]).includes(normalized)
    ? (normalized as CaddyProxyDriver)
    : undefined;
}

function cloneSettings(config: AuthConfig): NonNullable<AuthConfig['settings']> {
  return {
    ...(config.settings?.locale ? { locale: trimValue(config.settings.locale) } : {}),
    init: config.settings?.init ? { ...config.settings.init } : undefined,
    update: config.settings?.update ? { ...config.settings.update } : undefined,
    license: config.settings?.license ? { ...config.settings.license } : undefined,
    docker: config.settings?.docker ? { ...config.settings.docker } : undefined,
    bin: config.settings?.bin ? { ...config.settings.bin } : undefined,
    proxy: config.settings?.proxy ? { ...config.settings.proxy } : undefined,
    log: config.settings?.log ? { ...config.settings.log } : undefined,
  };
}

function pruneSettings(config: AuthConfig): void {
  if (config.settings && !trimValue(config.settings.locale)) {
    delete config.settings.locale;
  }

  const init = config.settings?.init;
  if (init && !trimValue(init.defaultUiHost) && !trimValue(init.defaultApiHost)) {
    delete config.settings?.init;
  }

  const update = config.settings?.update;
  if (update && !normalizeCliUpdatePolicy(update.policy)) {
    delete config.settings?.update;
  }

  const license = config.settings?.license;
  if (license && !trimValue(license.pkgUrl)) {
    delete config.settings?.license;
  }

  const docker = config.settings?.docker;
  if (
    docker &&
    !trimValue(docker.network) &&
    !trimValue(docker.containerPrefix) &&
    !trimValue(docker.nbImageRegistry) &&
    !trimValue(docker.nbImageVariant)
  ) {
    delete config.settings?.docker;
  }

  const bin = config.settings?.bin;
  if (
    bin &&
    !trimValue(bin.docker) &&
    !trimValue(bin.caddy) &&
    !trimValue(bin.git) &&
    !trimValue(bin.nginx) &&
    !trimValue(bin.pnpm) &&
    !trimValue(bin.yarn)
  ) {
    delete config.settings?.bin;
  }

  const proxy = config.settings?.proxy;
  if (
    proxy &&
    !trimValue(proxy.nbCliRoot) &&
    !trimValue(proxy.caddyDriver) &&
    !trimValue(proxy.nginxDriver) &&
    !trimValue(proxy.upstreamHost)
  ) {
    delete config.settings?.proxy;
  }

  const log = config.settings?.log;
  if (log && typeof log.enabled !== 'boolean' && (!Number.isInteger(log.retentionDays) || log.retentionDays < 0)) {
    delete config.settings?.log;
  }

  if (
    config.settings &&
    !config.settings.locale &&
    !config.settings.init &&
    !config.settings.update &&
    !config.settings.license &&
    !config.settings.docker &&
    !config.settings.bin &&
    !config.settings.proxy &&
    !config.settings.log
  ) {
    delete config.settings;
  }
}

export function getExplicitCliConfigValue(config: AuthConfig, key: SupportedCliConfigKey): string | undefined {
  switch (key) {
    case 'locale':
      return trimValue(config.settings?.locale);
    case 'default-ui-host':
      return trimValue(config.settings?.init?.defaultUiHost);
    case 'default-api-host':
      return trimValue(config.settings?.init?.defaultApiHost);
    case 'update.policy':
      return normalizeCliUpdatePolicy(config.settings?.update?.policy);
    case 'license.pkg-url':
      return trimValue(config.settings?.license?.pkgUrl);
    case 'docker.network':
      return trimValue(config.settings?.docker?.network);
    case 'docker.container-prefix':
      return trimValue(config.settings?.docker?.containerPrefix);
    case 'nb-image-registry':
      return normalizeNbImageRegistry(config.settings?.docker?.nbImageRegistry);
    case 'nb-image-variant':
      return normalizeNbImageVariant(config.settings?.docker?.nbImageVariant);
    case 'bin.docker':
      return trimValue(config.settings?.bin?.docker);
    case 'bin.caddy':
      return trimValue(config.settings?.bin?.caddy);
    case 'bin.git':
      return trimValue(config.settings?.bin?.git);
    case 'bin.nginx':
      return trimValue(config.settings?.bin?.nginx);
    case 'bin.pnpm':
      return trimValue(config.settings?.bin?.pnpm);
    case 'proxy.nb-cli-root':
      return trimValue(config.settings?.proxy?.nbCliRoot);
    case 'proxy.caddy-driver':
      return normalizeCaddyProxyDriver(config.settings?.proxy?.caddyDriver);
    case 'proxy.nginx-driver':
      return normalizeNginxProxyDriver(config.settings?.proxy?.nginxDriver);
    case 'proxy.upstream-host':
      return trimValue(config.settings?.proxy?.upstreamHost);
    case 'bin.yarn':
      return trimValue(config.settings?.bin?.yarn);
    case 'log.enabled':
      return typeof config.settings?.log?.enabled === 'boolean' ? String(config.settings?.log?.enabled) : undefined;
    case 'log.retention-days':
      return Number.isInteger(config.settings?.log?.retentionDays)
        ? String(config.settings?.log?.retentionDays)
        : undefined;
  }
}

export function getEffectiveCliConfigValue(config: AuthConfig, key: SupportedCliConfigKey): string {
  const explicit = getExplicitCliConfigValue(config, key);
  if (explicit && key !== 'locale') {
    return explicit;
  }

  switch (key) {
    case 'locale':
      return resolveCliLocale(undefined, { configuredLocale: trimValue(config.settings?.locale) });
    case 'default-ui-host':
      return '127.0.0.1';
    case 'default-api-host':
      return '127.0.0.1';
    case 'update.policy':
      return explicit ?? DEFAULT_UPDATE_POLICY;
    case 'license.pkg-url':
      return DEFAULT_LICENSE_PKG_URL;
    case 'docker.network':
      return trimValue(config.name) || DEFAULT_DOCKER_NETWORK;
    case 'docker.container-prefix':
      return trimValue(config.name) || DEFAULT_DOCKER_CONTAINER_PREFIX;
    case 'nb-image-registry':
      return explicit ?? (resolveCliLocale(undefined, { configuredLocale: trimValue(config.settings?.locale) }) === 'zh-CN'
        ? 'aliyun'
        : DEFAULT_NB_IMAGE_REGISTRY);
    case 'nb-image-variant':
      return explicit ?? DEFAULT_NB_IMAGE_VARIANT;
    case 'bin.docker':
      return DEFAULT_DOCKER_BIN;
    case 'bin.caddy':
      return DEFAULT_CADDY_BIN;
    case 'bin.git':
      return DEFAULT_GIT_BIN;
    case 'bin.nginx':
      return DEFAULT_NGINX_BIN;
    case 'bin.pnpm':
      return DEFAULT_PNPM_BIN;
    case 'proxy.nb-cli-root':
      return explicit ?? resolveCliHomeRoot();
    case 'proxy.caddy-driver':
      return explicit ?? DEFAULT_CADDY_PROXY_DRIVER;
    case 'proxy.nginx-driver':
      return explicit ?? DEFAULT_NGINX_PROXY_DRIVER;
    case 'proxy.upstream-host':
      return explicit ?? DEFAULT_PROXY_HOST;
    case 'bin.yarn':
      return DEFAULT_YARN_BIN;
    case 'log.enabled':
      return explicit ?? String(DEFAULT_LOG_ENABLED);
    case 'log.retention-days':
      return explicit ?? String(DEFAULT_LOG_RETENTION_DAYS);
  }
}

export function normalizeCliConfigValue(key: SupportedCliConfigKey, value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Config key "${key}" requires a non-empty value.`);
  }

  if (key === 'license.pkg-url') {
    return normalized.replace(/\/+$/, '') + '/';
  }

  if (key === 'locale') {
    const locale = normalizeCliLocale(normalized);
    if (!locale) {
      throw new Error(`Config key "${key}" must be one of: ${CLI_LOCALE_FLAG_OPTIONS.join(', ')}`);
    }

    return locale;
  }

  if (key === 'update.policy') {
    const policy = normalizeCliUpdatePolicy(normalized);
    if (!policy) {
      throw new Error(`Config key "${key}" must be one of: ${CLI_UPDATE_POLICY_OPTIONS.join(', ')}`);
    }

    return policy;
  }

  if (key === 'log.retention-days') {
    const retentionDays = Number.parseInt(normalized, 10);
    if (!Number.isInteger(retentionDays) || retentionDays < 0) {
      throw new Error(`Config key "${key}" must be a non-negative integer.`);
    }

    return String(retentionDays);
  }

  if (key === 'log.enabled') {
    if (normalized !== 'true' && normalized !== 'false') {
      throw new Error(`Config key "${key}" must be either "true" or "false".`);
    }

    return normalized;
  }

  if (key === 'proxy.nginx-driver') {
    const driver = normalizeNginxProxyDriver(normalized);
    if (!driver) {
      throw new Error(`Config key "${key}" must be one of: ${NGINX_PROXY_DRIVER_OPTIONS.join(', ')}`);
    }

    return driver;
  }

  if (key === 'proxy.caddy-driver') {
    const driver = normalizeCaddyProxyDriver(normalized);
    if (!driver) {
      throw new Error(`Config key "${key}" must be one of: ${CADDY_PROXY_DRIVER_OPTIONS.join(', ')}`);
    }

    return driver;
  }

  if (key === 'nb-image-registry') {
    const registry = normalizeNbImageRegistry(normalized);
    if (!registry) {
      throw new Error(`Config key "${key}" must be one of: ${NB_IMAGE_REGISTRY_OPTIONS.join(', ')}`);
    }

    return registry;
  }

  if (key === 'nb-image-variant') {
    const variant = normalizeNbImageVariant(normalized);
    if (!variant) {
      throw new Error(`Config key "${key}" must be one of: ${NB_IMAGE_VARIANT_OPTIONS.join(', ')}`);
    }

    return variant;
  }

  return normalized;
}

export async function loadCliConfig(options: CliConfigOptions = {}): Promise<AuthConfig> {
  return await loadExactAuthConfig(resolveScope(options));
}

export async function getCliConfigValue(key: SupportedCliConfigKey, options: CliConfigOptions = {}): Promise<string> {
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
    case 'locale':
      config.settings.locale = normalized;
      break;
    case 'default-ui-host':
      config.settings.init = {
        ...(config.settings.init ?? {}),
        defaultUiHost: normalized,
      };
      break;
    case 'default-api-host':
      config.settings.init = {
        ...(config.settings.init ?? {}),
        defaultApiHost: normalized,
      };
      break;
    case 'update.policy':
      config.settings.update = {
        ...(config.settings.update ?? {}),
        policy: normalized as CliUpdatePolicy,
      };
      break;
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
    case 'nb-image-registry':
      config.settings.docker = {
        ...(config.settings.docker ?? {}),
        nbImageRegistry: normalized as NbImageRegistry,
      };
      break;
    case 'nb-image-variant':
      config.settings.docker = {
        ...(config.settings.docker ?? {}),
        nbImageVariant: normalized as NbImageVariant,
      };
      break;
    case 'bin.docker':
      config.settings.bin = {
        ...(config.settings.bin ?? {}),
        docker: normalized,
      };
      break;
    case 'bin.caddy':
      config.settings.bin = {
        ...(config.settings.bin ?? {}),
        caddy: normalized,
      };
      break;
    case 'bin.git':
      config.settings.bin = {
        ...(config.settings.bin ?? {}),
        git: normalized,
      };
      break;
    case 'bin.nginx':
      config.settings.bin = {
        ...(config.settings.bin ?? {}),
        nginx: normalized,
      };
      break;
    case 'bin.pnpm':
      config.settings.bin = {
        ...(config.settings.bin ?? {}),
        pnpm: normalized,
      };
      break;
    case 'proxy.nb-cli-root':
      config.settings.proxy = {
        ...(config.settings.proxy ?? {}),
        nbCliRoot: normalized,
      };
      break;
    case 'proxy.caddy-driver':
      config.settings.proxy = {
        ...(config.settings.proxy ?? {}),
        caddyDriver: normalized,
      };
      break;
    case 'proxy.nginx-driver':
      config.settings.proxy = {
        ...(config.settings.proxy ?? {}),
        nginxDriver: normalized,
      };
      break;
    case 'proxy.upstream-host':
      config.settings.proxy = {
        ...(config.settings.proxy ?? {}),
        upstreamHost: normalized,
      };
      break;
    case 'bin.yarn':
      config.settings.bin = {
        ...(config.settings.bin ?? {}),
        yarn: normalized,
      };
      break;
    case 'log.enabled':
      config.settings.log = {
        ...(config.settings.log ?? {}),
        enabled: normalized === 'true',
      };
      break;
    case 'log.retention-days':
      config.settings.log = {
        ...(config.settings.log ?? {}),
        retentionDays: Number.parseInt(normalized, 10),
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
    case 'locale':
      delete config.settings.locale;
      break;
    case 'default-ui-host':
      if (config.settings.init) {
        delete config.settings.init.defaultUiHost;
      }
      break;
    case 'default-api-host':
      if (config.settings.init) {
        delete config.settings.init.defaultApiHost;
      }
      break;
    case 'update.policy':
      if (config.settings.update) {
        delete config.settings.update.policy;
      }
      break;
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
    case 'nb-image-registry':
      if (config.settings.docker) {
        delete config.settings.docker.nbImageRegistry;
      }
      break;
    case 'nb-image-variant':
      if (config.settings.docker) {
        delete config.settings.docker.nbImageVariant;
      }
      break;
    case 'bin.docker':
      if (config.settings.bin) {
        delete config.settings.bin.docker;
      }
      break;
    case 'bin.caddy':
      if (config.settings.bin) {
        delete config.settings.bin.caddy;
      }
      break;
    case 'bin.git':
      if (config.settings.bin) {
        delete config.settings.bin.git;
      }
      break;
    case 'bin.nginx':
      if (config.settings.bin) {
        delete config.settings.bin.nginx;
      }
      break;
    case 'bin.pnpm':
      if (config.settings.bin) {
        delete config.settings.bin.pnpm;
      }
      break;
    case 'proxy.nb-cli-root':
      if (config.settings.proxy) {
        delete config.settings.proxy.nbCliRoot;
      }
      break;
    case 'proxy.caddy-driver':
      if (config.settings.proxy) {
        delete config.settings.proxy.caddyDriver;
      }
      break;
    case 'proxy.nginx-driver':
      if (config.settings.proxy) {
        delete config.settings.proxy.nginxDriver;
      }
      break;
    case 'proxy.upstream-host':
      if (config.settings.proxy) {
        delete config.settings.proxy.upstreamHost;
      }
      break;
    case 'bin.yarn':
      if (config.settings.bin) {
        delete config.settings.bin.yarn;
      }
      break;
    case 'log.enabled':
      if (config.settings.log) {
        delete config.settings.log.enabled;
      }
      break;
    case 'log.retention-days':
      if (config.settings.log) {
        delete config.settings.log.retentionDays;
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

export async function resolveDefaultUiHost(options: CliConfigOptions = {}): Promise<string> {
  return await getCliConfigValue('default-ui-host', options);
}

export async function resolveDefaultApiHost(options: CliConfigOptions = {}): Promise<string> {
  return await getCliConfigValue('default-api-host', options);
}

export async function resolveDockerContainerPrefix(options: CliConfigOptions = {}): Promise<string> {
  return await getCliConfigValue('docker.container-prefix', options);
}

export async function resolveLicensePkgUrlFromConfig(options: CliConfigOptions = {}): Promise<string> {
  return await getCliConfigValue('license.pkg-url', options);
}

const CONFIGURABLE_COMMAND_KEYS = {
  docker: 'bin.docker',
  caddy: 'bin.caddy',
  git: 'bin.git',
  nginx: 'bin.nginx',
  pnpm: 'bin.pnpm',
  yarn: 'bin.yarn',
} as const;

export type ConfigurableCommandName = keyof typeof CONFIGURABLE_COMMAND_KEYS;

export function isConfigurableCommandName(value: string): value is ConfigurableCommandName {
  return Object.prototype.hasOwnProperty.call(CONFIGURABLE_COMMAND_KEYS, value);
}

export async function resolveConfiguredCommandName(
  commandName: string,
  options: CliConfigOptions = {},
): Promise<string> {
  if (!isConfigurableCommandName(commandName)) {
    return commandName;
  }

  return await getCliConfigValue(CONFIGURABLE_COMMAND_KEYS[commandName], options);
}
