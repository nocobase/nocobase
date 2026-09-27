import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import type { Layout } from './layout.ts';

export interface AppEnvOptions {
  origin: string;
  host: string;
  port: number;
  /** The base path the release's client was compiled for. */
  basePath: string;
}

/**
 * Builds `app.env`, the one set of runtime variables both the application and the installer's own CLI calls read.
 * `launcher.mjs` reads it on every start, so an edit takes effect with `pm2 restart`.
 *
 * `APP_CONFIG_FILE` and `APP_STORAGE_DIR` are absolute on purpose. A built server treats the directory above `dist/` as
 * its deployment root and keeps `config.yml` and `storage/` there by default, which here is the release directory an
 * upgrade replaces. `dist/.env` carries neither variable, so leaving one out silently moves the application's data into
 * the release.
 */
export function buildAppEnv(layout: Layout, options: AppEnvOptions): string {
  const entries: [string, string][] = [
    ['NODE_ENV', 'production'],
    ['APP_BASE_PATH', options.basePath],
    ['APP_CONFIG_FILE', layout.configFile],
    ['APP_STORAGE_DIR', layout.storageDir],
    ['APP_PUBLIC_ORIGIN', options.origin],
    ['APP_SERVER_HOST', options.host],
    ['APP_SERVER_PORT', String(options.port)],
    // A failed start exits non-zero, so pm2 restarts it and the installer sees the failure.
    ['NOCOBASE_STRICT_STARTUP', 'true'],
  ];
  return [
    '# Written by app-installer. Read by launcher.mjs on every start and by every app-installer command.',
    ...entries.map(([key, value]) => `${key}=${quote(value)}`),
    '',
  ].join('\n');
}

function quote(value: string): string {
  return /^[\w@%+=:,./-]*$/u.test(value) ? value : JSON.stringify(value);
}

export async function readAppEnv(
  layout: Layout,
): Promise<Record<string, string>> {
  return parseEnv(await readFile(layout.appEnv, 'utf8')) as Record<
    string,
    string
  >;
}

export interface AppEndpoints {
  /** Where people open the application: the public origin followed by its base path. */
  url: string;
  /** `APP_PUBLIC_ORIGIN`, which the application builds its links from, without a trailing slash. */
  origin: string;
  /** `APP_SERVER_HOST` and `APP_SERVER_PORT`, where the application listens and a reverse proxy forwards to. */
  host: string;
  /** `null` when `APP_SERVER_PORT` is not a port number, which the application cannot listen on either. */
  port: number | null;
}

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = '13000';
const DEFAULT_BASE_PATH = '/main';

function parsePort(value: string): number | null {
  const port = Number(value.trim());
  return value.trim() !== '' &&
    Number.isInteger(port) &&
    port >= 1 &&
    port <= 65535
    ? port
    : null;
}

/** The base path as a URL prefix: `/crm` stays, and the root `/` contributes nothing. */
function basePrefix(env: Record<string, string>): string {
  const trimmed = (env.APP_BASE_PATH ?? DEFAULT_BASE_PATH)
    .trim()
    .replace(/^\/+|\/+$/gu, '');
  return trimmed ? `/${trimmed}` : '';
}

/**
 * Where the application is reached and where it listens, as `app.env` says. The file is edited by hand to change
 * either, so a trailing slash on the origin is dropped, as `install` drops it from `--origin`, and a port that is not
 * one reads as `null` rather than as a number the application is not using.
 */
export function endpointsOf(env: Record<string, string>): AppEndpoints {
  const host = env.APP_SERVER_HOST ?? DEFAULT_HOST;
  const rawPort = env.APP_SERVER_PORT ?? DEFAULT_PORT;
  const origin = (env.APP_PUBLIC_ORIGIN ?? `http://${host}:${rawPort}`).replace(
    /\/+$/u,
    '',
  );
  return {
    url: `${origin}${basePrefix(env)}/`,
    origin,
    host,
    port: parsePort(rawPort),
  };
}

/** The address the installer checks health on: the listening address, with a wildcard bind reached through loopback. */
export function healthUrl(env: Record<string, string>): string {
  const { host, port } = endpointsOf(env);
  const reachable =
    host === '0.0.0.0' || host === '::' || host === '' ? '127.0.0.1' : host;
  const hostPart = reachable.includes(':') ? `[${reachable}]` : reachable;
  return `http://${hostPart}:${port ?? env.APP_SERVER_PORT}${basePrefix(env)}/api/healthz`;
}
