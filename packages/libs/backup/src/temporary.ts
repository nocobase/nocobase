import { createHash, randomUUID } from 'node:crypto';
import { readlinkSync } from 'node:fs';
import { lstat, readdir, rm } from 'node:fs/promises';
import { hostname } from 'node:os';
import { join } from 'node:path';

function processNamespace(): string {
  if (process.platform !== 'linux') return '';
  try {
    return readlinkSync('/proc/self/ns/pid');
  } catch {
    return '';
  }
}

const machine = createHash('sha256')
  .update(hostname() + '\0' + processNamespace())
  .digest('hex')
  .slice(0, 16);

export function temporaryName(prefix: string): string {
  return `${prefix}${machine}-${process.pid}-${randomUUID()}`;
}

/** Only collect scratch owned by an identifiable dead local process. */
export async function cleanAbandonedWork(
  base: string,
  prefix: string,
  kind: 'file' | 'directory',
): Promise<void> {
  for (const entry of await readdir(base, { withFileTypes: true })) {
    if (!entry.name.startsWith(prefix + machine + '-')) continue;
    if (kind === 'file' ? !entry.isFile() : !entry.isDirectory()) continue;
    const suffix = entry.name.slice(prefix.length + machine.length + 1);
    const owner = /^(\d+)-[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.exec(
      suffix,
    );
    const pid = Number(owner?.[1]);
    if (!Number.isSafeInteger(pid) || pid <= 0) continue;
    try {
      process.kill(pid, 0);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ESRCH') {
        const path = join(base, entry.name);
        const stat = await lstat(path).catch((error: unknown) => {
          if (
            !(error instanceof Error) ||
            !('code' in error) ||
            error.code !== 'ENOENT'
          )
            throw error;
        });
        if (
          stat &&
          (process.getuid === undefined || stat.uid === process.getuid())
        ) {
          await rm(path, { force: true, recursive: kind === 'directory' });
        }
      }
    }
  }
}
