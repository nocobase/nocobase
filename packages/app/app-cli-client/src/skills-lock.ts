import { randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rmdir,
  unlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { EXIT_CODES } from '@nocobase/agent-protocol';

import { CliCommandError } from './lib/envelope.ts';

interface LockOwner {
  pid: number;
  hostname: string;
  startedAt: string;
}

const OWNER_NAME = /^owner-[0-9a-f-]{36}\.json$/;
const LOCK_WAIT_MS = 30_000;
const LEGACY_LOCK_AGE_MS = 10 * 60_000;

// An empty directory can be replaced between any two calls. Never remove a
// directory recursively, and never reuse an owner filename across acquisitions.
async function removeEmptyLock(file: string): Promise<void> {
  try {
    await rmdir(file);
  } catch (error) {
    if (
      !['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(
        (error as NodeJS.ErrnoException).code ?? '',
      )
    )
      throw error;
  }
}

async function inspectLock(file: string): Promise<string> {
  const info = await lstat(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (info === undefined) return 'The previous operation has finished.';
  if (!info.isDirectory() || info.isSymbolicLink())
    return 'The lock is not a regular directory; it was left unchanged.';
  const entries = await readdir(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  if (entries.length === 0) {
    return Date.now() - info.mtimeMs >= LEGACY_LOCK_AGE_MS
      ? 'This unowned lock is over 10 minutes old, but its holder cannot be verified. Stop all CLI and bridge processes, then move this empty directory aside with your file manager and retry.'
      : 'The lock has no owner record yet. Wait for the operation to finish and retry. If it was interrupted, stop all CLI and bridge processes, then move this empty directory aside with your file manager.';
  }
  let description =
    'The owner could not be verified; the lock was left unchanged. Stop all CLI and bridge processes before moving this directory aside with your file manager.';
  for (const entry of entries) {
    if (!OWNER_NAME.test(entry)) continue;
    const marker = path.join(file, entry);
    let owner: LockOwner;
    try {
      const metadata = await lstat(marker);
      if (!metadata.isFile() || metadata.isSymbolicLink()) continue;
      owner = JSON.parse(await readFile(marker, 'utf8')) as LockOwner;
      if (
        !Number.isSafeInteger(owner.pid) ||
        owner.pid <= 0 ||
        typeof owner.hostname !== 'string' ||
        typeof owner.startedAt !== 'string'
      )
        continue;
    } catch {
      // Missing, incomplete and unknown records never authorize deletion.
      continue;
    }
    description = `Process ${owner.pid} on ${owner.hostname} has held the lock since ${owner.startedAt}. Wait for it to finish, or stop that process and retry.`;
    if (owner.hostname !== os.hostname()) {
      description +=
        ' Its process cannot be verified on this computer. Confirm that it has stopped on that host before moving the lock directory aside with your file manager.';
      continue;
    }
    try {
      process.kill(owner.pid, 0);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') continue;
      try {
        // Only one reaper can unlink this generation's record. A delayed
        // reaper cannot unlink a later owner's differently named record.
        await unlink(marker);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
        throw error;
      }
      await removeEmptyLock(file);
    }
  }
  return description;
}

export async function withSkillLock<T>(
  file: string,
  work: () => Promise<T>,
  timeoutMs: number = LOCK_WAIT_MS,
): Promise<T> {
  await mkdir(path.dirname(file), { recursive: true });
  const deadline = performance.now() + timeoutMs;
  let interval = 25;
  for (;;) {
    let created = false;
    try {
      await mkdir(file);
      created = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    if (created) {
      const name = `owner-${randomUUID()}.json`;
      const marker = path.join(file, name);
      let acquired = false;
      try {
        await writeFile(
          marker,
          JSON.stringify({
            pid: process.pid,
            hostname: os.hostname(),
            startedAt: new Date().toISOString(),
          } satisfies LockOwner),
          { flag: 'wx', mode: 0o600 },
        );
        // A delayed empty-directory cleanup may have replaced the directory
        // during initialization. Only a sole published owner may start work;
        // every colliding initializer withdraws rather than electing a winner.
        const entries = await readdir(file);
        acquired = entries.length === 1 && entries[0] === name;
        if (!acquired) {
          await unlink(marker);
          await removeEmptyLock(file);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      if (acquired) {
        try {
          return await work();
        } finally {
          await unlink(marker);
          await removeEmptyLock(file);
        }
      }
    }
    const description = await inspectLock(file);
    const remaining = deadline - performance.now();
    if (remaining <= 0)
      throw new CliCommandError(
        'SKILLS_BUSY',
        `Timed out after 30 seconds waiting for the Skill lock at ${file}. ${description}`,
        { exit: EXIT_CODES.conflict },
      );
    await delay(Math.min(interval, remaining));
    interval = Math.min(interval * 2, 250);
  }
}
