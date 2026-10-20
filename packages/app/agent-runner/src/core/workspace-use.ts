// Usage records protect cleanup without restricting concurrent entry.
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { writeJsonAtomic, type RunnerPaths } from '../lib/home.ts';
import { isAlive } from './supervisor.ts';

async function recordsDir(paths: RunnerPaths, dir: string): Promise<string> {
  const canonical = await realpath(dir).catch(() => path.resolve(dir));
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
): Promise<() => Promise<void>> {
  const root = await recordsDir(paths, dir);
  await mkdir(root, { recursive: true, mode: 0o700 });
  const file = path.join(root, `${process.pid}-${randomUUID()}.json`);
  await writeJsonAtomic(file, { runId, pid: process.pid });
  return () => rm(file, { force: true });
}

export async function workspaceInUse(
  paths: RunnerPaths,
  dir: string,
): Promise<boolean> {
  const root = await recordsDir(paths, dir);
  for (const name of await readdir(root).catch(() => [])) {
    if (!name.endsWith('.json')) continue;
    const file = path.join(root, name);
    try {
      const record = JSON.parse(await readFile(file, 'utf8')) as {
        pid?: number;
        protectedUntil?: number;
      };
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
