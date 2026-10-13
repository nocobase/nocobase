// What the runner keeps in its work root, and when a working directory may go.
//
// The runner's record of each subject's working directory (`<work root>/<app>/<subjectKey>/`, kept out of the agent's
// reach by checkout.ts) holds the last run that worked there (`lastRunId`) and whether it holds unpushed work
// (`hasUnpushedWork`): changes not committed, or a HEAD past both where the runner started the checkout and what it
// last saw the remote task branch hold. It is never judged from the default branch's history, so a branch merged with
// a squash is not unpushed once it was pushed.
//
// The runner cannot tell on its own when the work on a subject is over. An application that accepts reports
// (`HeartbeatResponse.workspaces`) is told about each of its directories and answers which runs belong to subjects
// whose work is over (`WorkspacesResponse.remove`, or a directory's `WorkspaceDecision`); those directories go, least
// recently used first, whatever they still hold: once the work on a subject is over its checkout is not kept for
// commits or changes never pushed, which are logged as they go. Nothing else goes
// on its own: a pushed directory whose work goes on is still that subject's checkout. The runner watches the disk
// holding them (`RunnerSettings.minFreeDisk`, 5 GB free by default), reading the free space from the file system
// (`statfs`) rather than measuring directories, which meant reading every file under every `node_modules`; when it is
// still low once the directories whose work is over are gone, it says once per pass what is left and that
// `nocobase-runner gc` can remove it. A directory a run holds (its lock is taken), or one a run used since it was
// reported, is never touched, and a removal the application's second answer no longer confirms is taken back. A
// directory whose work goes on, or whose status is unknown, with unpushed work is only ever removed when a person
// forces it (`nocobase-runner gc --force`). A directory whose work goes on loses only its regenerable build artifacts
// once no run has used it for a while (core/artifacts.ts).
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile, stat, statfs } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  cleanupWorkspace,
  isReadOnlyWorkspace,
  legacyReadOnlyKey,
} from './workspace-cleanup.ts';
import { workspaceWriters } from './writer-ownership.ts';
import { workspaceRecordPath } from './checkout.ts';

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
  readWorkspaceMeta,
  removeWorkspace,
  writeWorkspaceMeta,
  type Lock,
  type WorkspaceMeta,
} from './checkout.ts';
import { cleanArtifacts, type ArtifactOptions } from './artifacts.ts';
import { isAlive } from './supervisor.ts';

export { hasUnpushedWork } from './checkout.ts';

/** What the application said about a directory's last run. */
export type WorkspaceStatus = 'ended' | 'active' | 'unknown';

export interface WorkspaceEntry {
  disposable?: boolean;
  gitCheck?: WorkspaceMeta['gitCheck'];
  sizeBytes?: number;
  sizeMeasuredAt?: string;
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
      const meta =
        (await readWorkspaceMeta(paths, workDir)) ??
        (legacyReadOnlyKey(paths, workDir) === undefined
          ? undefined
          : {
              subjectKey: legacyReadOnlyKey(paths, workDir)!,
              appKey: app.name,
              repos: [],
              readOnly: true,
              lastUsedAt: (await stat(workDir)).mtime.toISOString(),
            });
      if (meta !== undefined) found.push({ workDir, meta });
    }
  }
  // A cleanup intent survives even after the directory has gone.
  for (const file of await readdir(paths.workspacesDir).catch(
    () => [] as string[],
  )) {
    if (!file.endsWith('.json')) continue;
    const raw = await readFile(path.join(paths.workspacesDir, file), 'utf8')
      .then((text) => JSON.parse(text) as Record<string, unknown>)
      .catch(() => undefined);
    if (
      raw?.cleanupPending !== true ||
      typeof raw.workDir !== 'string' ||
      path.relative(paths.workRoot, raw.workDir).split(path.sep).length !== 2 ||
      path.basename(workspaceRecordPath(paths, raw.workDir)) !== file ||
      found.some((item) => item.workDir === raw.workDir)
    )
      continue;
    const meta = await readWorkspaceMeta(paths, raw.workDir);
    if (meta !== undefined) found.push({ workDir: raw.workDir, meta });
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
  let inUse = await isLocked(workDir);
  const checkedAt =
    meta.measuredAt === undefined ? Number.NaN : Date.parse(meta.measuredAt);
  const stale =
    options.force === true ||
    meta.unpushed === undefined ||
    (meta.gitCheck !== undefined &&
      (!Number.isFinite(Date.parse(meta.gitCheck.checkedAt)) ||
        now - Date.parse(meta.gitCheck.checkedAt) > 10 * 60_000)) ||
    !Number.isFinite(checkedAt) ||
    Date.parse(meta.lastUsedAt) >= checkedAt;
  let unpushed = meta.unpushed ?? false;
  let gitCheck = meta.gitCheck;
  let sizeBytes = meta.sizeBytes;
  let sizeMeasuredAt = meta.sizeMeasuredAt;
  if (stale && !inUse) {
    let lock: Lock | undefined;
    try {
      lock = await acquireLock(`${workDir}.lock`, { timeoutMs: 0 });
    } catch {
      inUse = true;
    }
    if (lock !== undefined)
      try {
        const current = await readWorkspaceMeta(paths, workDir);
        if (
          (current === undefined &&
            legacyReadOnlyKey(paths, workDir) === undefined) ||
          (current !== undefined &&
            (current.lastUsedAt !== meta.lastUsedAt ||
              current.lastRunId !== meta.lastRunId))
        ) {
          inUse = true;
        } else {
          const check = await checkWorkspaceGit(workDir, meta, options.log);
          unpushed = check.reason !== 'allowed';
          gitCheck =
            check.reason === 'gitFailed'
              ? { reason: 'gitFailed', checkedAt: new Date(now).toISOString() }
              : undefined;
          if (
            gitCheck !== undefined &&
            (sizeMeasuredAt === undefined ||
              now - Date.parse(sizeMeasuredAt) > 60 * 60_000)
          ) {
            sizeBytes = await measureWorkspaceSize(workDir);
            sizeMeasuredAt = new Date(now).toISOString();
          }
          await writeWorkspaceMeta(paths, workDir, {
            ...(current ?? meta),
            unpushed,
            measuredAt: new Date(now).toISOString(),
            gitCheck,
            sizeBytes,
            sizeMeasuredAt,
          });
        }
      } finally {
        await lock.release();
      }
  }
  return {
    workDir,
    appKey: meta.appKey ?? path.basename(path.dirname(workDir)),
    subjectKey: meta.subjectKey,
    ...(meta.lastRunId === undefined ? {} : { lastRunId: meta.lastRunId }),
    lastUsedAt: meta.lastUsedAt,
    unpushed,
    ...(gitCheck === undefined ? {} : { gitCheck }),
    ...(sizeBytes === undefined ? {} : { sizeBytes }),
    ...(sizeMeasuredAt === undefined ? {} : { sizeMeasuredAt }),
    disposable:
      (isReadOnlyWorkspace(paths, workDir, meta) &&
        meta.writersStopped !== false &&
        (meta.runAttempt !== true || meta.writersStopped === true) &&
        (meta.recoveryRequired !== true || meta.cleanupPending === true)) ||
      (meta.cleanupPending === true &&
        meta.writersStopped === true &&
        gitCheck === undefined),
    inUse,
    status: 'unknown',
  };
}

/** Bound expensive measurements and cache failures as unknown, never zero. du does not follow symbolic links. */
async function measureWorkspaceSize(
  workDir: string,
): Promise<number | undefined> {
  try {
    const { stdout } = await promisify(execFile)('du', ['-sk', '--', workDir], {
      timeout: 2_000,
      maxBuffer: 4096,
    });
    const value = Number(stdout.trim().split(/\s/u)[0]) * 1024;
    return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
  } catch {
    return undefined;
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
        ...(entry.gitCheck === undefined ? {} : { gitCheck: entry.gitCheck }),
        ...(entry.sizeBytes === undefined
          ? {}
          : { sizeBytes: entry.sizeBytes }),
        ...(entry.sizeMeasuredAt === undefined
          ? {}
          : { sizeMeasuredAt: entry.sizeMeasuredAt }),
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
 * not taken as ended; one whose work is over is not checked for unpushed work again, as that no longer keeps it.
 */
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
    // The work is over: the directory goes whatever it holds, so its Git state is not checked again.
    entry.cleanup = {
      reportId: decision.reportId,
      reason: entry.inUse
        ? 'inUse'
        : entry.gitCheck?.reason === 'gitFailed'
          ? 'gitFailed'
          : 'allowed',
      discardsUntracked: !entry.inUse && entry.unpushed,
    };
    if (!entry.inUse && entry.unpushed)
      log?.(
        `workspaces: ${entry.workDir}: its work is over; cleanup will discard work that was never pushed`,
      );
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
 * Which directories go. By default: those whose work is over, least recently used first. With filters: the directories
 * every filter matches. A directory a run holds is never removed, nor one with unpushed work unless a directory
 * decision confirms its work is over or the removal is forced. Legacy remove replies retain the unpushed-work protection.
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
      entry.gitCheck?.reason === 'gitFailed' &&
      !entry.disposable &&
      options.force !== true
    )
      kept.push({ entry, reason: 'unpushed' });
    else if (
      entry.unpushed &&
      !entry.disposable &&
      entry.decision?.settled !== true &&
      options.force !== true
    )
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
    .filter((entry) => entry.status === 'ended' || entry.disposable)
    .sort((a, b) => Date.parse(a.lastUsedAt) - Date.parse(b.lastUsedAt));
  for (const entry of ended) pick(entry, 'ended');
  return { remove, kept };
}

/**
 * Removes a planned directory, under its lock: unless a run took it, or used it since it was checked, or (not forced,
 * and no settled directory decision) it has unpushed work now. Returns why it was kept, or undefined when it was removed.
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
    const meta =
      (await readWorkspaceMeta(paths, entry.workDir)) ??
      (legacyReadOnlyKey(paths, entry.workDir) === undefined
        ? undefined
        : {
            appKey: entry.appKey,
            subjectKey: entry.subjectKey,
            repos: [],
            readOnly: true,
            lastUsedAt: entry.lastUsedAt,
          });
    if (meta === undefined) return 'changed';
    const disposable =
      (isReadOnlyWorkspace(paths, entry.workDir, meta) &&
        meta.writersStopped !== false &&
        (meta.runAttempt !== true || meta.writersStopped === true) &&
        (meta.recoveryRequired !== true || meta.cleanupPending === true)) ||
      (meta.cleanupPending === true &&
        meta.writersStopped === true &&
        (await checkWorkspaceGit(entry.workDir, meta, options.log)).reason !==
          'gitFailed');
    if (disposable) {
      if (
        meta.lastUsedAt !== entry.lastUsedAt ||
        meta.lastRunId !== entry.lastRunId
      )
        return 'changed';
      if ((await workspaceWriters(entry.workDir)).length > 0) return 'inUse';
      if (meta.writersStopped !== true) {
        for (const name of await readdir(paths.runsDir).catch(
          () => [] as string[],
        )) {
          if (!name.endsWith('.json')) continue;
          const record = await readFile(path.join(paths.runsDir, name), 'utf8')
            .then((text) => JSON.parse(text) as { workDir?: string })
            .catch(() => undefined);
          if (record?.workDir === entry.workDir) {
            options.log?.(
              `workspaces: kept ${entry.workDir}: orphan writer ownership is unverified`,
            );
            return 'inUse';
          }
        }
      }
      await cleanupWorkspace(paths, entry.workDir, meta, options.log);
      return undefined;
    }
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
    const check = await checkWorkspaceGit(entry.workDir, meta, options.log);
    if (
      options.force !== true &&
      (check.reason === 'gitFailed' ||
        (entry.decision?.settled !== true && check.reason !== 'allowed'))
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
  /** Regenerable build artifacts of directories unused this long go (core/artifacts.ts); none when absent. */
  readonly artifacts?: Pick<ArtifactOptions, 'ttlMs' | 'patterns'>;
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
  const plan = planRemovals(entries, {
    ...(options.now === undefined ? {} : { now: options.now }),
  });
  const removed: CollectResult['removed'] = [];
  const kept: CollectResult['kept'] = plan.kept.map(({ entry, reason }) => ({
    workDir: entry.workDir,
    reason,
  }));
  for (const { entry, reason } of plan.remove) {
    let why: Awaited<ReturnType<typeof removePlanned>>;
    try {
      why = await removePlanned(paths, entry, log === undefined ? {} : { log });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      kept.push({
        workDir: entry.workDir,
        reason: `cleanupPending: ${message}`,
      });
      log?.(`workspaces: cleanup pending ${entry.workDir}: ${message}`);
      continue;
    }
    if (why === undefined) {
      removed.push({ workDir: entry.workDir, reason });
      log?.(
        `workspaces: removed ${entry.workDir} (its work is over${entry.unpushed ? '; it held work that was never pushed' : ''})`,
      );
    } else kept.push({ workDir: entry.workDir, reason: why });
  }
  const gone = new Set(removed.map((item) => item.workDir));
  const artifactsCleaned =
    options.artifacts === undefined
      ? []
      : await cleanArtifacts(
          entries.filter((entry) => !gone.has(entry.workDir)),
          {
            paths,
            ...options.artifacts,
            ...(options.now === undefined ? {} : { now: options.now }),
            ...(log === undefined ? {} : { log }),
          },
        );
  const after = await read(paths.workRoot);
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
    artifactsCleaned,
  };
}
