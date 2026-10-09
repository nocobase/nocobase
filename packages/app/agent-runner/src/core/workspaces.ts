// What the runner keeps in its work root, and when a working directory may go.
//
// The runner's record of each subject's working directory (`<work root>/<app>/<subjectKey>/`, kept out of the agent's
// reach by checkout.ts) holds the last run that worked there (`lastRunId`) and whether it holds unpushed work
// (`hasUnpushedWork`): changes not committed, or a HEAD past both where the runner started the checkout and what it
// last saw the remote task branch hold. It is never judged from the default branch's history, so a branch merged with
// a squash is not unpushed once it was pushed. A directory is checked again only after a run used it.
//
// The runner cannot tell on its own when the work on a subject is over. An application that accepts reports
// (`HeartbeatResponse.workspaces`) is told about each of its directories and answers which runs belong to subjects
// whose work is over (`WorkspacesResponse.remove`); those directories go. Beside that, the runner keeps part of the
// disk holding them free (`RunnerSettings.minFreeDisk`, 10% by default): below it, the directories whose work is over
// go first, then those with nothing unpushed, least recently used first, the file system asked again after each until
// enough is free. Disk pressure is read from the file system (`statfs`) rather than by measuring directories, which
// meant reading every file under every `node_modules`. A directory a run holds (its lock is taken) is never touched,
// and one with unpushed work is only ever removed when a person forces it (`nocobase-runner gc --force`).
import { existsSync } from 'node:fs';
import { readdir, readFile, stat, statfs } from 'node:fs/promises';
import path from 'node:path';

import type { RunnerPaths } from '../lib/home.ts';
import { minFreeBytes, type FreeSpace } from '../lib/size.ts';
import {
  MAX_WORKSPACES_PER_REPORT,
  type WorkspaceDisk,
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

/** What the application said about a directory's last run. */
export type WorkspaceStatus = 'ended' | 'active' | 'unknown';

export interface WorkspaceEntry {
  readonly workDir: string;
  readonly appKey: string;
  readonly subjectKey: string;
  readonly lastRunId?: string;
  readonly lastUsedAt: string;
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
 * The directory with its unpushed state, checked again when a run used it since the last check, and recorded unless a
 * run started meanwhile. A directory a run holds keeps what was last recorded.
 */
export async function inspectWorkspace(
  paths: RunnerPaths,
  workDir: string,
  meta: WorkspaceMeta,
  options: { now?: number; force?: boolean; log?: (message: string) => void },
): Promise<WorkspaceEntry> {
  const now = options.now ?? Date.now();
  const inUse = await isLocked(workDir);
  const checkedAt =
    meta.measuredAt === undefined ? Number.NaN : Date.parse(meta.measuredAt);
  const stale =
    options.force === true ||
    meta.unpushed === undefined ||
    !Number.isFinite(checkedAt) ||
    Date.parse(meta.lastUsedAt) >= checkedAt;
  let unpushed = meta.unpushed ?? false;
  if (stale && !inUse) {
    unpushed = await hasUnpushedWork(workDir, meta, options.log);
    await recordCheck(paths, workDir, meta, {
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
    unpushed,
    inUse,
    status: 'unknown',
  };
}

/** Writes a check into the record, unless a run used the directory since it was read. */
async function recordCheck(
  paths: RunnerPaths,
  workDir: string,
  read: WorkspaceMeta,
  check: Pick<WorkspaceMeta, 'unpushed' | 'measuredAt'>,
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
    await writeWorkspaceMeta(paths, workDir, { ...current, ...check });
  } finally {
    await lock.release();
  }
}

/** Every working directory, checked. */
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
    entries.push(await inspectWorkspace(paths, workDir, meta, options));
  return entries;
}

/** Free and total bytes of a file system, as `statfs` reports them for a path on it. */
export interface DiskSpace {
  readonly freeBytes: number;
  readonly totalBytes: number;
}

/** Reads the disk holding `dir`; tests replace it. */
export type ReadDisk = (dir: string) => Promise<DiskSpace | undefined>;

/**
 * The disk holding `dir`, or the directory it will be created in: what an unprivileged user may still write (`bavail`),
 * of its total. Undefined when the file system cannot say.
 */
export async function readDisk(dir: string): Promise<DiskSpace | undefined> {
  for (let current = path.resolve(dir); ; current = path.dirname(current)) {
    try {
      const info = await statfs(current);
      return {
        freeBytes: info.bavail * info.bsize,
        totalBytes: info.blocks * info.bsize,
      };
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== 'ENOENT' ||
        path.dirname(current) === current
      )
        return undefined;
    }
  }
}

/** The disk as the application is told about it, with the bytes the owner keeps free. */
export function workspaceDisk(
  disk: DiskSpace,
  threshold: FreeSpace | null,
): WorkspaceDisk {
  return {
    freeBytes: Math.max(0, Math.floor(disk.freeBytes)),
    totalBytes: Math.max(0, Math.floor(disk.totalBytes)),
    ...(threshold === null
      ? {}
      : { minFreeBytes: minFreeBytes(threshold, disk.totalBytes) }),
  };
}

/** Whether less than `threshold` is free on `disk`; never without a threshold or a disk that says. */
export function lowOnDisk(
  disk: DiskSpace | undefined,
  threshold: FreeSpace | null,
): boolean {
  return (
    disk !== undefined &&
    threshold !== null &&
    disk.freeBytes < minFreeBytes(threshold, disk.totalBytes)
  );
}

/** What one application is told: its directories that a run worked in, most recently used first, and the disk. */
export function workspacesRequest(
  entries: readonly WorkspaceEntry[],
  appKey: string,
  disk: WorkspaceDisk | undefined,
): WorkspacesRequest {
  const workspaces = entries
    .filter((entry) => entry.appKey === appKey && entry.lastRunId !== undefined)
    .sort((a, b) => Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt))
    .slice(0, MAX_WORKSPACES_PER_REPORT)
    .map((entry) => ({
      runId: entry.lastRunId!,
      workDir: entry.workDir,
      unpushed: entry.unpushed,
      lastUsedAt: entry.lastUsedAt,
    }));
  return { workspaces, ...(disk === undefined ? {} : { disk }) };
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
  /** Pick by these instead of the default rules. */
  readonly filters?: WorkspaceFilters;
  /** Remove picked directories with unpushed work too. */
  readonly force?: boolean;
}

export type PlanReason = 'ended' | 'lowDisk' | 'selected';

export interface PlannedRemoval {
  readonly entry: WorkspaceEntry;
  readonly reason: PlanReason;
}

export interface WorkspacePlan {
  readonly remove: PlannedRemoval[];
  /** Picked, but kept: a run holds it, or it has unpushed work. */
  readonly kept: { entry: WorkspaceEntry; reason: 'inUse' | 'unpushed' }[];
  /**
   * What may go too while the disk is low, in order: those with nothing unpushed that no run holds, least recently
   * used first. Empty with filters.
   */
  readonly spare: WorkspaceEntry[];
}

const filtered = (filters: WorkspaceFilters | undefined): boolean =>
  filters !== undefined &&
  (filters.ended === true ||
    filters.olderThanMs !== undefined ||
    filters.subject !== undefined);

/**
 * Which directories go. By default: those whose work is over, and then, while the disk is low (`spare`), those with
 * nothing unpushed, least recently used first. With filters: the directories every filter matches. A directory a run
 * holds is never removed, nor one with unpushed work unless forced.
 */
export function planRemovals(
  entries: readonly WorkspaceEntry[],
  options: PlanOptions = {},
): WorkspacePlan {
  const now = options.now ?? Date.now();
  const remove: PlannedRemoval[] = [];
  const kept: WorkspacePlan['kept'] = [];
  const taken = new Set<string>();
  const pick = (entry: WorkspaceEntry, reason: PlanReason): void => {
    if (taken.has(entry.workDir)) return;
    taken.add(entry.workDir);
    if (entry.inUse) kept.push({ entry, reason: 'inUse' });
    else if (entry.unpushed && options.force !== true)
      kept.push({ entry, reason: 'unpushed' });
    else remove.push({ entry, reason });
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
    return { remove, kept, spare: [] };
  }
  for (const entry of entries)
    if (entry.status === 'ended') pick(entry, 'ended');
  const spare = entries
    .filter(
      (entry) => !taken.has(entry.workDir) && !entry.inUse && !entry.unpushed,
    )
    .sort((a, b) => Date.parse(a.lastUsedAt) - Date.parse(b.lastUsedAt));
  return { remove, kept, spare };
}

/**
 * Removes a planned directory, under its lock: unless a run took it, or used it since it was checked, or (not forced)
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

export interface RelieveOptions {
  readonly threshold: FreeSpace | null;
  readonly readDisk?: ReadDisk;
  readonly log?: (message: string) => void;
}

export interface RelieveResult {
  readonly removed: WorkspaceEntry[];
  readonly kept: { workDir: string; reason: string }[];
  /** The disk once done; undefined when it cannot be read. */
  readonly disk: DiskSpace | undefined;
  /** Still below the threshold, with nothing left that may go. */
  readonly low: boolean;
}

/**
 * Removes `spare` directories in order while less than `threshold` is free on the disk holding the work root, asking
 * the file system again after each.
 */
export async function relieveDiskPressure(
  paths: RunnerPaths,
  spare: readonly WorkspaceEntry[],
  options: RelieveOptions,
): Promise<RelieveResult> {
  const read = options.readDisk ?? readDisk;
  const removed: WorkspaceEntry[] = [];
  const kept: RelieveResult['kept'] = [];
  let disk = await read(paths.workRoot);
  for (const entry of spare) {
    if (!lowOnDisk(disk, options.threshold)) break;
    const why = await removePlanned(
      paths,
      entry,
      options.log === undefined ? {} : { log: options.log },
    );
    if (why === undefined) removed.push(entry);
    else kept.push({ workDir: entry.workDir, reason: why });
    disk = await read(paths.workRoot);
  }
  return { removed, kept, disk, low: lowOnDisk(disk, options.threshold) };
}

export interface CollectOptions {
  readonly paths: RunnerPaths;
  readonly now?: number;
  /** What to keep free on the disk holding the work root; null for nothing. */
  readonly threshold?: FreeSpace | null;
  /** For each application that accepts reports, by its registration key: sends one. */
  readonly reporters?: ReadonlyMap<
    string,
    (request: WorkspacesRequest) => Promise<WorkspacesResponse>
  >;
  readonly readDisk?: ReadDisk;
  readonly log?: (message: string) => void;
}

export interface CollectResult {
  readonly removed: { workDir: string; reason: PlanReason }[];
  readonly kept: { workDir: string; reason: string }[];
  readonly entries: WorkspaceEntry[];
  readonly plan: WorkspacePlan;
  readonly disk: DiskSpace | undefined;
}

/**
 * One pass: checks every directory, reports each application's to it when it accepts reports, removes what the default
 * rules let go, and then, while the disk is low, what else may go.
 */
export async function collectWorkspaces(
  options: CollectOptions,
): Promise<CollectResult> {
  const { log, paths } = options;
  const threshold = options.threshold ?? null;
  const read = options.readDisk ?? readDisk;
  const entries = await scanWorkspaces(paths, {
    ...(options.now === undefined ? {} : { now: options.now }),
    ...(log === undefined ? {} : { log }),
  });
  const before = await read(paths.workRoot);
  const disk =
    before === undefined ? undefined : workspaceDisk(before, threshold);
  for (const [appKey, report] of options.reporters ?? []) {
    try {
      const response = await report(workspacesRequest(entries, appKey, disk));
      applyStatuses(entries, appKey, response);
    } catch (error) {
      log?.(
        `${appKey}: workspace report failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  const plan = planRemovals(entries, {
    ...(options.now === undefined ? {} : { now: options.now }),
  });
  const removed: CollectResult['removed'] = [];
  const kept: CollectResult['kept'] = plan.kept.map(({ entry, reason }) => ({
    workDir: entry.workDir,
    reason,
  }));
  for (const { entry, reason } of plan.remove) {
    const why = await removePlanned(
      paths,
      entry,
      log === undefined ? {} : { log },
    );
    if (why === undefined) {
      removed.push({ workDir: entry.workDir, reason });
      log?.(`workspaces: removed ${entry.workDir} (its work is over)`);
    } else kept.push({ workDir: entry.workDir, reason: why });
  }
  for (const item of plan.kept)
    if (item.reason === 'unpushed' && item.entry.status === 'ended')
      log?.(
        `workspaces: kept ${item.entry.workDir}: its work is over, but it holds work that was never pushed`,
      );
  const relieved = await relieveDiskPressure(paths, plan.spare, {
    threshold,
    readDisk: read,
    ...(log === undefined ? {} : { log }),
  });
  for (const entry of relieved.removed) {
    removed.push({ workDir: entry.workDir, reason: 'lowDisk' });
    log?.(`workspaces: removed ${entry.workDir} (the disk is low)`);
  }
  kept.push(...relieved.kept);
  if (relieved.low)
    log?.(
      'workspaces: the disk is still low; what is left holds unpushed work or is in use',
    );
  return { removed, kept, entries, plan, disk: relieved.disk };
}
