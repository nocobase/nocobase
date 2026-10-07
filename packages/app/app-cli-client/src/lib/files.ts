// Small file helpers: JSON reads that treat a missing file as absent, and atomic 0600 writes.
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

/** Writes through a temporary file and a rename, so a reader never sees half a file. */
export async function writeJsonAtomic(
  file: string,
  value: unknown,
  mode = 0o600,
): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode });
  // The mode on writeFile is masked by umask; chmod sets it exactly.
  await chmod(temporary, mode);
  await rename(temporary, file);
}
