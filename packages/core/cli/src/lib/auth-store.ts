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
import {
  NB_CLI_ROOT_ENV,
  resolveCliHomeDir,
  resolveConfiguredEnvPath,
  resolveDefaultConfigScope,
  resolveEnvRelativePath,
} from './cli-home.js';

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
  kind?: EnvKind;
  apiBaseUrl?: string;
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
  appRootPath?: string;
  storagePath?: string;
  /** Application HTTP port (APP_PORT). */
  appPort?: number | string;
  /** Application secret key (APP_KEY). */
  appKey?: string;
  /** Application timezone (TZ). */
  timezone?: string;
  /** Initial root/admin user settings saved for install resume flows. */
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
  currentEnv?: string;
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

export function readEnvApiBaseUrl(config?: Partial<EnvConfigEntry>): string | undefined {
  if (!config) {
    return undefined;
  }

  return (
    normalizeOptionalString((config as { apiBaseUrl?: unknown }).apiBaseUrl)
    ?? normalizeOptionalString((config as { baseUrl?: unknown }).baseUrl)
    ?? normalizeOptionalString((config as { apibaseUrl?: unknown }).apibaseUrl)
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

  if (String(config.appRootPath ?? '').trim()) {
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
    ...rest
  } = entry as EnvConfigEntry & { kind?: unknown };
  const normalizedKind = resolveEnvKind(entry);
  const apiBaseUrl = readEnvApiBaseUrl(entry);
  return {
    ...rest,
    ...(normalizedKind ? { kind: normalizedKind } : {}),
    ...(apiBaseUrl !== undefined ? { apiBaseUrl } : {}),
  };
}

function normalizeAuthConfig(config: AuthConfig & { dockerResourcePrefix?: string }): AuthConfig {
  return {
    name: config.name || config.dockerResourcePrefix,
    currentEnv: config.currentEnv || 'default',
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
    currentEnv: 'default',
    envs: {},
  };
}

function hasConfiguredEnvs(config: AuthConfig) {
  return Object.keys(config.envs).length > 0;
}

function shouldFallbackToLegacyProjectScope(options: AuthStoreOptions = {}) {
  const requestedScope = options.scope ?? resolveDefaultConfigScope();
  if (requestedScope !== 'global') {
    return false;
  }

  return !process.env[NB_CLI_ROOT_ENV];
}

async function loadExactAuthConfig(options: AuthStoreOptions = {}): Promise<AuthConfig> {
  try {
    const content = await fs.readFile(getConfigFile(options), 'utf8');
    const parsed = JSON.parse(content) as AuthConfig & {
      dockerResourcePrefix?: string;
    };
    return normalizeAuthConfig(parsed);
  } catch (_error) {
    return createDefaultConfig();
  }
}

async function resolveEnvStorageScope(
  envName: string,
  options: AuthStoreOptions = {},
): Promise<AuthStoreOptions> {
  const requestedScope = options.scope ?? resolveDefaultConfigScope();
  if (requestedScope !== 'global') {
    return { ...options, scope: requestedScope };
  }

  const globalConfig = await loadExactAuthConfig({ scope: 'global' });
  if (globalConfig.envs[envName]) {
    return { ...options, scope: 'global' };
  }

  const projectConfig = await loadExactAuthConfig({ scope: 'project' });
  if (projectConfig.envs[envName]) {
    return { ...options, scope: 'project' };
  }

  return { ...options, scope: 'global' };
}

export async function loadAuthConfig(options: AuthStoreOptions = {}): Promise<AuthConfig> {
  const config = await loadExactAuthConfig(options);
  if (!shouldFallbackToLegacyProjectScope(options) || hasConfiguredEnvs(config)) {
    return config;
  }

  const legacyProjectConfig = await loadExactAuthConfig({ scope: 'project' });
  return hasConfiguredEnvs(legacyProjectConfig) ? legacyProjectConfig : config;
}

export async function saveAuthConfig(config: AuthConfig, options: AuthStoreOptions = {}) {
  const filePath = getConfigFile(options);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(normalizeAuthConfig(config), null, 2));
}

export async function listEnvs(options: AuthStoreOptions = {}) {
  const config = await loadAuthConfig(options);
  return {
    currentEnv: config.currentEnv || 'default',
    envs: config.envs,
  };
}

export async function getCurrentEnvName(options: AuthStoreOptions = {}) {
  const config = await loadAuthConfig(options);
  return config.currentEnv || 'default';
}

export async function setCurrentEnv(envName: string, options: AuthStoreOptions = {}) {
  const writeOptions = await resolveEnvStorageScope(envName, options);
  const config = await loadExactAuthConfig(writeOptions);
  if (!config.envs[envName]) {
    throw new Error(`Env "${envName}" is not configured`);
  }
  config.currentEnv = envName;
  await saveAuthConfig(config, writeOptions);
}

export async function ensureWorkspaceName(
  defaultName: string,
  options: AuthStoreOptions = {},
): Promise<string> {
  const config = await loadExactAuthConfig(options);
  const existing = config.name?.trim();
  if (existing) {
    return existing;
  }

  const next = defaultName.trim();
  config.name = next;
  await saveAuthConfig(config, options);
  return next;
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
    return resolveConfiguredEnvPath(this.config.appRootPath) ?? resolveEnvRelativePath('.');
  }

  get storagePath() {
    if (this.kind === 'ssh') {
      const configuredPath = String(this.config.storagePath ?? '').trim();
      if (configuredPath) {
        return configuredPath;
      }
    }
    return resolveConfiguredEnvPath(this.config.storagePath) ?? resolveEnvRelativePath('.');
  }

  get appPort() {
    return this.config.appPort;
  }

  get envVars(): Record<string, string> {
    const out: Record<string, string> = {
      STORAGE_PATH: this.storagePath,
    };
    const put = (key: string, value: string | number | undefined | null) => {
      if (value === undefined || value === null) {
        return;
      }
      out[key] = String(value);
    };
    put('APP_PORT', this.appPort);
    put('APP_KEY', this.config.appKey);
    put('TZ', this.config.timezone);
    put('DB_DIALECT', this.config.dbDialect);
    put('DB_HOST', this.config.dbHost);
    put('DB_PORT', this.config.dbPort);
    put('DB_DATABASE', this.config.dbDatabase);
    put('DB_USER', this.config.dbUser);
    put('DB_PASSWORD', this.config.dbPassword);
    return out;
  }
}

export async function getEnv(envName?: string, options: GetEnvOptions = {}): Promise<Env | undefined> {
  const { config: snapshot, ...loadOptions } = options;
  const config = snapshot ?? (await loadAuthConfig(loadOptions));
  const resolved = envName?.trim() || config.currentEnv || 'default';
  const envConfig = config.envs[resolved];
  if (!envConfig) {
    if (!shouldFallbackToLegacyProjectScope(loadOptions)) {
      return undefined;
    }

    const legacyProjectConfig = await loadExactAuthConfig({ scope: 'project' });
    const legacyResolved = envName?.trim() || legacyProjectConfig.currentEnv || 'default';
    const legacyEnvConfig = legacyProjectConfig.envs[legacyResolved];
    if (!legacyEnvConfig) {
      return undefined;
    }

    return new Env({ ...(normalizeEnvConfigEntry(legacyEnvConfig) ?? {}), name: legacyResolved });
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
  const writeOptions = await resolveEnvStorageScope(envName, options);
  const config = await loadExactAuthConfig(writeOptions);
  const previous = config.envs[envName];
  config.envs[envName] = updater(previous);
  config.currentEnv = envName;
  await saveAuthConfig(config, writeOptions);
}

export async function upsertEnv(
  envName: string,
  config: Record<string, any>,
  options: AuthStoreOptions = {},
) {
  await writeEnv(
    envName,
    (previous) => {
      const { apiBaseUrl: _apiBaseUrl, baseUrl: _baseUrl, apibaseUrl: _legacyApiBaseUrl, accessToken, ...rest } = config;
      const nextApiBaseUrl = readEnvApiBaseUrl(config);
      const previousApiBaseUrl = readEnvApiBaseUrl(previous);
      const baseUrlChanged = previousApiBaseUrl !== nextApiBaseUrl;
      const nextAuth = accessToken
        ? ({
            type: 'token',
            accessToken,
          } satisfies TokenAuthConfig)
        : baseUrlChanged || previous?.auth?.type === 'token'
          ? undefined
          : previous?.auth;
      const authChanged = !areAuthConfigsEquivalent(previous?.auth, nextAuth);

      return {
        ...previous,
        apiBaseUrl: nextApiBaseUrl,
        auth: nextAuth,
        ...rest,
        runtime: baseUrlChanged || authChanged ? undefined : previous?.runtime,
      };
    },
    options,
  );
}

export async function updateEnvConnection(
  envName: string,
  updates: { apiBaseUrl?: string; baseUrl?: string; accessToken?: string },
  options: AuthStoreOptions = {},
) {
  await writeEnv(
    envName,
    (previous) => {
      const nextApiBaseUrl = readEnvApiBaseUrl(updates) ?? readEnvApiBaseUrl(previous);
      const previousApiBaseUrl = readEnvApiBaseUrl(previous);
      const baseUrlChanged = previousApiBaseUrl !== nextApiBaseUrl;
      const nextAuth = updates.accessToken
        ? ({
            type: 'token',
            accessToken: updates.accessToken,
          } satisfies TokenAuthConfig)
        : baseUrlChanged || previous?.auth?.type === 'token'
          ? undefined
          : previous?.auth;
      const authChanged = !areAuthConfigsEquivalent(previous?.auth, nextAuth);

      return {
        ...previous,
        ...(nextApiBaseUrl !== undefined ? { apiBaseUrl: nextApiBaseUrl } : {}),
        auth: nextAuth,
        runtime: baseUrlChanged || authChanged ? undefined : previous?.runtime,
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
  const writeOptions = await resolveEnvStorageScope(envName, options);
  const config = await loadExactAuthConfig(writeOptions);
  const current = config.envs[envName] ?? {};
  config.envs[envName] = {
    ...current,
    runtime,
  };
  config.currentEnv = envName;
  await saveAuthConfig(config, writeOptions);
}

export async function removeEnv(envName: string, options: AuthStoreOptions = {}) {
  const writeOptions = await resolveEnvStorageScope(envName, options);
  const config = await loadExactAuthConfig(writeOptions);

  if (!config.envs[envName]) {
    throw new Error(`Env "${envName}" is not configured`);
  }

  delete config.envs[envName];

  if (config.currentEnv === envName) {
    const nextEnv = Object.keys(config.envs).sort()[0];
    config.currentEnv = nextEnv ?? 'default';
  }

  await saveAuthConfig(config, writeOptions);

  return {
    removed: envName,
    currentEnv: config.currentEnv || 'default',
    hasEnvs: Object.keys(config.envs).length > 0,
  };
}
