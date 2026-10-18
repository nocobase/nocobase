// A transient process record, not retry history: it exists while the launcher is alive, including during backoff.
import { linkSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { UsageError } from '../lib/command.ts';
import { readJson, type RunnerPaths } from '../lib/home.ts';
import { EXIT_CODES } from '../protocol/index.ts';
import { isAlive } from './supervisor.ts';

export interface LauncherPid {
  pid: number;
  startedAt: string;
}

export function launcherPidPath(paths: RunnerPaths): string {
  return path.join(paths.home, 'launcher.pid');
}

export async function readLauncherPid(
  paths: RunnerPaths,
): Promise<LauncherPid | undefined> {
  const record = await readJson<LauncherPid>(launcherPidPath(paths)).catch(
    () => undefined,
  );
  return record !== undefined &&
    Number.isInteger(record.pid) &&
    record.pid > 0 &&
    isAlive(record.pid)
    ? record
    : undefined;
}

/** Publish a complete record exclusively, so two launchers cannot supervise the same home. */
export async function claimLauncher(paths: RunnerPaths): Promise<() => void> {
  const file = launcherPidPath(paths);
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(
    temporary,
    JSON.stringify({
      pid: process.pid,
      startedAt: new Date().toISOString(),
    } satisfies LauncherPid),
    { mode: 0o600 },
  );
  try {
    for (;;) {
      try {
        linkSync(temporary, file);
        return () => rmSync(file, { force: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        const existing = await readLauncherPid(paths);
        if (existing !== undefined)
          throw new UsageError(
            `The runner launcher is already running (pid ${existing.pid}).`,
            EXIT_CODES.conflict,
          );
        rmSync(file, { force: true });
      }
    }
  } finally {
    rmSync(temporary, { force: true });
  }
}
