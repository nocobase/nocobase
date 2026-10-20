// Once the application says a directory's work is over (`ended`), routine collection removes it, with its session
// directories, whatever it holds: untracked files, uncommitted changes and commits never pushed go with it. Only a run
// holding its lock, or using it since it was reported, keeps it. Directories whose work goes on, or whose status is
// unknown, keep their unpushed work unless a person forces it (`nocobase-runner gc --force`). Disk-pressure cleanup then
// removes regenerable artifacts, clean pushed idle workspaces and disposable read-only copies, stopping as soon as free
// space recovers.
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile, rm, stat, statfs } from 'node:fs/promises';
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
import { isInside } from '../lib/paths.ts';
import {
  acquireLock,
  git,
  gitOk,
  lockCache,
  isDisposableWorkspace,
  isReadOnlyWorkspace,
  checkWorkspaceGit,
  hasUnpushedWork,
  readWorkspaceMeta,
  removeWorkspace,
  workspaceRecordPath,
  writeWorkspaceMeta,
  type Lock,
  type WorkspaceMeta,
} from './checkout.ts';
import { cleanArtifacts, type ArtifactOptions } from './artifacts.ts';
import { isAlive } from './supervisor.ts';
import {
  canRetryWorkspaceRemoval,
  clearContinuations,
  retryWorkspaceRemoval,
  runBranch,
} from './run-worktrees.ts';

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
  /** A read-only checkout (`isDisposableWorkspace`): removed once unlocked, with nothing to save. */
  readonly disposable?: boolean;
  /** Verified pushed work with an already-started removal. */
  readonly removing?: boolean;
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
      else if (isReadOnlyWorkspace(workDir))
        found.push({
          workDir,
          meta: {
            subjectKey: entry.name,
            appKey: app.name,
            repos: [],
            lastUsedAt: new Date(0).toISOString(),
          },
        });
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
  const disposable = isDisposableWorkspace(workDir, meta);
  const removing =
    !inUse && (await canRetryWorkspaceRemoval(paths, workDir, meta));
  if (disposable || removing) unpushed = false;
  else if (stale && !inUse) {
    unpushed = await hasUnpushedWork(workDir, meta, options.log);
    await recordCheck(paths, workDir, meta, {
      unpushed,
      measuredAt: new Date(now).toISOString(),
    }).catch((error: unknown) =>
      options.log?.(
        `workspaces: diagnostic cache write failed for ${workDir}: ${String(error)}`,
      ),
    );
  }
  return {
    workDir,
    appKey: meta.appKey ?? path.basename(path.dirname(workDir)),
    subjectKey: meta.subjectKey,
    ...(meta.lastRunId === undefined ? {} : { lastRunId: meta.lastRunId }),
    lastUsedAt: meta.lastUsedAt,
    unpushed,
    inUse,
    ...(disposable ? { disposable } : {}),
    ...(removing ? { removing } : {}),
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

/** Every working directory, checked. Sizes are not measured: walking every file of every directory takes minutes. */
export async function scanWorkspaces(
  paths: RunnerPaths,
  options: {
    now?: number;
    force?: boolean;
    log?: (message: string) => void;
  } = {},
): Promise<WorkspaceEntry[]> {
  const entries: WorkspaceEntry[] = [];
  for (const { workDir, meta } of await listWorkspaceDirs(paths)) {
    try {
      entries.push(await inspectWorkspace(paths, workDir, meta, options));
    } catch (error) {
      options.log?.(
        `workspaces: inspection failed; retained ${workDir}: ${String(error)}`,
      );
    }
  }
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

/**
 * New decisions are tied to this request, directory, last run and last use. A directory used since it was reported is
 * not taken as ended; one whose work is over goes whatever it holds.
 */
export async function applyDecisions(
  paths: RunnerPaths,
  entries: readonly WorkspaceEntry[],
  appKey: string,
  response: WorkspacesResponse,
  _log?: (message: string) => void,
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
    entry.cleanup = {
      reportId: decision.reportId,
      reason: entry.inUse ? 'inUse' : 'allowed',
      discardsUntracked: !entry.inUse && entry.unpushed,
    };
  }
}

/**
 * Takes back the removal of each of `appKey`'s ended directories that `response`, a later answer, does not confirm:
 * one whose matching decision now says the work goes on or cannot tell, one it leaves out, or every one when the answer
 * never came. Such a directory is no longer ended, and its unpushed work keeps it again.
 */
export function revokeUnconfirmed(
  entries: readonly WorkspaceEntry[],
  appKey: string,
  response: WorkspacesResponse | undefined,
): void {
  const remove = new Set(response?.remove ?? []);
  const keep = new Set(response?.keep ?? []);
  for (const entry of entries) {
    if (entry.appKey !== appKey || entry.status !== 'ended') continue;
    const matches =
      response?.decisions?.filter(
        (item) =>
          item.reportId === entry.reportId &&
          item.workDir === entry.workDir &&
          item.runId === entry.lastRunId &&
          item.lastUsedAt === entry.lastUsedAt,
      ) ?? [];
    const latest = matches.length === 1 ? matches[0] : undefined;
    const confirmed =
      latest !== undefined
        ? latest.settled === true
        : entry.decision?.settled !== true &&
          entry.lastRunId !== undefined &&
          remove.has(entry.lastRunId);
    if (confirmed) continue;
    entry.status =
      latest?.settled === false ||
      (latest === undefined &&
        entry.lastRunId !== undefined &&
        keep.has(entry.lastRunId))
        ? 'active'
        : 'unknown';
    if (latest === undefined) delete entry.decision;
    else entry.decision = latest;
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
  /** Pressure may reclaim clean pushed idle directories even while the subject's work continues. */
  readonly pressure?: boolean;
  readonly now?: number;
  /** Pick by these instead of the default rules. */
  readonly filters?: WorkspaceFilters;
  /** Remove picked directories with unpushed work whose work is not over too. */
  readonly force?: boolean;
}

export type PlanReason = 'ended' | 'selected' | 'readOnly';

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
 * Which directories go. By default: those whose work is over, least recently used first; under pressure, then every
 * other one. With filters: the directories every filter matches. A directory a run holds is never removed, nor one
 * with unpushed work whose work is not over, unless forced.
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
    else if (
      entry.unpushed &&
      entry.status !== 'ended' &&
      options.force !== true
    )
      kept.push({ entry, reason: 'unpushed' });
    else remove.push({ entry, reason });
  };
  const filters = options.filters;
  const ended = entries
    .filter((entry) => entry.status === 'ended')
    .sort((a, b) => Date.parse(a.lastUsedAt) - Date.parse(b.lastUsedAt));
  if (!filtered(filters)) for (const entry of ended) pick(entry, 'ended');
  if (options.pressure || filtered(filters)) {
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
  for (const entry of entries)
    if (entry.disposable === true) pick(entry, 'readOnly');
    else if (entry.removing === true) pick(entry, 'selected');
  return { remove, kept };
}

/**
 * Removes a planned directory, under its lock: unless a run took it, or used it since it was checked, or its work is
 * not over and (not forced) it has unpushed work now. Returns why it was kept, or undefined when it was removed.
 */
export async function removePlanned(
  paths: RunnerPaths,
  entry: WorkspaceEntry,
  options: { force?: boolean; log?: (message: string) => void } = {},
): Promise<'inUse' | 'changed' | 'unpushed' | 'cleanupFailed' | undefined> {
  let lock: Lock;
  try {
    lock = await acquireLock(`${entry.workDir}.lock`, { timeoutMs: 0 });
  } catch {
    return 'inUse';
  }
  try {
    const meta = await readWorkspaceMeta(paths, entry.workDir);
    if (
      meta !== undefined &&
      (meta.lastUsedAt !== entry.lastUsedAt ||
        meta.lastRunId !== entry.lastRunId)
    )
      return 'changed';
    if (entry.status === 'ended')
      return await discardEnded(paths, entry.workDir, meta);
    if (
      meta !== undefined &&
      (await canRetryWorkspaceRemoval(paths, entry.workDir, meta))
    )
      return (await retryWorkspaceRemoval(
        paths,
        entry.workDir,
        options.log ?? (() => {}),
        true,
      ))
        ? undefined
        : 'cleanupFailed';
    if (isDisposableWorkspace(entry.workDir, meta)) {
      if (
        meta !== undefined &&
        (meta.lastUsedAt !== entry.lastUsedAt ||
          meta.lastRunId !== entry.lastRunId)
      )
        return 'changed';

      await removeWorkspace(paths, entry.workDir, meta ?? { repos: [] });
      return undefined;
    }
    if (meta === undefined) return 'changed';
    if (
      meta.runWorktrees === true ||
      meta.recoveryRequired === true ||
      (meta.continuationOnly === true &&
        (meta.activeWorkDirs ?? []).some((dir) => existsSync(dir)))
    )
      return 'unpushed';
    if (
      meta.lastUsedAt !== entry.lastUsedAt ||
      meta.lastRunId !== entry.lastRunId
    )
      return 'changed';
    if (
      options.force !== true &&
      (await checkWorkspaceGit(entry.workDir, meta, options.log)).reason !==
        'allowed'
    ) {
      await writeWorkspaceMeta(paths, entry.workDir, {
        ...meta,
        unpushed: true,
      }).catch((error: unknown) =>
        options.log?.(
          `workspaces: diagnostic cache write failed for ${entry.workDir}: ${String(error)}`,
        ),
      );
      return 'unpushed';
    }
    await removeWorkspace(paths, entry.workDir, meta);
    return undefined;
  } finally {
    await lock.release();
  }
}

/**
 * Removes a directory whose work is over, whatever it holds, the caller holding its lock. A subject's continuation state
 * takes its attempt directories, saved and resume refs and session directories with it, unless a run holds an attempt.
 */
async function discardEnded(
  paths: RunnerPaths,
  workDir: string,
  meta: WorkspaceMeta | undefined,
): Promise<'inUse' | undefined> {
  if (meta?.continuationOnly !== true) {
    await discardDirectory(paths, workDir, meta);
    return undefined;
  }
  for (const dir of meta.activeWorkDirs ?? []) {
    if (!existsSync(dir) || !isInside(paths.workRoot, dir)) continue;
    let lock: Lock;
    try {
      lock = await acquireLock(`${dir}.lock`, { timeoutMs: 0 });
    } catch {
      return 'inUse';
    }
    try {
      await discardDirectory(paths, dir, await readWorkspaceMeta(paths, dir));
    } finally {
      await lock.release();
    }
  }
  await clearContinuations(paths, workDir, meta);
  return undefined;
}

/** Unregisters a directory's checkouts and its run branches from their caches, then deletes it and its record. */
async function discardDirectory(
  paths: RunnerPaths,
  workDir: string,
  meta: WorkspaceMeta | undefined,
): Promise<void> {
  for (const repo of meta?.repos ?? []) {
    const dir = path.join(workDir, repo.path);
    if (!isInside(workDir, dir) || dir === path.resolve(workDir)) continue;
    if (!existsSync(repo.cache)) continue;
    const lock = await lockCache(repo.cache);
    try {
      await gitOk(['worktree', 'remove', '--force', dir], repo.cache);
      await rm(dir, { recursive: true, force: true });
      await gitOk(['worktree', 'prune'], repo.cache);
      if (
        meta?.runWorktrees === true &&
        repo.localBranch === runBranch(workDir, repo.path)
      )
        await git(
          ['update-ref', '-d', `refs/heads/${repo.localBranch}`],
          repo.cache,
        ).catch(() => '');
    } finally {
      await lock.release();
    }
  }
  await rm(workDir, { recursive: true, force: true });
  await rm(workspaceRecordPath(paths, workDir), { force: true });
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
    `${unpushed} with unpushed work remain; new work pauses until space recovers. ` +
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
  /** Regenerable build artifacts of directories unused this long go (core/artifacts.ts); none when absent. */
  readonly artifacts?: Pick<ArtifactOptions, 'ttlMs' | 'patterns'>;
}

export interface CollectResult {
  /** This pass started under disk pressure; retention must not continue after it recovers. */
  readonly pressure: boolean;
  readonly removed: { workDir: string; reason: PlanReason }[];
  readonly kept: { workDir: string; reason: string }[];
  readonly entries: WorkspaceEntry[];
  readonly plan: WorkspacePlan;
  /** The disk once done; undefined when it cannot be read. */
  readonly disk: DiskSpace | undefined;
  /** Less than the threshold is still free. */
  readonly low: boolean;
  /** The directories whose regenerable build artifacts were removed. */
  readonly artifactsCleaned: string[];
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
  const before = await read(paths.workRoot);
  const entries = await scanWorkspaces(paths, {
    force: lowOnDisk(before, threshold),
    ...(options.now === undefined ? {} : { now: options.now }),
    ...(log === undefined ? {} : { log }),
  });
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
      // Publish the local check against the prior decision, before attempting deletion. The answer can only take a
      // removal back: the plan and its locked check keep the original evidence, so a later answer that no longer says
      // the work is over cancels it rather than granting anything new.
      if (options.decisionApps?.has(appKey) === true) {
        let confirmation: WorkspacesResponse | undefined;
        try {
          confirmation = await report(
            workspacesRequest(entries, appKey, disk, true),
          );
        } finally {
          revokeUnconfirmed(entries, appKey, confirmation);
        }
      }
    } catch (error) {
      log?.(
        `${appKey}: workspace report failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  const pressure = lowOnDisk(before, threshold);
  const recovered = async (): Promise<boolean> =>
    !lowOnDisk(await read(paths.workRoot), threshold);
  const artifactsCleaned =
    options.artifacts === undefined
      ? []
      : await cleanArtifacts(entries, {
          paths,
          ...options.artifacts,
          ...(options.now === undefined ? {} : { now: options.now }),
          ...(log === undefined ? {} : { log }),
          ...(pressure ? { pressure: true, shouldStop: recovered } : {}),
        });
  const plan = planRemovals(entries, { pressure });
  // Ended directories go first and all of them; then ordinary workspaces before disposable read-only copies, oldest
  // first within each phase.
  plan.remove.sort(
    (a, b) =>
      Number(a.reason !== 'ended') - Number(b.reason !== 'ended') ||
      Number(a.entry.disposable === true) -
        Number(b.entry.disposable === true) ||
      Date.parse(a.entry.lastUsedAt) - Date.parse(b.entry.lastUsedAt),
  );
  const removed: CollectResult['removed'] = [];
  const kept: CollectResult['kept'] = plan.kept.map(({ entry, reason }) => ({
    workDir: entry.workDir,
    reason,
  }));
  for (const { entry, reason } of plan.remove) {
    if (pressure && reason !== 'ended' && (await recovered())) break;
    const why = await removePlanned(
      paths,
      entry,
      log === undefined ? {} : { log },
    ).catch((error: unknown) => {
      log?.(
        `workspaces: cleanup failed for ${entry.workDir}; retrying next GC: ${String(error)}`,
      );
      return 'cleanupFailed' as const;
    });
    if (why === undefined) {
      removed.push({ workDir: entry.workDir, reason });
      log?.(
        `workspaces: removed ${entry.workDir} (${reason === 'ended' ? `its work is over${entry.unpushed ? '; it held work that was never pushed' : ''}` : 'disk pressure'})`,
      );
    } else kept.push({ workDir: entry.workDir, reason: why });
  }
  const gone = new Set(removed.map((item) => item.workDir));
  const after = await read(paths.workRoot);
  const warning = lowDiskWarning(
    entries.filter((entry) => !gone.has(entry.workDir)),
    after,
    threshold,
  );
  if (warning !== undefined) log?.(`workspaces: ${warning}`);
  return {
    pressure,
    removed,
    kept,
    entries,
    plan,
    disk: after,
    low: warning !== undefined,
    artifactsCleaned,
  };
}
