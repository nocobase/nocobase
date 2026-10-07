/**
 * How the Docker backend runs Apps. An environment (`HostScope.backendConfig`) has no settings of its own: every
 * container runs with the built-in defaults below, and the Engine is the local one, found the way the `docker` CLI
 * finds it (`DOCKER_HOST`, else the current Docker context, else the default socket). The scope's credentials
 * (`HostScope.secret`) are the registry's pull credentials, which release management sets.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** How the backend reaches the Docker Engine API: its socket, or a socket proxy on plain TCP (`tcp://`). */
export type DockerEndpoint =
  | { readonly kind: 'socket'; readonly socketPath: string }
  | { readonly kind: 'tcp'; readonly host: string; readonly port: number };

/** How containers are run: built in, not configurable per environment. */
export interface DockerSettings {
  /** Prefixes every container, image, volume and network the backend creates. */
  readonly namePrefix: string;
  readonly image: {
    /** The platform whose release image runs here, such as `linux/amd64`; the daemon's own when null. */
    readonly platform: string | null;
    /** Images kept per App, current one included; older release images are removed after a deployment. */
    readonly keep: number;
  };
  /** The port the App listens on inside its container (`APP_SERVER_PORT`). */
  readonly containerPort: number;
  /** Where the App's persistent volume is mounted; the release runtime keeps its storage there. */
  readonly storagePath: string;
  /** Where file configuration is written inside the container (`APP_CONFIG_FILE`). */
  readonly configPath: string;
  readonly healthCheck: {
    /** Probed at `<base path><path>` inside the container. */
    readonly path: string;
    readonly timeoutSeconds: number;
    readonly intervalSeconds: number;
  };
  readonly stopTimeoutSeconds: number;
}

export const DOCKER_DEFAULT_SETTINGS: DockerSettings = {
  namePrefix: 'nb-',
  image: { platform: null, keep: 3 },
  containerPort: 13000,
  storagePath: '/app/storage',
  configPath: '/app/config.yml',
  healthCheck: {
    path: '/api/healthz',
    timeoutSeconds: 180,
    intervalSeconds: 30,
  },
  stopTimeoutSeconds: 30,
};

/** Credentials for a registry, as Docker's `X-Registry-Auth` carries them. */
export interface RegistryAuth {
  /** The registry host (`ghcr.io`, `localhost:5000`). */
  readonly serveraddress: string;
  readonly username?: string;
  readonly password?: string;
}

/** Write-only credentials. */
export interface DockerEnvironmentSecret {
  /** Pull credentials of the registry release images come from, set by release management. */
  readonly registryAuth?: RegistryAuth;
}

export const DOCKER_CONFIG_SCHEMA: Readonly<Record<string, unknown>> = {
  type: 'object',
  additionalProperties: false,
  properties: {},
};

export const DOCKER_SECRET_SCHEMA: Readonly<Record<string, unknown>> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    registryAuth: {
      type: 'object',
      additionalProperties: false,
      required: ['serveraddress'],
      properties: {
        serveraddress: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string' },
      },
    },
  },
};

export const DEFAULT_DOCKER_ENDPOINT = 'unix:///var/run/docker.sock';

export class DockerConfigError extends Error {
  public override readonly name: string = 'DockerConfigError';
}

/** Refuses stored environment settings: the Docker backend has none. */
export function assertNoDockerConfig(
  raw: Readonly<Record<string, unknown>>,
): void {
  const [key] = Object.keys(raw);
  if (key !== undefined) throw new DockerConfigError(`Unknown setting ${key}.`);
}

/**
 * The local Docker Engine's endpoint, as the `docker` CLI finds it: `DOCKER_HOST`, else the endpoint of the current
 * context (`DOCKER_CONTEXT`, else `currentContext` in `$DOCKER_CONFIG/config.json`), else the default socket.
 */
export function detectDockerEndpoint(
  env: Readonly<Record<string, string | undefined>>,
  homedir: string = os.homedir(),
): string {
  if (env.DOCKER_HOST?.trim()) return env.DOCKER_HOST.trim();
  const configDir = env.DOCKER_CONFIG?.trim() || path.join(homedir, '.docker');
  const readJson = (file: string): Record<string, unknown> | null => {
    try {
      return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    } catch {
      return null;
    }
  };
  const context =
    env.DOCKER_CONTEXT?.trim() ||
    readJson(path.join(configDir, 'config.json'))?.currentContext;
  if (typeof context !== 'string' || !context || context === 'default')
    return DEFAULT_DOCKER_ENDPOINT;
  const meta = readJson(
    path.join(
      configDir,
      'contexts',
      'meta',
      createHash('sha256').update(context).digest('hex'),
      'meta.json',
    ),
  ) as { Endpoints?: { docker?: { Host?: unknown } } } | null;
  const host = meta?.Endpoints?.docker?.Host;
  return typeof host === 'string' && host ? host : DEFAULT_DOCKER_ENDPOINT;
}

/** Parses a `unix://` socket (or a bare socket path), or a `tcp://` / `http://` socket proxy on this machine. */
export function parseEndpoint(value: string): DockerEndpoint {
  if (value.startsWith('/')) return { kind: 'socket', socketPath: value };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new DockerConfigError(`Docker endpoint "${value}" is not a URL.`);
  }
  switch (url.protocol) {
    case 'unix:':
      if (!url.pathname)
        throw new DockerConfigError('The Docker endpoint needs a socket path.');
      return { kind: 'socket', socketPath: decodeURIComponent(url.pathname) };
    case 'tcp:':
    case 'http:':
      if (!url.hostname)
        throw new DockerConfigError('The Docker endpoint needs a host.');
      return {
        kind: 'tcp',
        host: url.hostname,
        port: url.port ? Number(url.port) : 2375,
      };
    default:
      throw new DockerConfigError(
        `Docker endpoint ${value} is not supported: use the local Docker socket (unix://) or a socket proxy (tcp://).`,
      );
  }
}

/** Parses the stored credentials; unknown keys are refused so a misspelt key is noticed. */
export function parseDockerSecret(
  raw: Readonly<Record<string, unknown>> | null,
): DockerEnvironmentSecret {
  if (!raw) return {};
  for (const key of Object.keys(raw))
    if (key !== 'registryAuth')
      throw new DockerConfigError(`Unknown setting secret.${key}.`);
  const registry = raw.registryAuth;
  if (registry === undefined || registry === null) return {};
  if (typeof registry !== 'object' || Array.isArray(registry))
    throw new DockerConfigError('secret.registryAuth must be an object.');
  const entries = registry as Record<string, unknown>;
  for (const key of Object.keys(entries))
    if (!['serveraddress', 'username', 'password'].includes(key))
      throw new DockerConfigError(
        `Unknown setting secret.registryAuth.${key}.`,
      );
  const text = (key: string): string | undefined => {
    const value = entries[key];
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string')
      throw new DockerConfigError(
        `secret.registryAuth.${key} must be a string.`,
      );
    return value;
  };
  const serveraddress = text('serveraddress');
  if (!serveraddress)
    throw new DockerConfigError(
      'secret.registryAuth.serveraddress is required.',
    );
  const username = text('username');
  const password = text('password');
  return {
    registryAuth: {
      serveraddress,
      ...(username ? { username } : {}),
      ...(password ? { password } : {}),
    },
  };
}
