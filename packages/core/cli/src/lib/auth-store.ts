/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'node:fs';
import path, { isAbsolute } from 'node:path';
import type { CliHomeScope } from './cli-home.js';
import { resolveCliHomeDir, resolveDefaultConfigScope } from './cli-home.js';

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

export interface EnvConfigEntry {
  baseUrl?: string;
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
  return requestedScope === 'global';
}

async function loadExactAuthConfig(options: AuthStoreOptions = {}): Promise<AuthConfig> {
  try {
    const content = await fs.readFile(getConfigFile(options), 'utf8');
    const parsed = JSON.parse(content) as AuthConfig & {
      dockerResourcePrefix?: string;
    };
    return {
      name: parsed.name || parsed.dockerResourcePrefix,
      currentEnv: parsed.currentEnv || 'default',
      envs: parsed.envs || {},
    };
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
  await fs.writeFile(filePath, JSON.stringify(config, null, 2));
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
    return this.config.baseUrl;
  }

  get auth() {
    return this.config.auth;
  }

  get runtime() {
    return this.config.runtime;
  }

  get appRootPath() {
    const appRootPath = this.config.appRootPath;
    if (!appRootPath) {
      return process.cwd();
    }
    if (isAbsolute(appRootPath)) {
      return appRootPath;
    }
    return path.resolve(process.cwd(), appRootPath);
  }

  get storagePath() {
    const storagePath = this.config.storagePath;
    if (isAbsolute(storagePath)) {
      return storagePath;
    }
    return path.resolve(process.cwd(), storagePath);
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

    return new Env({ ...legacyEnvConfig, name: legacyResolved });
  }
  return new Env({ ...envConfig, name: resolved });
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
      const { baseUrl, accessToken, ...rest } = config;
      const baseUrlChanged = previous?.baseUrl !== baseUrl;
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
        baseUrl,
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
  updates: { baseUrl?: string; accessToken?: string },
  options: AuthStoreOptions = {},
) {
  await writeEnv(
    envName,
    (previous) => {
      const nextBaseUrl = updates.baseUrl ?? previous?.baseUrl;
      const baseUrlChanged = previous?.baseUrl !== nextBaseUrl;
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
        ...(nextBaseUrl !== undefined ? { baseUrl: nextBaseUrl } : {}),
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
