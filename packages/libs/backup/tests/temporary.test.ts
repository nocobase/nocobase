import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { cleanAbandonedWork, temporaryName } from '../src/temporary.js';

it('removes dead local partial files and keeps active work and unknown files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'backup-temp-test-'));
  const prefix = '.backup.tar.gz.partial-';
  const active = temporaryName(prefix);
  const abandoned = temporaryName(prefix).replace(
    `-${process.pid}-`,
    '-2147483647-',
  );
  const unknown = prefix + 'pre-existing';
  try {
    await Promise.all(
      [active, abandoned, unknown].map((name) =>
        writeFile(join(dir, name), 'scratch'),
      ),
    );
    await cleanAbandonedWork(dir, prefix, 'file');
    expect((await readdir(dir)).sort()).toEqual([active, unknown].sort());
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
