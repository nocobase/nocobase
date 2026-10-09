// What the runner keeps in its work root, and when a working directory may go.
//
// The runner's record of each subject's working directory (`<work root>/<app>/<subjectKey>/`, kept out of the agent's
// reach by checkout.ts) holds the last run that worked there (`lastRunId`) and, once measured, what it takes on disk
// and whether it holds unpushed work (`hasUnpushedWork`): changes not committed, or a HEAD past both where the runner
// started the checkout and what it last saw the remote task branch hold. It is never judged from the default branch's
// history, so a branch merged with a squash is not unpushed once it was pushed. A directory is measured again only
// after a run used it, or once a day.
//
// The runner cannot tell on its own when the work on a subject is over. An application that accepts reports
// (`HeartbeatResponse.workspaces`) is told about each of its directories and answers which runs belong to subjects
// whose work is over (`WorkspacesResponse.remove`); those directories go. Beside that, the owner may cap what every
// directory takes together (`RunnerSettings.workspaceLimit`): over it, the directories whose work is over go first,
// then those with nothing unpushed, least recently used first. A directory a run holds (its lock is taken) is never
// touched, and one with unpushed work is only ever removed when a person forces it (`nocobase-runner gc --force`).
import { existsSync } from 'node:fs';
import { lstat, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import type { RunnerPaths } from '../lib/home.ts';
import {
  MAX_WORKSPACES_PER_REPORT,
  type WorkspacesRequest,
  type WorkspacesResponse,
} from '../protocol/index.ts';
import {
  acquireLock,
  hasUnpushedWork,
  readWorkspaceMeta,
  removeWorkspace,
  writeWorkspaceMeta,
  type Lock,
  type WorkspaceMeta,
} from './checkout.ts';
import { isAlive } from './supervisor.ts';

export { hasUnpushedWork } from './checkout.ts';

/** How long a measurement stands when nothing used the directory since. */
const REMEASURE_MS = 24 * 60 * 60 * 1000;

/** What the application said about a directory's last run. */
export type WorkspaceStatus = 'ended' | 'active' | 'unknown';

export interface WorkspaceEntry {
  readonly workDir: string;
  readonly appKey: string;
  readonly subjectKey: string;
  readonly lastRunId?: string;
  readonly lastUsedAt: string;
  readonly sizeBytes: number;
  readonly unpushed: boolean;
  /** A run holds it now. */
  readonly inUse: boolean;
  status: WorkspaceStatus;
}

/** Every subject's working directory with its record, across every application. */
export async function listWorkspaceDirs(
  paths: RunnerPaths,
): Promise<{ workDir: string; meta: WorkspaceMeta }[]> {
  const found: { workDir: string; meta: WorkspaceMeta }[] = [];
  const apps = await readdir(paths.workRoot, { withFileTypes: true }).catch(
    () => [],
  );
  for (const app of apps) {
    // `.pnpm-store`, `.jobs`: the runner's own, never an application's (`safeName` gives none a leading dot).
    if (!app.isDirectory() || app.name.startsWith('.')) continue;
    const appDir = path.join(paths.workRoot, app.name);
    for (const entry of await readdir(appDir, { withFileTypes: true }).catch(
      () => [],
    )) {
      if (!entry.isDirectory()) continue;
      const workDir = path.join(appDir, entry.name);
      const meta = await readWorkspaceMeta(paths, workDir);
      if (meta !== undefined) found.push({ workDir, meta });
    }
  }
  return found;
}

/** Whether a live process holds the directory's lock (a run works in it, or another pass is removing it). */
async function isLocked(workDir: string): Promise<boolean> {
  const lockDir = `${workDir}.lock`;
  if (!existsSync(lockDir)) return false;
  const owner = Number(
    await readFile(path.join(lockDir, 'owner'), 'utf8').catch(() => ''),
  );
  if (owner > 0) return isAlive(owner);
  // An owner not written yet is a lock being taken; an old one without an owner was left by a crash (acquireLock).
  const age =
    Date.now() - (await stat(lockDir).catch(() => ({ mtimeMs: 0 }))).mtimeMs;
  return age <= 5_000;
}

/**
 * Bytes on disk under `dir` that removing it frees: symbolic links are not followed, and a file with other hard links
 * (a package linked from the shared pnpm store, say) counts nothing, since its bytes stay with the other links.
 */
export async function diskUsage(dir: string): Promise<number> {
  let total = 0;
  const pending = [dir];
  while (pending.length > 0) {
    const current = pending.pop()!;
    const entries = await readdir(current, { withFileTypes: true }).catch(
      () => [],
    );
    for (const entry of entries) {
      const file = path.join(current, entry.name);
      const info = await lstat(file).catch(() => undefined);
      if (info === undefined) continue;
      if (info.isDirectory()) pending.push(file);
      else if (info.nlink > 1) continue;
      total += info.blocks > 0 ? info.blocks * 512 : info.size;
    }
  }
  return total;
}

/**
 * The directory with its size and unpushed state, measured again when a run used it since the last measurement (or a
 * day passed), and recorded unless a run started meanwhile. A directory a run holds is measured but not recorded.
 */
export async function measureWorkspace(
  paths: RunnerPaths,
  workDir: string,
  meta: WorkspaceMeta,
  options: { now?: number; force?: boolean; log?: (message: string) => void },
): Promise<WorkspaceEntry> {
  const now = options.now ?? Date.now();
  const inUse = await isLocked(workDir);
  const measuredAt =
    meta.measuredAt === undefined ? Number.NaN : Date.parse(meta.measuredAt);
  const stale =
    options.force === true ||
    meta.sizeBytes === undefined ||
    meta.unpushed === undefined ||
    !Number.isFinite(measuredAt) ||
    Date.parse(meta.lastUsedAt) >= measuredAt ||
    now - measuredAt > REMEASURE_MS;
  let sizeBytes = meta.sizeBytes ?? 0;
  let unpushed = meta.unpushed ?? false;
  if (stale || inUse) sizeBytes = await diskUsage(workDir);
  if (stale && !inUse) {
    unpushed = await hasUnpushedWork(workDir, meta, options.log);
    await recordMeasurement(paths, workDir, meta, {
      sizeBytes,
      unpushed,
      measuredAt: new Date(now).toISOString(),
    });
  }
  return {
    workDir,
    appKey: meta.appKey ?? path.basename(path.dirname(workDir)),
    subjectKey: meta.subjectKey,
    ...(meta.lastRunId === undefined ? {} : { lastRunId: meta.lastRunId }),
    lastUsedAt: meta.lastUsedAt,
    sizeBytes,
    unpushed,
    inUse,
    status: 'unknown',
  };
}

/** Writes a measurement into the record, unless a run used the directory since it was read. */
async function recordMeasurement(
  paths: RunnerPaths,
  workDir: string,
  read: WorkspaceMeta,
  measurement: Pick<WorkspaceMeta, 'sizeBytes' | 'unpushed' | 'measuredAt'>,
): Promise<void> {
  let lock: Lock;
  try {
    lock = await acquireLock(`${workDir}.lock`, { timeoutMs: 0 });
  } catch {
    return;
  }
  try {
    const current = await readWorkspaceMeta(paths, workDir);
    if (current === undefined || current.lastUsedAt !== read.lastUsedAt) return;
    await writeWorkspaceMeta(paths, workDir, { ...current, ...measurement });
  } finally {
    await lock.release();
  }
}

/** Every working directory, measured. */
export async function scanWorkspaces(
  paths: RunnerPaths,
  options: {
    now?: number;
    force?: boolean;
    log?: (message: string) => void;
  } = {},
): Promise<WorkspaceEntry[]> {
  const entries: WorkspaceEntry[] = [];
  for (const { workDir, meta } of await listWorkspaceDirs(paths))
    entries.push(await measureWorkspace(paths, workDir, meta, options));
  return entries;
}

/** What one application is told: its directories that a run worked in, most recently used first. */
export function workspacesRequest(
  entries: readonly WorkspaceEntry[],
  appKey: string,
  limitBytes: number | undefined,
): WorkspacesRequest {
  const workspaces = entries
    .filter((entry) => entry.appKey === appKey && entry.lastRunId !== undefined)
    .sort((a, b) => Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt))
    .slice(0, MAX_WORKSPACES_PER_REPORT)
    .map((entry) => ({
      runId: entry.lastRunId!,
      workDir: entry.workDir,
      sizeBytes: entry.sizeBytes,
      unpushed: entry.unpushed,
      lastUsedAt: entry.lastUsedAt,
    }));
  return {
    workspaces,
    ...(limitBytes === undefined ? {} : { limitBytes }),
    totalBytes: entries.reduce((total, entry) => total + entry.sizeBytes, 0),
  };
}

/** Records on each of `appKey`'s directories what the application answered about its last run. */
export function applyStatuses(
  entries: readonly WorkspaceEntry[],
  appKey: string,
  response: WorkspacesResponse,
): void {
  const remove = new Set(response.remove);
  const keep = new Set(response.keep);
  for (const entry of entries) {
    if (entry.appKey !== appKey || entry.lastRunId === undefined) continue;
    if (remove.has(entry.lastRunId)) entry.status = 'ended';
    else if (keep.has(entry.lastRunId)) entry.status = 'active';
  }
}

/** Which directories to pick, beside the default rules (`nocobase-runner gc`). Every filter given must match. */
export interface WorkspaceFilters {
  /** Those whose work the application says is over. */
  readonly ended?: boolean;
  /** Those not used for this long. */
  readonly olderThanMs?: number;
  /** Those of this subject (`TASK-42`). */
  readonly subject?: string;
}

export interface PlanOptions {
  readonly now?: number;
  /** The total the directories may take; none without it. */
  readonly limitBytes?: number;
  /** Pick by these instead of the default rules. */
  readonly filters?: WorkspaceFilters;
  /** Remove picked directories with unpushed work too. */
  readonly force?: boolean;
}

export type PlanReason = 'ended' | 'overLimit' | 'selected';

export interface PlannedRemoval {
  readonly entry: WorkspaceEntry;
  readonly reason: PlanReason;
}

export interface WorkspacePlan {
  readonly remove: PlannedRemoval[];
  /** Picked, but kept: a run holds it, or it has unpushed work. */
  readonly kept: { entry: WorkspaceEntry; reason: 'inUse' | 'unpushed' }[];
  readonly totalBytes: number;
  /** What is left once the plan is carried out. */
  readonly remainingBytes: number;
  /** Still over the limit afterwards, with only unpushed or held directories left to remove. */
  readonly overLimit: boolean;
}

const filtered = (filters: WorkspaceFilters | undefined): boolean =>
  filters !== undefined &&
  (filters.ended === true ||
    filters.olderThanMs !== undefined ||
    filters.subject !== undefined);

/**
 * Which directories go. By default: those whose work is over, and then, while the total is over the limit, those with
 * nothing unpushed, least recently used first. With filters: the directories every filter matches. A directory a run
 * holds is never removed, nor one with unpushed work unless forced.
 */
export function planRemovals(
  entries: readonly WorkspaceEntry[],
  options: PlanOptions = {},
): WorkspacePlan {
  const now = options.now ?? Date.now();
  const totalBytes = entries.reduce(
    (total, entry) => total + entry.sizeBytes,
    0,
  );
  const remove: PlannedRemoval[] = [];
  const kept: WorkspacePlan['kept'] = [];
  const taken = new Set<string>();
  const pick = (entry: WorkspaceEntry, reason: PlanReason): boolean => {
    if (taken.has(entry.workDir)) return false;
    if (entry.inUse) {
      kept.push({ entry, reason: 'inUse' });
      taken.add(entry.workDir);
      return false;
    }
    if (entry.unpushed && options.force !== true) {
      kept.push({ entry, reason: 'unpushed' });
      taken.add(entry.workDir);
      return false;
    }
    remove.push({ entry, reason });
    taken.add(entry.workDir);
    return true;
  };
  const filters = options.filters;
  if (filtered(filters)) {
    for (const entry of entries) {
      if (filters?.ended === true && entry.status !== 'ended') continue;
      if (
        filters?.olderThanMs !== undefined &&
        !(now - Date.parse(entry.lastUsedAt) > filters.olderThanMs)
      )
        continue;
      if (
        filters?.subject !== undefined &&
        entry.subjectKey !== filters.subject
      )
        continue;
      pick(entry, 'selected');
    }
  } else {
    for (const entry of entries)
      if (entry.status === 'ended') pick(entry, 'ended');
  }
  let remaining =
    totalBytes -
    remove.reduce((total, item) => total + item.entry.sizeBytes, 0);
  if (options.limitBytes !== undefined && remaining > options.limitBytes) {
    const candidates = entries
      .filter(
        (entry) => !taken.has(entry.workDir) && !entry.inUse && !entry.unpushed,
      )
      .sort(
        (a, b) =>
          Number(b.status === 'ended') - Number(a.status === 'ended') ||
          Date.parse(a.lastUsedAt) - Date.parse(b.lastUsedAt),
      );
    for (const entry of candidates) {
      if (remaining <= options.limitBytes) break;
      if (pick(entry, 'overLimit')) remaining -= entry.sizeBytes;
    }
  }
  return {
    remove,
    kept,
    totalBytes,
    remainingBytes: remaining,
    overLimit:
      options.limitBytes !== undefined && remaining > options.limitBytes,
  };
}

/**
 * Removes a planned directory, under its lock: unless a run took it, or used it since it was measured, or (not forced)
 * it has unpushed work now. Returns why it was kept, or undefined when it was removed.
 */
export async function removePlanned(
  paths: RunnerPaths,
  entry: WorkspaceEntry,
  options: { force?: boolean; log?: (message: string) => void } = {},
): Promise<'inUse' | 'changed' | 'unpushed' | undefined> {
  let lock: Lock;
  try {
    lock = await acquireLock(`${entry.workDir}.lock`, { timeoutMs: 0 });
  } catch {
    return 'inUse';
  }
  try {
    const meta = await readWorkspaceMeta(paths, entry.workDir);
    if (meta === undefined) return 'changed';
    if (
      meta.lastUsedAt !== entry.lastUsedAt ||
      meta.lastRunId !== entry.lastRunId
    )
      return 'changed';
    if (
      options.force !== true &&
      (await hasUnpushedWork(entry.workDir, meta, options.log))
    ) {
      await writeWorkspaceMeta(paths, entry.workDir, {
        ...meta,
        unpushed: true,
      });
      return 'unpushed';
    }
    await removeWorkspace(paths, entry.workDir, meta);
    return undefined;
  } finally {
    await lock.release();
  }
}

export interface CollectOptions {
  readonly paths: RunnerPaths;
  readonly now?: number;
  readonly limitBytes?: number;
  /** For each application that accepts reports, by its registration key: sends one. */
  readonly reporters?: ReadonlyMap<
    string,
    (request: WorkspacesRequest) => Promise<WorkspacesResponse>
  >;
  readonly log?: (message: string) => void;
}

export interface CollectResult {
  readonly removed: { workDir: string; reason: PlanReason }[];
  readonly kept: { workDir: string; reason: string }[];
  readonly entries: WorkspaceEntry[];
  readonly plan: WorkspacePlan;
}

/**
 * One pass: measures every directory, reports each application's to it when it accepts reports, and removes what the
 * default rules let go.
 */
export async function collectWorkspaces(
  options: CollectOptions,
): Promise<CollectResult> {
  const { log } = options;
  const entries = await scanWorkspaces(options.paths, {
    ...(options.now === undefined ? {} : { now: options.now }),
    ...(log === undefined ? {} : { log }),
  });
  for (const [appKey, report] of options.reporters ?? []) {
    try {
      const response = await report(
        workspacesRequest(entries, appKey, options.limitBytes),
      );
      applyStatuses(entries, appKey, response);
    } catch (error) {
      log?.(
        `${appKey}: workspace report failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  const plan = planRemovals(entries, {
    ...(options.now === undefined ? {} : { now: options.now }),
    ...(options.limitBytes === undefined
      ? {}
      : { limitBytes: options.limitBytes }),
  });
  const removed: CollectResult['removed'] = [];
  const kept: CollectResult['kept'] = plan.kept.map(({ entry, reason }) => ({
    workDir: entry.workDir,
    reason,
  }));
  for (const { entry, reason } of plan.remove) {
    const why = await removePlanned(
      options.paths,
      entry,
      log === undefined ? {} : { log },
    );
    if (why === undefined) {
      removed.push({ workDir: entry.workDir, reason });
      log?.(
        `workspaces: removed ${entry.workDir} (${reason === 'ended' ? 'its work is over' : 'over the workspace limit'})`,
      );
    } else kept.push({ workDir: entry.workDir, reason: why });
  }
  for (const item of plan.kept)
    if (item.reason === 'unpushed' && item.entry.status === 'ended')
      log?.(
        `workspaces: kept ${item.entry.workDir}: its work is over, but it holds work that was never pushed`,
      );
  if (plan.overLimit)
    log?.(
      `workspaces: still over the workspace limit; what is left holds unpushed work or is in use`,
    );
  return { removed, kept, entries, plan };
}
