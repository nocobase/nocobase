// What the runner stores about itself and the applications it serves.
//
// One machine runs one runner, which may be registered with several applications. Each registration is two files: the
// registration (`apps/<key>.json`: server, runner id, local variables and CLI overrides) and its runner key
// (`credentials/<key>.json`, 0600 in a 0700 directory). Both live in the runner's own directory, never under a work
// directory, and nothing from them reaches an agent's environment.
import { chmod, mkdir, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { HEADERS, PROTOCOL_VERSION, type RunApp } from '../protocol/index.ts';
import { ApiClient } from './http.ts';
import {
  ensureHome,
  readJson,
  runnerPaths,
  safeName,
  writeJsonAtomic,
  type RunnerPaths,
} from './home.ts';

/** How an agent's tool gets a home directory: an isolated one per workspace, or the runner user's own. */
export type AgentHome = 'isolated' | 'real';

export interface RunnerSettings {
  /** Shown in every application; the host name by default. */
  name: string;
  /** Runs at once across every application; `start --slots` overrides it. */
  slots: number;
  agentHome: AgentHome;
  /**
   * Whether a runner installed by the install script updates itself between runs when an application serves a newer
   * version (`nocobase-runner update --auto off` turns it off).
   */
  autoUpdate: boolean;
  /** The label of the service `service install` set up, so `uninstall` finds it. */
  serviceLabel?: string;
}

export interface AppRegistration {
  /** The file name: the application's id, or its address when it sent none. */
  key: string;
  app: RunApp;
  server: string;
  runnerId: string;
  heartbeatIntervalMs: number;
  pollTimeoutMs: number;
  /** Local values for the variable names a run asks the runner for (`workspace.passthrough`). */
  variables: Record<string, string>;
  /** Where an application CLI lives on this machine, by command name; wins over what a run says. */
  cli: Record<string, string>;
  registeredAt: string;
}

export interface AppConnection {
  registration: AppRegistration;
  runnerKey: string;
}

export function defaultRunnerName(): string {
  return os.hostname().replace(/\.local$/, '');
}

export async function readSettings(
  paths: RunnerPaths = runnerPaths(),
): Promise<RunnerSettings> {
  const stored = await readJson<Partial<RunnerSettings>>(paths.settings);
  return {
    name: stored?.name ?? defaultRunnerName(),
    slots: stored?.slots ?? 1,
    agentHome: stored?.agentHome === 'real' ? 'real' : 'isolated',
    autoUpdate: stored?.autoUpdate !== false,
    ...(typeof stored?.serviceLabel === 'string' && stored.serviceLabel !== ''
      ? { serviceLabel: stored.serviceLabel }
      : {}),
  };
}

export async function writeSettings(
  settings: RunnerSettings,
  paths: RunnerPaths = runnerPaths(),
): Promise<void> {
  await ensureHome(paths);
  await writeJsonAtomic(paths.settings, settings);
}

/** The key a registration is stored under. */
export function appKey(server: string, app?: RunApp): string {
  if (app !== undefined && app.id !== '') return safeName(app.id);
  const url = new URL(server);
  return safeName(`${url.host}${url.pathname}`.replace(/\/+$/u, ''));
}

function registrationPath(paths: RunnerPaths, key: string): string {
  return path.join(paths.appsDir, `${safeName(key)}.json`);
}

export function credentialPath(paths: RunnerPaths, key: string): string {
  return path.join(paths.credentialsDir, `${safeName(key)}.json`);
}

export async function writeConnection(
  connection: AppConnection,
  paths: RunnerPaths = runnerPaths(),
): Promise<void> {
  await ensureHome(paths);
  await mkdir(paths.credentialsDir, { recursive: true, mode: 0o700 });
  await chmod(paths.credentialsDir, 0o700);
  const { key } = connection.registration;
  await writeJsonAtomic(
    credentialPath(paths, key),
    { runnerKey: connection.runnerKey },
    0o600,
  );
  await writeJsonAtomic(
    registrationPath(paths, key),
    connection.registration,
    0o600,
  );
}

export async function readConnection(
  key: string,
  paths: RunnerPaths = runnerPaths(),
): Promise<AppConnection | undefined> {
  const registration = await readJson<AppRegistration>(
    registrationPath(paths, key),
  );
  const credential = await readJson<{ runnerKey: string }>(
    credentialPath(paths, key),
  );
  if (registration === undefined || credential === undefined) return undefined;
  return {
    registration: {
      ...registration,
      variables: registration.variables ?? {},
      cli: registration.cli ?? {},
    },
    runnerKey: credential.runnerKey,
  };
}

/** Every registration with its key, in a stable order. */
export async function readConnections(
  paths: RunnerPaths = runnerPaths(),
): Promise<AppConnection[]> {
  const entries = await readdir(paths.appsDir).catch(() => [] as string[]);
  const connections: AppConnection[] = [];
  for (const entry of entries.sort()) {
    if (!entry.endsWith('.json')) continue;
    const connection = await readConnection(entry.slice(0, -5), paths);
    if (connection !== undefined) connections.push(connection);
  }
  return connections;
}

export async function removeConnection(
  key: string,
  paths: RunnerPaths = runnerPaths(),
): Promise<void> {
  await rm(registrationPath(paths, key), { force: true });
  await rm(credentialPath(paths, key), { force: true });
}

export function runnerClient(connection: AppConnection): ApiClient {
  return new ApiClient({
    server: connection.registration.server,
    // The protocol on every request, so the server can tell this runner needs an upgrade (and when it no longer does).
    headers: {
      [HEADERS.runnerKey]: connection.runnerKey,
      [HEADERS.protocol]: String(PROTOCOL_VERSION),
    },
  });
}

/** Accepts `https://host/path` and `host:port`; drops a trailing slash. */
export function normalizeServer(server: string): string {
  const withScheme = /^https?:\/\//.test(server) ? server : `http://${server}`;
  const url = new URL(withScheme);
  return url.href.replace(/\/+$/, '');
}
