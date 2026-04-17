import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CliHomeScope } from './cli-home.js';
import { resolveCliHomeDir } from './cli-home.js';

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
  auth?: TokenAuthConfig | OauthAuthConfig;
  runtime?: {
    version?: string;
    schemaHash?: string;
    generatedAt?: string;
  };
}

export interface AuthConfig {
  currentEnv?: string;
  envs: Record<string, EnvConfigEntry>;
}

const DEFAULT_CONFIG: AuthConfig = {
  currentEnv: 'default',
  envs: {},
};

export interface AuthStoreOptions {
  scope?: CliHomeScope;
}

function getConfigFile(options: AuthStoreOptions = {}) {
  return path.join(resolveCliHomeDir(options.scope), 'config.json');
}

export async function loadAuthConfig(options: AuthStoreOptions = {}): Promise<AuthConfig> {
  try {
    const content = await fs.readFile(getConfigFile(options), 'utf8');
    const parsed = JSON.parse(content) as AuthConfig;
    return {
      currentEnv: parsed.currentEnv || 'default',
      envs: parsed.envs || {},
    };
  } catch (_error) {
    return DEFAULT_CONFIG;
  }
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
  const config = await loadAuthConfig(options);
  if (!config.envs[envName]) {
    throw new Error(`Env "${envName}" is not configured`);
  }
  config.currentEnv = envName;
  await saveAuthConfig(config, options);
}

export async function getEnv(envName?: string, options: AuthStoreOptions = {}) {
  const config = await loadAuthConfig(options);
  const resolved = envName || config.currentEnv || 'default';
  return config.envs[resolved];
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
  const config = await loadAuthConfig(options);
  const previous = config.envs[envName];
  config.envs[envName] = updater(previous);
  config.currentEnv = envName;
  await saveAuthConfig(config, options);
}

export async function upsertEnv(
  envName: string,
  baseUrl: string,
  accessToken?: string,
  options: AuthStoreOptions = {},
) {
  await writeEnv(
    envName,
    (previous) => {
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
  const config = await loadAuthConfig(options);
  const current = config.envs[envName] ?? {};
  config.envs[envName] = {
    ...current,
    runtime,
  };
  config.currentEnv = envName;
  await saveAuthConfig(config, options);
}

export async function removeEnv(envName: string, options: AuthStoreOptions = {}) {
  const config = await loadAuthConfig(options);

  if (!config.envs[envName]) {
    throw new Error(`Env "${envName}" is not configured`);
  }

  delete config.envs[envName];

  if (config.currentEnv === envName) {
    const nextEnv = Object.keys(config.envs).sort()[0];
    config.currentEnv = nextEnv ?? 'default';
  }

  await saveAuthConfig(config, options);

  return {
    removed: envName,
    currentEnv: config.currentEnv || 'default',
    hasEnvs: Object.keys(config.envs).length > 0,
  };
}
