// Usage records protect cleanup without restricting concurrent entry.
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, realpath, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { writeJsonAtomic, type RunnerPaths } from '../lib/home.ts';
import { isAlive } from './supervisor.ts';
import { delay } from '../lib/http.ts';

async function recordsDir(paths: RunnerPaths, dir: string): Promise<string> {
  // Startup registers before mkdir. Resolve the nearest existing ancestor so creating a directory under a
  // symlinked work root does not change its registry identity.
  let ancestor = path.resolve(dir);
  const suffix: string[] = [];
  let canonical: string;
  for (;;) {
    try {
      canonical = path.join(await realpath(ancestor), ...suffix);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      suffix.unshift(path.basename(ancestor));
      ancestor = path.dirname(ancestor);
    }
  }
  return path.join(
    paths.home,
    'workspace-users',
    createHash('sha256').update(canonical).digest('hex'),
  );
}

export async function registerWorkspaceUse(
  paths: RunnerPaths,
  dir: string,
  runId: string,
  pid: number = process.pid,
): Promise<() => Promise<void>> {
  const root = await recordsDir(paths, dir);
  await mkdir(root, { recursive: true, mode: 0o700 });
  const file = path.join(root, `${pid}-${randomUUID()}.json`);
  await writeJsonAtomic(file, { runId, pid });
  return () => rm(file, { force: true });
}

export async function workspaceInUse(
  paths: RunnerPaths,
  dir: string,
  ignoreRunId?: string,
): Promise<boolean> {
  const root = await recordsDir(paths, dir);
  for (const name of await readdir(root).catch(() => [])) {
    if (!name.endsWith('.json')) continue;
    const file = path.join(root, name);
    try {
      const record = JSON.parse(await readFile(file, 'utf8')) as {
        runId?: string;
        pid?: number;
        protectedUntil?: number;
      };
      if (ignoreRunId !== undefined && record.runId === ignoreRunId) continue;
      if (record.pid && isAlive(record.pid)) return true;
      if (record.protectedUntil && Date.now() < record.protectedUntil)
        return true;
      await rm(file, { force: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      const pid = Number(name.split('-')[0]);
      if (pid > 0 && !isAlive(pid)) await rm(file, { force: true });
      else return true;
    }
  }
  return false;
}

/** Observe the existing cleanup mutex without acquiring a run lock. Register before calling this. */
export async function waitForWorkspaceCleanup(dir: string): Promise<void> {
  const lock = `${dir}.lock`;
  const deadline = Date.now() + 30_000;
  for (;;) {
    const info = await stat(lock).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
      return undefined;
    });
    if (!info) return;
    const owner = Number(
      await readFile(path.join(lock, 'owner'), 'utf8').catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
          return '';
        },
      ),
    );
    if (
      (owner > 0 && !isAlive(owner)) ||
      (!owner && Date.now() - info.mtimeMs > 5_000)
    )
      return;
    if (Date.now() >= deadline)
      throw new Error(`Workspace cleanup is still running: ${dir}`);
    await delay(20);
  }
}

export async function protectUpgradeWorkspace(
  paths: RunnerPaths,
  dir: string,
  runId: string,
): Promise<void> {
  const root = await recordsDir(paths, dir);
  await mkdir(root, { recursive: true, mode: 0o700 });
  await writeJsonAtomic(path.join(root, `upgrade-${runId}.json`), {
    runId,
    protectedUntil: Date.now() + 5 * 60_000,
  });
}
