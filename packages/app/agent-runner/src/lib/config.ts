// What the runner stores about itself and the applications it serves.
//
// One machine runs one runner, which may be registered with several applications. Each registration is two files: the
// registration (`apps/<key>.json`: server, runner id, local variables and CLI overrides) and its runner key
// (`credentials/<key>.json`, 0600 in a 0700 directory). Both live in the runner's own directory, never under a work
// directory, and nothing from them reaches an agent's environment.
import { chmod, mkdir, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  AGENT_TOOLS,
  HEADERS,
  MAX_MODEL_ID_LENGTH,
  PROTOCOL_VERSION,
  ToolSlotsSchema,
  type AgentTool,
  type RunApp,
  type ToolSlots,
} from '../protocol/index.ts';
import type { ModelListOverrides } from '../core/model-list.ts';
import { ENV_NAME_PATTERN, forbidden } from '../agent/env.ts';
import type { AgentTools } from '../agent/runner-tools.ts';
import { ApiClient } from './http.ts';
import {
  ensureHome,
  readJson,
  runnerPaths,
  safeName,
  writeJsonAtomic,
  type RunnerPaths,
} from './home.ts';
import { DEFAULT_MIN_FREE_DISK, type FreeSpace } from './size.ts';

export interface RunnerSettings {
  /** Shown in every application; the host name by default. */
  name: string;
  /** Runs at once across every application; `start --slots` overrides it. */
  slots: number;
  /**
   * Runs of each coding tool at once across every application, beside `slots` (`register --slots claude=2,codex=1`); a
   * tool left out is bounded by `slots` only.
   */
  toolSlots?: ToolSlots;
  /**
   * The Node.js and pnpm agents get (`config set agent-tools`): the runner's own, first on their PATH (`runner`, the
   * default), or the machine's (`system`).
   */
  agentTools: AgentTools;
  /**
   * Whether a runner installed by the install script updates itself between runs when an application serves a newer
   * version (`nocobase-runner update --auto off` turns it off).
   */
  autoUpdate: boolean;
  /** The label of the service `service install` set up, so `uninstall` finds it. */
  serviceLabel?: string;
  /**
   * Variable names always passed from the runner's environment to every run, and provided to a run that asks for them
   * (`--pass-env` on `start` and `service install`); absent for none.
   */
  passEnv?: string[];
  /**
   * How much of the disk holding the working directories to keep free (`register --min-free-disk 20G`,
   * `config set min-free-disk 10%`): below it, the runner warns what is left to remove (core/workspaces.ts). Absent for
   * `DEFAULT_MIN_FREE_DISK`, null when the owner turned it off.
   */
  minFreeDisk?: FreeSpace | null;
  /**
   * Model ids the owner adds to or removes from what each coding tool reports (`config models <tool> add|remove <id>`),
   * on top of the detected or built-in list; absent for none.
   */
  models?: ModelListOverrides;
  /**
   * How long a working directory stays unused before its regenerable build artifacts go (`config set artifact-ttl
   * 24h`), in milliseconds; absent for `DEFAULT_ARTIFACT_TTL_MS`, 0 when the owner turned it off.
   */
  artifactTtlMs?: number;
  /** The directory names removed as regenerable build artifacts (`config set artifact-patterns`); absent for the defaults. */
  artifactPatterns?: string[];
}

/** Twenty-four hours unused before a working directory's regenerable build artifacts go. */
export const DEFAULT_ARTIFACT_TTL_MS: number = 24 * 60 * 60 * 1000;
/** The directories removed as regenerable build artifacts, by name. */
export const DEFAULT_ARTIFACT_PATTERNS: readonly string[] = [
  'node_modules',
  '.next',
  '.turbo',
];
/** A directory name an artifact pattern may be: one path segment, not `.` or `..`. */
export const ARTIFACT_PATTERN: RegExp = /^(?!\.{1,2}$)[^/\\\0]{1,100}$/u;

/** How long a working directory stays unused before its artifacts go; 0 for never. */
export function artifactTtlMs(settings: RunnerSettings): number {
  return settings.artifactTtlMs ?? DEFAULT_ARTIFACT_TTL_MS;
}

/** The directory names removed as regenerable build artifacts. */
export function artifactPatterns(settings: RunnerSettings): readonly string[] {
  return settings.artifactPatterns ?? DEFAULT_ARTIFACT_PATTERNS;
}

function storedPatterns(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return [
    ...new Set(
      value.filter(
        (item): item is string =>
          typeof item === 'string' && ARTIFACT_PATTERN.test(item),
      ),
    ),
  ];
}

/** A model id as a runner reports it. */
export const MODEL_ID_PATTERN: RegExp = /^[a-zA-Z0-9][a-zA-Z0-9._:@/+-]*$/u;

function modelIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (id): id is string =>
          typeof id === 'string' &&
          id.length <= MAX_MODEL_ID_LENGTH &&
          MODEL_ID_PATTERN.test(id),
      ),
    ),
  ];
}

/** The stored model list changes: valid ids only, tools with nothing to change left out. */
export function modelListOverrides(value: unknown): ModelListOverrides {
  if (typeof value !== 'object' || value === null) return {};
  const result: Partial<
    Record<AgentTool, { add: string[]; remove: string[] }>
  > = {};
  for (const tool of AGENT_TOOLS) {
    const entry = (value as Record<string, unknown>)[tool];
    if (typeof entry !== 'object' || entry === null) continue;
    const add = modelIds((entry as { add?: unknown }).add);
    const remove = modelIds((entry as { remove?: unknown }).remove);
    if (add.length > 0 || remove.length > 0) result[tool] = { add, remove };
  }
  return result;
}

/** The free space the runner keeps on the disk holding the working directories; null for none. */
export function minFreeDisk(settings: RunnerSettings): FreeSpace | null {
  return settings.minFreeDisk === undefined
    ? DEFAULT_MIN_FREE_DISK
    : settings.minFreeDisk;
}

function storedFreeSpace(value: unknown): FreeSpace | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'object') return undefined;
  const { bytes, percent } = value as { bytes?: unknown; percent?: unknown };
  if (typeof bytes === 'number' && Number.isSafeInteger(bytes) && bytes > 0)
    return { bytes };
  if (typeof percent === 'number' && percent > 0 && percent < 100)
    return { percent };
  return undefined;
}

export type RevocationReason = 'RUNNER_REVOKED' | 'RUNNER_KEY_INVALID';

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
  revoked?: { at: string; reason: RevocationReason };
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
  const toolSlots = ToolSlotsSchema.safeParse(stored?.toolSlots);
  const minFree = storedFreeSpace(stored?.minFreeDisk);
  return {
    name: stored?.name ?? defaultRunnerName(),
    slots: stored?.slots ?? 1,
    ...(toolSlots.success &&
    toolSlots.data !== undefined &&
    Object.keys(toolSlots.data).length > 0
      ? { toolSlots: toolSlots.data }
      : {}),
    agentTools: stored?.agentTools === 'system' ? 'system' : 'runner',
    autoUpdate: stored?.autoUpdate !== false,
    ...(typeof stored?.serviceLabel === 'string' && stored.serviceLabel !== ''
      ? { serviceLabel: stored.serviceLabel }
      : {}),
    ...(passEnvNames(stored?.passEnv).length > 0
      ? { passEnv: passEnvNames(stored?.passEnv) }
      : {}),
    ...(minFree === undefined ? {} : { minFreeDisk: minFree }),
    ...(Object.keys(modelListOverrides(stored?.models)).length > 0
      ? { models: modelListOverrides(stored?.models) }
      : {}),
    ...(typeof stored?.artifactTtlMs === 'number' &&
    Number.isSafeInteger(stored.artifactTtlMs) &&
    stored.artifactTtlMs >= 0
      ? { artifactTtlMs: stored.artifactTtlMs }
      : {}),
    ...(storedPatterns(stored?.artifactPatterns) === undefined
      ? {}
      : { artifactPatterns: storedPatterns(stored?.artifactPatterns)! }),
  };
}

/** `--pass-env` names: the valid ones, each once, in order. */
export function passEnvNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const names = value.filter(
    (name): name is string =>
      typeof name === 'string' &&
      ENV_NAME_PATTERN.test(name) &&
      !forbidden(name),
  );
  return [...new Set(names)];
}

/**
 * Drops `workspaceLimit`, a cap on what the working directories took together that `minFreeDisk` replaced, from the
 * stored settings. Returns whether there was one, so the daemon says once that it no longer applies.
 */
export async function dropWorkspaceLimit(
  paths: RunnerPaths = runnerPaths(),
): Promise<boolean> {
  const stored = await readJson<Record<string, unknown>>(paths.settings).catch(
    () => undefined,
  );
  if (stored === undefined || !('workspaceLimit' in stored)) return false;
  const { workspaceLimit: _replaced, ...rest } = stored;
  await writeJsonAtomic(paths.settings, rest);
  return true;
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

/** Persist revocation without rewriting the runner key. */
export async function markRevoked(
  registration: AppRegistration,
  reason: RevocationReason,
  paths: RunnerPaths,
): Promise<void> {
  const file = registrationPath(paths, registration.key);
  const current = (await readJson<AppRegistration>(file)) ?? registration;
  await writeJsonAtomic(
    file,
    {
      ...current,
      revoked: { at: new Date().toISOString(), reason },
    },
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
