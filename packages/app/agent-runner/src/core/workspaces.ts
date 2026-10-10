// What the runner keeps in its work root, and when a working directory may go.
//
// The runner's record of each subject's working directory (`<work root>/<app>/<subjectKey>/`, kept out of the agent's
// reach by checkout.ts) holds the last run that worked there (`lastRunId`) and whether it holds unpushed work
// (`hasUnpushedWork`): changes not committed, or a HEAD past both where the runner started the checkout and what it
// last saw the remote task branch hold. It is never judged from the default branch's history, so a branch merged with
// a squash is not unpushed once it was pushed. A fresh application decision also rechecks cached Git state against
// repository-specific merged PR heads, including legacy records without a remote tracking reference.
//
// The runner cannot tell on its own when the work on a subject is over. An application that accepts reports
// (`HeartbeatResponse.workspaces`) is told about each of its directories and answers which runs belong to subjects
// whose work is over (`WorkspacesResponse.remove`); those directories go, least recently used first. Nothing else goes
// on its own: a pushed directory whose work goes on is still that subject's checkout. The runner watches the disk
// holding them (`RunnerSettings.minFreeDisk`, 5 GB free by default), reading the free space from the file system
// (`statfs`) rather than measuring directories, which meant reading every file under every `node_modules`; when it is
// still low once the directories whose work is over are gone, it says once per pass what is left and that
// `nocobase-runner gc` can remove it. A directory a run holds (its lock is taken) is never touched, and one with unpushed
// work is only ever removed when a person forces it (`nocobase-runner gc --force`). Untracked leftovers are allowed
// only when the application confirms settlement and all repositories pass the tracked-change and commit checks.
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile, stat, statfs } from 'node:fs/promises';
import path from 'node:path';

import type { RunnerPaths } from '../lib/home.ts';
import { formatSize, minFreeBytes, type FreeSpace } from '../lib/size.ts';
import {
  MAX_WORKSPACES_PER_REPORT,
  type WorkspaceDisk,
  type WorkspaceDecision,
  type WorkspaceCleanupResult,
  type WorkspacesRequest,
  type WorkspacesResponse,
} from '../protocol/index.ts';
import {
  acquireLock,
  checkWorkspaceGit,
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
  unpushed: boolean;
  reportId?: string;
  decision?: WorkspaceDecision;
  cleanup?: WorkspaceCleanupResult;
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
  decisions: boolean = false,
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
  const reportId = decisions ? randomUUID() : undefined;
  const directories = (decisions ? entries : [])
    .filter((entry) => entry.appKey === appKey)
    .sort((a, b) => Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt))
    .slice(0, MAX_WORKSPACES_PER_REPORT)
    .map((entry) => {
      entry.reportId = reportId;
      return {
        workDir: entry.workDir,
        subjectKey: entry.subjectKey,
        lastUsedAt: entry.lastUsedAt,
        unpushed: entry.unpushed,
        ...(entry.lastRunId === undefined ? {} : { runId: entry.lastRunId }),
        ...(entry.cleanup === undefined ? {} : { cleanup: entry.cleanup }),
      };
    });
  return {
    workspaces,
    ...(decisions ? { directories, reportId } : {}),
    ...(disk === undefined ? {} : { disk }),
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

/** New decisions are tied to this request, directory, last run and last use. Recompute even when the old check was cached. */
export async function applyDecisions(
  paths: RunnerPaths,
  entries: readonly WorkspaceEntry[],
  appKey: string,
  response: WorkspacesResponse,
  log?: (message: string) => void,
): Promise<void> {
  applyStatuses(entries, appKey, response);
  for (const entry of entries) {
    if (entry.appKey !== appKey) continue;
    const matches =
      response.decisions?.filter(
        (item) =>
          item.reportId === entry.reportId &&
          item.workDir === entry.workDir &&
          item.runId === entry.lastRunId &&
          item.lastUsedAt === entry.lastUsedAt,
      ) ?? [];
    if (matches.length !== 1) continue;
    const decision = matches[0];
    entry.decision = decision;
    entry.status =
      decision.settled === true
        ? 'ended'
        : decision.settled === false
          ? 'active'
          : 'unknown';
    if (decision.settled !== true) continue;
    const meta = await readWorkspaceMeta(paths, entry.workDir);
    if (
      meta === undefined ||
      meta.lastRunId !== entry.lastRunId ||
      meta.lastUsedAt !== entry.lastUsedAt
    ) {
      entry.unpushed = true;
      entry.cleanup = {
        reportId: decision.reportId,
        reason: 'changed',
        discardsUntracked: false,
      };
      continue;
    }
    const check = entry.inUse
      ? { reason: 'inUse' as const, discardsUntracked: false }
      : await checkWorkspaceGit(
          entry.workDir,
          meta,
          decision.commits,
          true,
          log,
        );
    entry.unpushed = check.reason !== 'allowed';
    entry.cleanup = { reportId: decision.reportId, ...check };
    if (check.reason === 'allowed' && check.discardsUntracked)
      log?.(
        `workspaces: ${entry.workDir}: cleanup will discard untracked files`,
      );
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

export type PlanReason = 'ended' | 'selected';

export interface PlannedRemoval {
  readonly entry: WorkspaceEntry;
  readonly reason: PlanReason;
}

export interface WorkspacePlan {
  readonly remove: PlannedRemoval[];
  /** Picked, but kept: a run holds it, or it has unpushed work. */
  readonly kept: { entry: WorkspaceEntry; reason: 'inUse' | 'unpushed' }[];
}

const filtered = (filters: WorkspaceFilters | undefined): boolean =>
  filters !== undefined &&
  (filters.ended === true ||
    filters.olderThanMs !== undefined ||
    filters.subject !== undefined);

/**
 * Which directories go. By default: those whose work is over, least recently used first. With filters: the directories every filter matches. A directory a run
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
    return { remove, kept };
  }
  const ended = entries
    .filter((entry) => entry.status === 'ended')
    .sort((a, b) => Date.parse(a.lastUsedAt) - Date.parse(b.lastUsedAt));
  for (const entry of ended) pick(entry, 'ended');
  return { remove, kept };
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
      (
        await checkWorkspaceGit(
          entry.workDir,
          meta,
          entry.decision?.settled === true ? entry.decision.commits : [],
          entry.decision?.settled === true,
          options.log,
        )
      ).reason !== 'allowed'
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

/**
 * What to say when less than `threshold` is free on `disk` with `left` the directories still there: how many pushed
 * ones whose work goes on and how many with unpushed work remain, and that `gc` removes them. Undefined while enough is
 * free.
 */
export function lowDiskWarning(
  left: readonly WorkspaceEntry[],
  disk: DiskSpace | undefined,
  threshold: FreeSpace | null,
): string | undefined {
  if (disk === undefined || threshold === null || !lowOnDisk(disk, threshold))
    return undefined;
  const pushed = left.filter((entry) => !entry.unpushed).length;
  const unpushed = left.length - pushed;
  return (
    `the disk holding the working directories is low: ${formatSize(disk.freeBytes)} free, ` +
    `${formatSize(minFreeBytes(threshold, disk.totalBytes))} wanted (min-free-disk). ` +
    `${pushed} pushed working ${pushed === 1 ? 'directory' : 'directories'} whose work goes on and ` +
    `${unpushed} with unpushed work remain and are not removed on their own; ` +
    '`nocobase-runner gc` lists them and removes the ones you pick (--older-than, --subject; --force for unpushed work).'
  );
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
  readonly decisionApps?: ReadonlySet<string>;
  readonly readDisk?: ReadDisk;
  readonly log?: (message: string) => void;
}

export interface CollectResult {
  readonly removed: { workDir: string; reason: PlanReason }[];
  readonly kept: { workDir: string; reason: string }[];
  readonly entries: WorkspaceEntry[];
  readonly plan: WorkspacePlan;
  /** The disk once done; undefined when it cannot be read. */
  readonly disk: DiskSpace | undefined;
  /** Less than the threshold is still free. */
  readonly low: boolean;
}

/**
 * One pass: checks every directory, reports each application's to it when it accepts reports, removes the ones whose
 * work is over, and warns once when the disk is still low.
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
      const response = await report(
        workspacesRequest(
          entries,
          appKey,
          disk,
          options.decisionApps?.has(appKey) === true,
        ),
      );
      await applyDecisions(paths, entries, appKey, response, log);
      // Publish the local check against the prior decision, before attempting deletion. The response is not reused
      // as new deletion authority: the plan and its locked check keep the original evidence from this pass.
      if (options.decisionApps?.has(appKey) === true)
        await report(workspacesRequest(entries, appKey, disk, true));
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
  const after = await read(paths.workRoot);
  const gone = new Set(removed.map((item) => item.workDir));
  const warning = lowDiskWarning(
    entries.filter((entry) => !gone.has(entry.workDir)),
    after,
    threshold,
  );
  if (warning !== undefined) log?.(`workspaces: ${warning}`);
  return {
    removed,
    kept,
    entries,
    plan,
    disk: after,
    low: warning !== undefined,
  };
}
