/** CPU-heavy archive work runs outside the application Host. */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { setPriority } from 'node:os';
import path from 'node:path';
import { x as extractTar } from 'tar';

// A terminated Host must not leave CPU or I/O work orphaned.
let finished = false;
process.once('disconnect', () => {
  if (!finished) process.exit(1);
});

async function main(): Promise<void> {
  try {
    setPriority(0, 10);
  } catch {
    /* Priority is best-effort on supported operating systems. */
  }
  const [mode, archive, destination] = process.argv.slice(2);
  if (!archive) throw new Error('Missing archive path');
  if (mode === 'hash') {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(archive))
      hash.update(chunk as Buffer);
    process.send?.({ result: hash.digest('hex') });
  } else if (mode === 'extract' && destination) {
    let rejected: Error | undefined;
    await extractTar({
      cwd: destination,
      file: archive,
      gzip: true,
      preservePaths: false,
      strict: true,
      filter(entryPath) {
        const normalized = path.posix.normalize(
          entryPath.replaceAll('\\', '/'),
        );
        if (
          path.posix.isAbsolute(normalized) ||
          normalized === '..' ||
          normalized.startsWith('../') ||
          normalized === '.nocobase-artifact.json'
        ) {
          rejected ??= new Error(
            `Artifact archive contains an unsafe or reserved path "${entryPath}"`,
          );
          return false;
        }
        return true;
      },
    });
    if (rejected) throw rejected;
    process.send?.({ result: '' });
  } else throw new Error('Invalid artifact worker operation');
}
main()
  .catch((error: unknown) => {
    process.send?.({
      error: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  })
  .finally(() => {
    finished = true;
    process.disconnect?.();
  });
