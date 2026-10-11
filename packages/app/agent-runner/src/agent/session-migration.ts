import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import {
  link,
  lstat,
  mkdir,
  open,
  readdir,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

export interface SessionMigrationResult {
  copied: number;
  conflicts: number;
  skipped: number;
  failures: number;
  reason?: string;
  alreadyAttempted?: boolean;
}

function errorCode(error: unknown): string {
  return error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    /^[A-Z_]+$/.test(error.code)
    ? error.code
    : 'migrationFailed';
}

/** Check every directory component; neither source nor destination may escape through a link. */
async function directory(dir: string, create: boolean): Promise<boolean> {
  const absolute = path.resolve(dir);
  const parent = path.dirname(absolute);
  if (parent !== absolute && !(await directory(parent, create))) return false;
  try {
    const stat = await lstat(absolute);
    if (stat.isSymbolicLink() || !stat.isDirectory())
      throw new Error('unsafeDirectory', { cause: stat });
    return true;
  } catch (error) {
    if (errorCode(error) !== 'ENOENT') throw error;
    if (!create) return false;
    try {
      await mkdir(absolute, { mode: 0o700 });
    } catch (error) {
      if (errorCode(error) !== 'EEXIST') throw error;
    }
    const stat = await lstat(absolute);
    if (stat.isSymbolicLink() || !stat.isDirectory())
      throw new Error('unsafeDirectory', { cause: error });
    return true;
  }
}

/** Publish only complete files, without overwriting any existing destination. */
async function copyFile(source: string, destination: string): Promise<void> {
  await directory(path.dirname(destination), true);
  const temporary = path.join(
    path.dirname(destination),
    `.session-migration-${randomUUID()}.tmp`,
  );
  const input = await open(source, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (!(await input.stat()).isFile()) throw new Error('unsafeSource');
    const output = await open(temporary, 'wx', 0o600);
    try {
      const buffer = Buffer.alloc(64 * 1024);
      for (;;) {
        const { bytesRead } = await input.read(buffer);
        if (bytesRead === 0) break;
        let offset = 0;
        while (offset < bytesRead) {
          const { bytesWritten } = await output.write(
            buffer,
            offset,
            bytesRead - offset,
          );
          if (bytesWritten === 0) throw new Error('incompleteWrite');
          offset += bytesWritten;
        }
      }
      await output.sync();
    } finally {
      await output.close();
    }
    await directory(path.dirname(destination), false);
    await link(temporary, destination);
  } finally {
    await input.close();
    await unlink(temporary).catch(() => {});
  }
}

/** Called under the workspace lock. Only session trees are copied; credentials and settings stay in place. */
export async function migrateLegacySessions(
  runnerDir: string,
  tool: string,
  home: string,
): Promise<SessionMigrationResult | undefined> {
  if (tool !== 'codex' && tool !== 'claude') return undefined;
  const result: SessionMigrationResult = {
    copied: 0,
    conflicts: 0,
    skipped: 0,
    failures: 0,
  };
  const marker = path.join(runnerDir, `session-migration-${tool}.json`);
  let marked = false;
  try {
    await directory(runnerDir, true);
    try {
      await writeFile(marker, JSON.stringify({ state: 'attempted' }), {
        flag: 'wx',
        mode: 0o600,
      });
      marked = true;
    } catch (error) {
      if (errorCode(error) === 'EEXIST')
        return { ...result, alreadyAttempted: true };
      result.failures += 1;
      result.reason = errorCode(error);
    }
    const source = path.join(
      runnerDir,
      'home',
      tool === 'codex' ? '.codex/sessions' : '.claude/projects',
    );
    if (tool === 'claude' && !path.isAbsolute(home))
      throw new Error('homeUnavailable');
    const target =
      tool === 'codex'
        ? path.join(runnerDir, 'codex-home/sessions')
        : path.join(home, '.claude/projects');
    if (await directory(source, false)) {
      await directory(target, true);
      const walk = async (relative: string): Promise<void> => {
        const from = path.join(source, relative);
        await directory(from, false);
        for (const entry of await readdir(from, { withFileTypes: true })) {
          const next = path.join(relative, entry.name);
          try {
            if (entry.isSymbolicLink()) {
              result.skipped += 1;
              continue;
            }
            if (entry.isDirectory()) await walk(next);
            else if (entry.isFile()) {
              await directory(from, false);
              await copyFile(path.join(source, next), path.join(target, next));
              result.copied += 1;
            } else result.skipped += 1;
          } catch (error) {
            if (errorCode(error) === 'EEXIST') result.conflicts += 1;
            else {
              result.failures += 1;
              result.reason = errorCode(error);
            }
          }
        }
      };
      await walk('');
    }
  } catch (error) {
    result.failures += 1;
    result.reason = errorCode(error);
  }
  if (marked) {
    const temporary = `${marker}.${randomUUID()}.tmp`;
    try {
      await directory(runnerDir, false);
      await writeFile(
        temporary,
        JSON.stringify({
          state: result.failures ? 'failed' : 'completed',
          ...result,
        }),
        { flag: 'wx', mode: 0o600 },
      );
      await rename(temporary, marker);
    } catch (error) {
      result.failures += 1;
      result.reason = errorCode(error);
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }
  return result;
}
