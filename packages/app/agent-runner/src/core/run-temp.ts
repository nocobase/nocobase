import { createHash } from 'node:crypto';
import { chmod, lstat, mkdir, readdir, realpath, rm } from 'node:fs/promises';
import path from 'node:path';

import type { RunnerPaths } from '../lib/home.ts';
import { acquireLock, type Lock } from './checkout.ts';
import { readRecords } from './supervisor.ts';
import { listWorkspaceDirs } from './workspaces.ts';
import { workspaceHolders } from './process-tree.ts';

const hash = (value: string, length: number): string =>
  createHash('sha256').update(value).digest('hex').slice(0, length);

const formatMode = (mode: number): string =>
  `0${(mode & 0o7777).toString(8).padStart(3, '0')}`;

async function privateDirectory(
  dir: string,
  options: { checkLength?: boolean; repairMode?: boolean } = {},
): Promise<void> {
  const checkLength = options.checkLength ?? true;
  const repairMode = options.repairMode ?? false;
  const expectedUid = process.getuid?.();
  let stat = await lstat(dir);
  if (!stat.isDirectory()) {
    const kind = stat.isSymbolicLink() ? 'symbolic link' : 'not a directory';
    throw new Error(`Unsafe run temporary directory: ${dir} (${kind})`);
  }
  if (stat.uid !== expectedUid)
    throw new Error(
      `Unsafe run temporary directory: ${dir} (owned by uid ${stat.uid}, expected ${expectedUid})`,
    );
  const perms = stat.mode & 0o7777;
  if (perms !== 0o700) {
    // Only tighten non-group/other-writable drift (e.g. 0755 or inherited setgid) during allocation.
    if (!repairMode || (perms & 0o022) !== 0)
      throw new Error(
        `Unsafe run temporary directory: ${dir} (mode ${formatMode(stat.mode)}, expected 0700)`,
      );
    try {
      await chmod(dir, 0o700);
      stat = await lstat(dir);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Unsafe run temporary directory: ${dir} (mode ${formatMode(stat.mode)}, expected 0700; chmod failed: ${reason})`,
        { cause: error },
      );
    }
    if (!stat.isDirectory()) {
      const kind = stat.isSymbolicLink() ? 'symbolic link' : 'not a directory';
      throw new Error(`Unsafe run temporary directory: ${dir} (${kind})`);
    }
    if (stat.uid !== expectedUid)
      throw new Error(
        `Unsafe run temporary directory: ${dir} (owned by uid ${stat.uid}, expected ${expectedUid})`,
      );
    if ((stat.mode & 0o7777) !== 0o700)
      throw new Error(
        `Unsafe run temporary directory: ${dir} (mode ${formatMode(stat.mode)}, expected 0700)`,
      );
  }
  if (
    checkLength &&
    (Buffer.byteLength(dir) > 40 || Buffer.byteLength(await realpath(dir)) > 40)
  )
    throw new Error(`Run temporary directory exceeds 40 bytes: ${dir}`);
}

/** Independent of inherited TMPDIR and the length of the runner's home. */
export async function runTempRoot(paths: RunnerPaths): Promise<string> {
  if (process.platform !== 'linux' && process.platform !== 'darwin')
    throw new Error('Short run temporary directories require Linux or macOS.');
  const home = await realpath(paths.home);
  return `/tmp/n-${hash(`${process.getuid!()}:${home}`, 8)}`;
}

export function runTempName(workDir: string): string {
  return hash(path.resolve(workDir), 16);
}

async function ensureRoot(paths: RunnerPaths): Promise<string> {
  const root = await runTempRoot(paths);
  await mkdir(root, { mode: 0o700 }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'EEXIST') throw error;
  });
  await privateDirectory(root, { repairMode: true });
  return root;
}

/** Validate existing lock directories before the shared lock helper inspects or reclaims them. */
async function tempLock(dir: string, timeoutMs = 0): Promise<Lock> {
  try {
    await privateDirectory(`${dir}.lock`, { checkLength: false });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  return acquireLock(`${dir}.lock`, { timeoutMs });
}

export interface RunTemp {
  dir: string;
  lock: Lock;
}

/** Hold this lock until writers stop and cleanup finishes, including preparation failures. */
export async function allocateRunTemp(
  paths: RunnerPaths,
  workDir: string,
): Promise<RunTemp> {
  const root = await ensureRoot(paths);
  const dir = path.join(root, runTempName(workDir));
  const lock = await tempLock(dir);
  let created = false;
  try {
    await mkdir(dir, { mode: 0o700 });
    created = true;
    await privateDirectory(dir, { repairMode: true });
    return { dir, lock };
  } catch (error) {
    if (created) await rm(dir, { recursive: true, force: true });
    await lock.release();
    throw error;
  }
}

/** Caller holds the temporary directory lock and has confirmed writers stopped. */
export async function removeRunTemp(dir: string): Promise<void> {
  try {
    await privateDirectory(path.dirname(dir));
    await privateDirectory(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  await rm(dir, { recursive: true, force: true });
}

export async function cleanupRunTemp(
  paths: RunnerPaths,
  workDir: string,
): Promise<void> {
  const root = await runTempRoot(paths);
  try {
    await privateDirectory(root);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  const dir = path.join(root, runTempName(workDir));
  // GC may hold this lock briefly while it checks the still-present run record.
  const lock = await tempLock(dir, 2_000);
  try {
    await removeRunTemp(dir);
  } finally {
    await lock.release();
  }
}

/** Only our private namespace; re-read records and protected workspace metadata under each lock. */
export async function gcRunTemps(
  paths: RunnerPaths,
  apply: boolean,
): Promise<{ dir: string; removed: boolean }[]> {
  const root = await runTempRoot(paths);
  try {
    await privateDirectory(root);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const results: { dir: string; removed: boolean }[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^[a-f0-9]{16}$/.test(entry.name)) continue;
    const dir = path.join(root, entry.name);
    try {
      await privateDirectory(dir);
    } catch {
      continue;
    }
    let lock: Lock;
    try {
      lock = await tempLock(dir);
    } catch {
      continue;
    }
    try {
      try {
        await privateDirectory(dir);
      } catch {
        // A worker may have removed it before GC acquired its released lock.
        continue;
      }
      const records = await readRecords(paths);
      if (
        records.some(
          (r) =>
            r.kind !== 'job' &&
            r.workDir !== undefined &&
            runTempName(r.privateDir ?? r.workDir) === entry.name,
        )
      )
        continue;
      const workspaces = (await listWorkspaceDirs(paths)).filter(
        (w) => runTempName(w.workDir) === entry.name,
      );
      if (workspaces.some((w) => w.meta.recoveryRequired === true)) continue;
      if ((await workspaceHolders(dir, true)).length > 0) continue;
      let held = false;
      for (const w of workspaces)
        if ((await workspaceHolders(w.workDir, true)).length > 0) held = true;
      if (held) continue;
      if (apply) await removeRunTemp(dir);
      results.push({ dir, removed: apply });
    } finally {
      await lock.release();
    }
  }
  return results;
}
