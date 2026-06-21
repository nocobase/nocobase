/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CliHomeScope } from './cli-home.js';
import { resolveAppPublicPath } from './app-public-path.js';
import { resolveCliHomeDir, resolveConfiguredEnvPath, resolveEnvRelativePath } from './cli-home.js';
import { normalizeCliLocale } from './cli-locale.js';
import {
  inferConfiguredAppPathFromLegacyConfig,
  resolveConfiguredAppPath,
  resolveConfiguredSourcePath,
  resolveConfiguredStoragePath,
} from './env-paths.js';
import { ENV_CONFIG_SCHEMA_VERSION, normalizeEnvConfigSchemaVersion } from './env-config.js';
import {
  cleanupCurrentSessionAfterEnvRemoval,
  resolveEffectiveCurrentEnv,
  setSessionCurrentEnv,
} from './session-store.js';

export interface TokenAuthConfig {
  type: 'token';
  accessToken: string;
}

export interface OauthAuthConfig {
  type: 'oauth';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string;
  issuer?: string;
  clientId?: string;
  resource?: string;
}

export type EnvKind = 'local' | 'http' | 'docker' | 'ssh';

export interface EnvConfigEntry {
  /** Schema version of the persisted env config shape. */
  schemaVersion?: number;
  autostart?: {
    enabled?: boolean;
  };
  kind?: EnvKind;
  apiBaseUrl?: string;
  authType?: 'basic' | 'token' | 'oauth';
  /** Username to reuse when this env signs in through the CLI basic authenticator. */
  authUsername?: string;
  /** @deprecated Legacy config key; read-only compatibility for older config.json files. */
  baseUrl?: string;
  /** @deprecated Legacy typo kept for read compatibility with older config.json files. */
  apibaseUrl?: string;
  auth?: TokenAuthConfig | OauthAuthConfig;
  /** How this env's app was installed or fetched. */
  source?: string;
  /** Download/source version used for npm, git, or docker installs. */
  downloadVersion?: string;
  /** Docker image registry/repository used for docker installs. */
  dockerRegistry?: string;
  /** Docker image platform used for docker pulls. */
  dockerPlatform?: string;
  /** Git repository URL used for git installs. */
  gitUrl?: string;
  /** Custom npm registry used for npm/git installs. */
  npmRegistry?: string;
  /** Whether npm installs included development dependencies. */
  devDependencies?: boolean;
  /** Whether download built the app after fetching npm/git sources. */
  build?: boolean;
  /** Whether download emitted declaration files during build. */
  buildDts?: boolean;
  appPath?: string;
  appRootPath?: string;
  storagePath?: string;
  /** Application public path (APP_PUBLIC_PATH). */
  appPublicPath?: string;
  /** Client asset CDN base URL (CDN_BASE_URL). */
  cdnBaseUrl?: string;
  /** Optional internal env file path. Defaults to <app-path>/.env, or <envName>/.env for legacy Docker-only layouts. */
  envFile?: string;
  /** Application HTTP port (APP_PORT). */
  appPort?: number | string;
  /** Application secret key (APP_KEY). */
  appKey?: string;
  /** Application timezone (TZ). */
  timezone?: string;
  /** Initial root/admin user settings saved for install resume flows. */
  setupState?: 'prepared' | 'installed';
  /** Initial install language saved for prepare/install flows. */
  lang?: string;
  rootUsername?: string;
  rootEmail?: string;
  rootPassword?: string;
  rootNickname?: string;
  /** Whether this env was created with a CLI-managed built-in database. */
  builtinDb?: boolean;
  /** Docker image used for the CLI-managed built-in database container. */
  builtinDbImage?: string;
  /** Optional DB hints for this env (aligns with NocoBase DB_* / .env usage). */
  dbHost?: string;
  dbDatabase?: string;
  dbUser?: string;
  dbDialect?: string;
  dbPassword?: string;
  dbPort?: number | string;
  dbSchema?: string;
  dbTablePrefix?: string;
  dbUnderscored?: boolean;
  dbLogging?: boolean;
  runtime?: {
    version?: string;
    schemaHash?: string;
    generatedAt?: string;
  };
}

export interface AuthConfig {
  /** Workspace-level name shared by all envs in this config. */
  name?: string;
  settings?: {
    locale?: string;
    update?: {
      policy?: 'prompt' | 'auto' | 'off';
    };
    license?: {
      pkgUrl?: string;
    };
    docker?: {
      network?: string;
      containerPrefix?: string;
    };
    bin?: {
      docker?: string;
      caddy?: string;
      git?: string;
      nginx?: string;
      yarn?: string;
    };
    proxy?: {
      nbCliRoot?: string;
      caddyDriver?: string;
      nginxDriver?: string;
      upstreamHost?: string;
    };
    log?: {
      enabled?: boolean;
      retentionDays?: number;
    };
    init?: {
      defaultUiHost?: string;
      defaultApiHost?: string;
    };
  };
  lastEnv?: string;
  envs: Record<string, EnvConfigEntry>;
}

export interface AuthStoreOptions {
  scope?: CliHomeScope;
}

/** Options for {@link getEnv}; pass `config` to reuse a loaded snapshot and skip `loadAuthConfig`. */
export type GetEnvOptions = AuthStoreOptions & {
  config?: AuthConfig;
};

function normalizeStoredEnvKind(value: unknown): EnvKind | undefined {
  const kind = String(value ?? '').trim();
  if (kind === 'remote') {
    return 'http';
  }
  if (kind === 'local' || kind === 'http' || kind === 'docker' || kind === 'ssh') {
    return kind;
  }
  return undefined;
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
}

function normalizeOptionalCliLocale(value: unknown): string | undefined {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return undefined;
  }

  return normalizeCliLocale(normalized);
}

function normalizeOptionalCliUpdatePolicy(value: unknown): 'prompt' | 'auto' | 'off' | undefined {
  const normalized = normalizeOptionalString(value);
  if (normalized === 'prompt' || normalized === 'auto' || normalized === 'off') {
    return normalized;
  }

  return undefined;
}

export function readEnvApiBaseUrl(config?: Partial<EnvConfigEntry>): string | undefined {
  if (!config) {
    return undefined;
  }

  return (
    normalizeOptionalString((config as { apiBaseUrl?: unknown }).apiBaseUrl) ??
    normalizeOptionalString((config as { baseUrl?: unknown }).baseUrl) ??
    normalizeOptionalString((config as { apibaseUrl?: unknown }).apibaseUrl)
  );
}

export function resolveEnvKind(config?: Partial<EnvConfigEntry>): EnvKind | undefined {
  if (!config) {
    return undefined;
  }

  const explicitKind = normalizeStoredEnvKind((config as { kind?: unknown }).kind);
  if (explicitKind) {
    return explicitKind;
  }

  const source = String(config.source ?? '').trim();
  if (source === 'docker') {
    return 'docker';
  }

  if (source === 'npm' || source === 'git' || source === 'local') {
    return 'local';
  }

  if (String(config.appPath ?? '').trim() || String(config.appRootPath ?? '').trim()) {
    return 'local';
  }

  if (readEnvApiBaseUrl(config) || config.auth) {
    return 'http';
  }

  return undefined;
}

function normalizeEnvConfigEntry(entry: EnvConfigEntry | undefined): EnvConfigEntry | undefined {
  if (!entry) {
    return entry;
  }

  const {
    kind: _kind,
    apiBaseUrl: _apiBaseUrl,
    baseUrl: _baseUrl,
    apibaseUrl: _legacyApiBaseUrl,
    schemaVersion: _schemaVersion,
    ...rest
  } = entry as EnvConfigEntry & { kind?: unknown };
  const normalizedKind = resolveEnvKind(entry);
  const apiBaseUrl = readEnvApiBaseUrl(entry);
  const schemaVersion = normalizeEnvConfigSchemaVersion(entry.schemaVersion);
  return {
    ...rest,
    ...(schemaVersion ? { schemaVersion } : {}),
    ...(normalizedKind ? { kind: normalizedKind } : {}),
    ...(apiBaseUrl !== undefined ? { apiBaseUrl } : {}),
    ...(normalizeOptionalString(entry.appPublicPath) ? { appPublicPath: resolveAppPublicPath(entry.appPublicPath) } : {}),
  };
}

function normalizeAuthConfig(config: AuthConfig & { dockerResourcePrefix?: string }): AuthConfig {
  const settings = config.settings ?? {};
  const locale = normalizeOptionalCliLocale(settings.locale);
  const defaultUiHost = normalizeOptionalString(settings.init?.defaultUiHost);
  const defaultApiHost = normalizeOptionalString(settings.init?.defaultApiHost);
  const updatePolicy = normalizeOptionalCliUpdatePolicy(settings.update?.policy);
  const logRetentionDays =
    typeof settings.log?.retentionDays === 'number' && Number.isInteger(settings.log.retentionDays)
      ? settings.log.retentionDays
      : undefined;
  const logEnabled = typeof settings.log?.enabled === 'boolean' ? settings.log.enabled : undefined;
  return {
    name: config.name || config.dockerResourcePrefix,
    settings: {
      ...(locale ? { locale } : {}),
      ...(defaultUiHost || defaultApiHost
        ? {
            init: {
              ...(defaultUiHost ? { defaultUiHost } : {}),
              ...(defaultApiHost ? { defaultApiHost } : {}),
            },
          }
        : {}),
      ...(updatePolicy ? { update: { policy: updatePolicy } } : {}),
      ...(settings.license?.pkgUrl ? { license: { pkgUrl: normalizeOptionalString(settings.license.pkgUrl) } } : {}),
      ...(settings.docker?.network || settings.docker?.containerPrefix
        ? {
            docker: {
              ...(settings.docker?.network ? { network: normalizeOptionalString(settings.docker.network) } : {}),
              ...(settings.docker?.containerPrefix
                ? { containerPrefix: normalizeOptionalString(settings.docker.containerPrefix) }
                : {}),
            },
          }
        : {}),
      ...(settings.bin?.docker || settings.bin?.caddy || settings.bin?.git || settings.bin?.nginx || settings.bin?.yarn
        ? {
            bin: {
              ...(settings.bin?.docker ? { docker: normalizeOptionalString(settings.bin.docker) } : {}),
              ...(settings.bin?.caddy ? { caddy: normalizeOptionalString(settings.bin.caddy) } : {}),
              ...(settings.bin?.git ? { git: normalizeOptionalString(settings.bin.git) } : {}),
              ...(settings.bin?.nginx ? { nginx: normalizeOptionalString(settings.bin.nginx) } : {}),
              ...(settings.bin?.yarn ? { yarn: normalizeOptionalString(settings.bin.yarn) } : {}),
            },
          }
        : {}),
      ...(settings.proxy?.nbCliRoot ||
      settings.proxy?.caddyDriver ||
      settings.proxy?.nginxDriver ||
      settings.proxy?.upstreamHost ||
      (settings.proxy as { host?: unknown } | undefined)?.host
        ? {
            proxy: {
              ...(settings.proxy?.nbCliRoot ? { nbCliRoot: normalizeOptionalString(settings.proxy.nbCliRoot) } : {}),
              ...(settings.proxy?.caddyDriver
                ? { caddyDriver: normalizeOptionalString(settings.proxy.caddyDriver) }
                : {}),
              ...(settings.proxy?.nginxDriver
                ? { nginxDriver: normalizeOptionalString(settings.proxy.nginxDriver) }
                : {}),
              ...(settings.proxy?.upstreamHost || (settings.proxy as { host?: unknown } | undefined)?.host
                ? {
                    upstreamHost: normalizeOptionalString(
                      settings.proxy?.upstreamHost ?? (settings.proxy as { host?: unknown }).host,
                    ),
                  }
                : {}),
            },
          }
        : {}),
      ...(logEnabled !== undefined || logRetentionDays !== undefined
        ? {
            log: {
              ...(logEnabled !== undefined ? { enabled: logEnabled } : {}),
              ...(logRetentionDays !== undefined ? { retentionDays: logRetentionDays } : {}),
            },
          }
        : {}),
    },
    lastEnv:
      (config as AuthConfig & { currentEnv?: string }).lastEnv ||
      (config as { currentEnv?: string }).currentEnv ||
      'default',
    envs: Object.fromEntries(
      Object.entries(config.envs || {}).map(([envName, entry]) => [envName, normalizeEnvConfigEntry(entry) ?? {}]),
    ),
  };
}

function getConfigFile(options: AuthStoreOptions = {}) {
  return path.join(resolveCliHomeDir(options.scope), 'config.json');
}

function createDefaultConfig(): AuthConfig {
  return {
    lastEnv: 'default',
    envs: {},
  };
}

async function readStoredAuthConfig(filePath: string): Promise<AuthConfig | undefined> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content) as AuthConfig & {
      dockerResourcePrefix?: string;
    };
    return normalizeAuthConfig(parsed);
  } catch (_error) {
    return undefined;
  }
}

export async function loadExactAuthConfig(options: AuthStoreOptions = {}): Promise<AuthConfig> {
  return (await readStoredAuthConfig(getConfigFile(options))) ?? createDefaultConfig();
}

export async function loadAuthConfig(options: AuthStoreOptions = {}): Promise<AuthConfig> {
  return await loadExactAuthConfig(options);
}

export async function saveAuthConfig(config: AuthConfig, options: AuthStoreOptions = {}) {
  const filePath = getConfigFile(options);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(normalizeAuthConfig(config), null, 2));
}

export async function listEnvs(options: AuthStoreOptions = {}) {
  const config = await loadAuthConfig(options);
  return {
    lastEnv: config.lastEnv || 'default',
    envs: config.envs,
  };
}

export async function getCurrentEnvName(options: AuthStoreOptions = {}) {
  const config = await loadAuthConfig(options);
  return await resolveEffectiveCurrentEnv(Object.keys(config.envs).sort(), {
    scope: options.scope,
    lastEnv: config.lastEnv,
  });
}

export async function setCurrentEnv(envName: string, options: AuthStoreOptions = {}) {
  const config = await loadExactAuthConfig(options);
  if (!config.envs[envName]) {
    throw new Error(`Env "${envName}" is not configured`);
  }
  config.lastEnv = envName;
  await setSessionCurrentEnv(envName, options.scope);
  await saveAuthConfig(config, options);
}

export class Env {
  constructor(public readonly config: EnvConfigEntry & { name?: string } = {}) {}

  get name() {
    return this.config.name;
  }

  get baseUrl() {
    return readEnvApiBaseUrl(this.config);
  }

  get apiBaseUrl() {
    return readEnvApiBaseUrl(this.config);
  }

  get auth() {
    return this.config.auth;
  }

  get authType() {
    return resolveConfiguredAuthType(this.config);
  }

  get runtime() {
    return this.config.runtime;
  }

  get kind() {
    return resolveEnvKind(this.config);
  }

  get appRootPath() {
    if (this.kind === 'ssh') {
      const configuredPath = String(this.config.appRootPath ?? '').trim();
      if (configuredPath) {
        return configuredPath;
      }
    }
    const legacyPath = resolveConfiguredEnvPath(this.config.appRootPath);
    if (legacyPath) {
      return legacyPath;
    }
    return this.kind === 'local' ? this.sourcePath : resolveEnvRelativePath('.');
  }

  get appPath() {
    if (this.kind === 'ssh') {
      const configuredPath = String(this.config.appPath ?? inferConfiguredAppPathFromLegacyConfig(this.config) ?? '').trim();
      if (configuredPath) {
        return configuredPath;
      }
    }
    return resolveConfiguredAppPath(this.config) ?? resolveEnvRelativePath('.');
  }

  get sourcePath() {
    if (this.kind === 'ssh') {
      const configuredPath = String(this.config.appRootPath ?? '').trim();
      if (configuredPath) {
        return configuredPath;
      }
    }
    return resolveConfiguredSourcePath(this.config) ?? path.join(this.appPath, 'source');
  }

  get storagePath() {
    if (this.kind === 'ssh') {
      const configuredPath = String(this.config.storagePath ?? '').trim();
      if (configuredPath) {
        return configuredPath;
      }
    }
    const resolvedStoragePath = resolveConfiguredStoragePath(this.config);
    if (resolvedStoragePath) {
      return resolvedStoragePath;
    }
    return this.kind === 'local' || this.kind === 'docker'
      ? path.join(this.appPath, 'storage')
      : resolveEnvRelativePath('.');
  }

  get appPort() {
    return this.config.appPort;
  }

  get envVars(): Record<string, string> {
    const out: Record<string, string> = {
      STORAGE_PATH: this.storagePath,
    };
    const put = (key: string, value: string | number | boolean | undefined | null) => {
      if (value === undefined || value === null) {
        return;
      }
      out[key] = String(value);
    };
    put('APP_PORT', this.appPort);
    put('APP_PUBLIC_PATH', this.config.appPublicPath ? resolveAppPublicPath(this.config.appPublicPath) : undefined);
    put('CDN_BASE_URL', this.config.cdnBaseUrl);
    put('APP_KEY', this.config.appKey);
    put('TZ', this.config.timezone);
    put('DB_DIALECT', this.config.dbDialect);
    if (!this.config.builtinDb) {
      put('DB_HOST', this.config.dbHost);
      put('DB_PORT', this.config.dbPort);
    } else if (String(this.config.source ?? '').trim() !== 'docker') {
      put('DB_PORT', this.config.dbPort);
    }
    put('DB_DATABASE', this.config.dbDatabase);
    put('DB_USER', this.config.dbUser);
    put('DB_PASSWORD', this.config.dbPassword);
    put('DB_SCHEMA', this.config.dbSchema);
    put('DB_TABLE_PREFIX', this.config.dbTablePrefix);
    put('DB_UNDERSCORED', this.config.dbUnderscored);
    return out;
  }
}

export async function getEnv(envName?: string, options: GetEnvOptions = {}): Promise<Env | undefined> {
  const { config: snapshot, ...loadOptions } = options;
  const config = snapshot ?? (await loadAuthConfig(loadOptions));
  const resolved =
    envName?.trim() ||
    (await resolveEffectiveCurrentEnv(Object.keys(config.envs).sort(), {
      scope: loadOptions.scope,
      lastEnv: config.lastEnv,
    }));
  const envConfig = config.envs[resolved];
  if (!envConfig) {
    return undefined;
  }
  return new Env({ ...(normalizeEnvConfigEntry(envConfig) ?? {}), name: resolved });
}

function areAuthConfigsEquivalent(left?: EnvConfigEntry['auth'], right?: EnvConfigEntry['auth']) {
  if (!left && !right) {
    return true;
  }

  if (!left || !right || left.type !== right.type) {
    return false;
  }

  if (left.type === 'token' && right.type === 'token') {
    return left.accessToken === right.accessToken;
  }

  if (left.type === 'oauth' && right.type === 'oauth') {
    return (
      left.accessToken === right.accessToken &&
      left.refreshToken === right.refreshToken &&
      left.expiresAt === right.expiresAt &&
      left.scope === right.scope &&
      left.issuer === right.issuer &&
      left.clientId === right.clientId &&
      left.resource === right.resource
    );
  }

  return false;
}

async function writeEnv(
  envName: string,
  updater: (previous: EnvConfigEntry | undefined) => EnvConfigEntry,
  options: AuthStoreOptions = {},
) {
  const config = await loadExactAuthConfig(options);
  const previous = config.envs[envName];
  const next = updater(previous);
  config.envs[envName] = {
    ...next,
    schemaVersion:
      normalizeEnvConfigSchemaVersion(next.schemaVersion) ??
      normalizeEnvConfigSchemaVersion(previous?.schemaVersion) ??
      ENV_CONFIG_SCHEMA_VERSION,
  };
  await saveAuthConfig(config, options);
}

function normalizeConfiguredAuthType(value: unknown): EnvConfigEntry['authType'] {
  return value === 'basic' || value === 'token' || value === 'oauth' ? value : undefined;
}

export function resolveConfiguredAuthType(
  config?: Pick<EnvConfigEntry, 'authType' | 'auth'>,
): EnvConfigEntry['authType'] {
  return normalizeConfiguredAuthType(config?.authType) ?? normalizeConfiguredAuthType(config?.auth?.type);
}

type UpsertEnvConfig = Record<string, unknown> & {
  apiBaseUrl?: unknown;
  baseUrl?: unknown;
  apibaseUrl?: unknown;
  accessToken?: unknown;
  authType?: unknown;
  authUsername?: unknown;
  schemaVersion?: unknown;
};

export async function upsertEnv(envName: string, config: UpsertEnvConfig, options: AuthStoreOptions = {}) {
  await writeEnv(
    envName,
    (previous) => {
      const {
        apiBaseUrl: _apiBaseUrl,
        baseUrl: _baseUrl,
        apibaseUrl: _legacyApiBaseUrl,
        accessToken,
        authType,
        authUsername,
        schemaVersion,
        ...rest
      } = config;
      const nextApiBaseUrl = readEnvApiBaseUrl(config as Partial<EnvConfigEntry>);
      const previousApiBaseUrl = readEnvApiBaseUrl(previous);
      const baseUrlChanged = previousApiBaseUrl !== nextApiBaseUrl;
      const previousAuthType = resolveConfiguredAuthType(previous);
      const requestedAuthType = normalizeConfiguredAuthType(authType);
      const nextAccessToken = normalizeOptionalString(accessToken);
      const nextAuthType = requestedAuthType ?? (nextAccessToken ? 'token' : previousAuthType);
      const nextAuthUsername =
        nextAuthType === 'basic' ? normalizeOptionalString(authUsername) ?? previous?.authUsername : undefined;
      const nextAuth = nextAccessToken
        ? ({
            type: 'token',
            accessToken: nextAccessToken,
          } satisfies TokenAuthConfig)
        : nextAuthType === 'oauth' && !baseUrlChanged && previous?.auth?.type === 'oauth'
          ? previous.auth
          : undefined;
      const authChanged = !areAuthConfigsEquivalent(previous?.auth, nextAuth);
      const authTypeChanged = previousAuthType !== nextAuthType;
      const authUsernameChanged = previous?.authUsername !== nextAuthUsername;
      const nextSchemaVersion =
        normalizeEnvConfigSchemaVersion(schemaVersion) ??
        normalizeEnvConfigSchemaVersion(previous?.schemaVersion) ??
        ENV_CONFIG_SCHEMA_VERSION;

      return {
        ...previous,
        apiBaseUrl: nextApiBaseUrl,
        authType: nextAuthType,
        authUsername: nextAuthUsername,
        auth: nextAuth,
        ...(rest as Partial<EnvConfigEntry>),
        schemaVersion: nextSchemaVersion,
        runtime:
          baseUrlChanged || authChanged || authTypeChanged || authUsernameChanged ? undefined : previous?.runtime,
      };
    },
    options,
  );
}

export async function updateEnvConnection(
  envName: string,
  updates: {
    apiBaseUrl?: string;
    baseUrl?: string;
    authType?: EnvConfigEntry['authType'];
    authUsername?: string;
    accessToken?: string;
  },
  options: AuthStoreOptions = {},
) {
  await writeEnv(
    envName,
    (previous) => {
      const nextApiBaseUrl = readEnvApiBaseUrl(updates) ?? readEnvApiBaseUrl(previous);
      const previousApiBaseUrl = readEnvApiBaseUrl(previous);
      const baseUrlChanged = previousApiBaseUrl !== nextApiBaseUrl;
      const previousAuthType = resolveConfiguredAuthType(previous);
      const requestedAuthType = normalizeConfiguredAuthType(updates.authType);
      const nextAuthType = requestedAuthType ?? (updates.accessToken ? 'token' : previousAuthType);
      const nextAuthUsername =
        nextAuthType === 'basic' ? normalizeOptionalString(updates.authUsername) ?? previous?.authUsername : undefined;
      const nextAuth = updates.accessToken
        ? ({
            type: 'token',
            accessToken: updates.accessToken,
          } satisfies TokenAuthConfig)
        : nextAuthType === 'oauth' && !baseUrlChanged && previous?.auth?.type === 'oauth'
          ? previous.auth
          : undefined;
      const authChanged = !areAuthConfigsEquivalent(previous?.auth, nextAuth);
      const authTypeChanged = previousAuthType !== nextAuthType;
      const authUsernameChanged = previous?.authUsername !== nextAuthUsername;

      return {
        ...previous,
        ...(nextApiBaseUrl !== undefined ? { apiBaseUrl: nextApiBaseUrl } : {}),
        authType: nextAuthType,
        authUsername: nextAuthUsername,
        auth: nextAuth,
        runtime:
          baseUrlChanged || authChanged || authTypeChanged || authUsernameChanged ? undefined : previous?.runtime,
      };
    },
    options,
  );
}

export async function replaceEnvConfig(
  envName: string,
  config: Record<string, any>,
  options: AuthStoreOptions = {},
) {
  await writeEnv(
    envName,
    (previous) => {
      if (!previous) {
        throw new Error(`Env "${envName}" is not configured`);
      }

      const {
        apiBaseUrl: _apiBaseUrl,
        baseUrl: _baseUrl,
        apibaseUrl: _legacyApiBaseUrl,
        accessToken,
        authType,
        authUsername,
        ...rest
      } = config;
      const nextApiBaseUrl = readEnvApiBaseUrl(config);
      const previousApiBaseUrl = readEnvApiBaseUrl(previous);
      const baseUrlChanged = previousApiBaseUrl !== nextApiBaseUrl;
      const previousAuthType = resolveConfiguredAuthType(previous);
      const nextAuthType = normalizeConfiguredAuthType(authType) ?? (accessToken ? 'token' : undefined);
      const nextAuthUsername = nextAuthType === 'basic' ? normalizeOptionalString(authUsername) : undefined;
      const nextAuth = accessToken
        ? ({
            type: 'token',
            accessToken,
          } satisfies TokenAuthConfig)
        : nextAuthType === 'oauth' && !baseUrlChanged && previous?.auth?.type === 'oauth'
          ? previous.auth
          : undefined;
      const authChanged = !areAuthConfigsEquivalent(previous?.auth, nextAuth);
      const authTypeChanged = previousAuthType !== nextAuthType;
      const authUsernameChanged = previous?.authUsername !== nextAuthUsername;

      return {
        ...rest,
        ...(nextApiBaseUrl !== undefined ? { apiBaseUrl: nextApiBaseUrl } : {}),
        ...(nextAuthType ? { authType: nextAuthType } : {}),
        ...(nextAuthUsername ? { authUsername: nextAuthUsername } : {}),
        ...(nextAuth ? { auth: nextAuth } : {}),
        runtime:
          baseUrlChanged || authChanged || authTypeChanged || authUsernameChanged ? undefined : previous?.runtime,
      };
    },
    options,
  );
}

export async function setEnvOauthSession(
  envName: string,
  auth: OauthAuthConfig,
  options: AuthStoreOptions & { preserveRuntime?: boolean } = {},
) {
  await writeEnv(
    envName,
    (previous) => ({
      ...previous,
      authType: 'oauth',
      auth,
      runtime: options.preserveRuntime ? previous?.runtime : undefined,
    }),
    options,
  );
}

export async function setEnvRuntime(
  envName: string,
  runtime: EnvConfigEntry['runtime'],
  options: AuthStoreOptions = {},
) {
  const config = await loadExactAuthConfig(options);
  const current = config.envs[envName] ?? {};
  config.envs[envName] = {
    ...current,
    runtime,
  };
  await saveAuthConfig(config, options);
}

export async function clearEnvRootSetup(
  envName: string,
  options: AuthStoreOptions = {},
): Promise<boolean> {
  const config = await loadExactAuthConfig(options);
  const current = config.envs[envName];
  if (!current) {
    return false;
  }

  const {
    rootUsername: _rootUsername,
    rootEmail: _rootEmail,
    rootPassword: _rootPassword,
    rootNickname: _rootNickname,
    ...rest
  } = current;

  config.envs[envName] = rest;
  await saveAuthConfig(config, options);
  return true;
}

export async function removeEnv(envName: string, options: AuthStoreOptions = {}) {
  const config = await loadExactAuthConfig(options);

  if (!config.envs[envName]) {
    throw new Error(`Env "${envName}" is not configured`);
  }

  delete config.envs[envName];

  if (config.lastEnv === envName) {
    const nextEnv = Object.keys(config.envs).sort()[0];
    config.lastEnv = nextEnv ?? 'default';
  }

  await saveAuthConfig(config, options);
  const remainingEnvNames = Object.keys(config.envs).sort();
  const fallbackEnv = remainingEnvNames.length
    ? await resolveEffectiveCurrentEnv(remainingEnvNames, {
        scope: options.scope,
        lastEnv: config.lastEnv,
      })
    : undefined;

  await cleanupCurrentSessionAfterEnvRemoval(envName, {
    scope: options.scope,
    fallbackEnv,
  });

  return {
    removed: envName,
    lastEnv: config.lastEnv || 'default',
    hasEnvs: Object.keys(config.envs).length > 0,
  };
}
