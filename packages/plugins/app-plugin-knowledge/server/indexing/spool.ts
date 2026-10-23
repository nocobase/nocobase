import { lstat, opendir, unlink } from 'node:fs/promises';
import path from 'node:path';

export const indexingSpoolDirectory = (storagePath: string): string =>
  path.join(storagePath, 'knowledge-indexing-spool');
const filename = /^kb-[a-f0-9]{24}-[a-f0-9-]{36}\.jsonl$/;
function missing(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
/** Only application-owned generated filenames: bounded inspection, no recursion and no following symbolic links. */
export async function cleanupIndexingSpools(
  storagePath: string,
  cutoff: Date,
  signal: AbortSignal,
): Promise<void> {
  const dir = await opendir(indexingSpoolDirectory(storagePath)).catch(
    (error: unknown) => {
      if (missing(error)) return null;
      throw error;
    },
  );
  if (!dir) return;
  let visited = 0;
  let removed = 0;
  for await (const entry of dir) {
    signal.throwIfAborted();
    if (++visited > 1000 || removed >= 100) break;
    if (!entry.isFile() || !filename.test(entry.name)) continue;
    const file = path.join(indexingSpoolDirectory(storagePath), entry.name);
    try {
      const info = await lstat(file);
      if (info.isFile() && info.mtimeMs <= cutoff.getTime()) {
        await unlink(file);
        removed++;
      }
    } catch (error) {
      if (!missing(error)) throw error;
    }
  }
}
