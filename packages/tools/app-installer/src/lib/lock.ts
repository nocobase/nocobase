import { link, readFile, rm, writeFile } from 'node:fs/promises';
import { EXIT_INVALID, InstallerError } from './errors.ts';

export type ReleaseLock = () => Promise<void>;

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but belongs to someone else.
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/**
 * Takes the root's lock so two installers never run against the same installation. The file holds the owner's pid; a lock whose
 * owner is gone is stale and is taken over rather than blocking every later run.
 *
 * The pid is written to a private file first and linked into place, so the lock never exists without its owner in it:
 * with `open('wx')` followed by a write, a second installer could read the still-empty file, take it for stale, and
 * proceed alongside the first.
 */
export async function acquireLock(file: string): Promise<ReleaseLock> {
  const candidate = `${file}.${process.pid}`;
  await writeFile(candidate, `${process.pid}\n`);
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await link(candidate, file);
        return async () => {
          await rm(file, { force: true });
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        const owner = Number.parseInt(
          (await readFile(file, 'utf8').catch(() => '')).trim(),
          10,
        );
        if (
          Number.isInteger(owner) &&
          owner !== process.pid &&
          isAlive(owner)
        ) {
          throw new InstallerError(
            'LOCKED',
            `Another app-installer (pid ${owner}) is working on this installation.`,
            {
              exitCode: EXIT_INVALID,
              suggestions: [
                {
                  message: 'Wait for it to finish, then run the command again.',
                },
              ],
            },
          );
        }
        await rm(file, { force: true });
      }
    }
    throw new InstallerError('LOCKED', `Could not take the lock at ${file}.`, {
      exitCode: EXIT_INVALID,
    });
  } finally {
    await rm(candidate, { force: true });
  }
}
