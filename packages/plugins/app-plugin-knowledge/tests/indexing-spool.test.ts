// @vitest-environment node
import { randomUUID } from 'node:crypto';
import {
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  symlink,
  utimes,
  writeFile,
  mkdir,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { prepareSqliteVectorSpool } from '../server/extension/sqlite-vec/spool.js';
import {
  cleanupIndexingSpools,
  indexingSpoolDirectory,
} from '../server/indexing/spool.js';
import type {
  IndexingDocument,
  IndexingItem,
  IndexingTarget,
} from '../server/indexing/types.js';
let root: string | undefined;
afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  root = undefined;
});
const signal = () => new AbortController().signal;
const target: IndexingTarget = {
  namespace: 'spool-fixture',
  generationId: 'generation',
  type: 'sqlite-vec',
  contractVersion: 1,
  options: {},
  dimension: 8192,
  identityHash: 'identity',
};
const document: IndexingDocument = {
  docId: 'doc',
  spaceId: 'space',
  revision: '1',
  snapshotHash: 'snapshot',
  deleted: false,
};
const item = (ordinal: number): IndexingItem => ({
  chunkId: 'chunk-' + ordinal,
  docId: 'doc',
  spaceId: 'space',
  version: 1,
  ordinal,
  contentHash: 'content',
  gate: 'public',
  text: 'Private document body must not enter the vector spool.',
  vector: Array.from({ length: target.dimension! }, (_, i) =>
    i === 0 ? 1 : 0,
  ),
});
it('uses a private vector-only file and streams rows across read-buffer boundaries without retaining an input array', async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'kb-spool-'));
  const spool = await prepareSqliteVectorSpool(
    root,
    target,
    document,
    (async function* () {
      for (let i = 0; i < 40; i++) yield item(i);
    })(),
    signal(),
  );
  try {
    expect(spool.count).toBe(40);
    const files = await readdir(indexingSpoolDirectory(root));
    expect(files).toHaveLength(1);
    const file = path.join(indexingSpoolDirectory(root), files[0]!);
    expect((await stat(file)).mode & 0o777).toBe(0o600);
    expect((await stat(indexingSpoolDirectory(root))).mode & 0o777).toBe(0o700);
    expect(await readFile(file, 'utf8')).not.toContain('Private document body');
    let count = 0;
    for (const row of spool.rows()) {
      expect(row.ordinal).toBe(count++);
      expect(row.embedding.byteLength).toBe(4 * target.dimension!);
      expect(row.embedding.readFloatLE(0)).toBe(1);
    }
    expect(count).toBe(40);
    // Early iterator return must release its descriptor too.
    for (const row of spool.rows()) {
      expect(row.chunkId).toBe('chunk-0');
      break;
    }
  } finally {
    await spool.close();
  }
  expect(await readdir(indexingSpoolDirectory(root))).toEqual([]);
});
it('removes incomplete files on invalid float32 vectors and aborted input', async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'kb-spool-'));
  await expect(
    prepareSqliteVectorSpool(
      root,
      { ...target, dimension: 3 },
      document,
      (async function* () {
        yield { ...item(0), vector: [1e40, 0, 0] };
      })(),
      signal(),
    ),
  ).rejects.toBeDefined();
  expect(await readdir(indexingSpoolDirectory(root))).toEqual([]);
  const controller = new AbortController();
  await expect(
    prepareSqliteVectorSpool(
      root,
      target,
      document,
      (async function* () {
        yield item(0);
        controller.abort();
        yield item(1);
      })(),
      controller.signal,
    ),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(await readdir(indexingSpoolDirectory(root))).toEqual([]);
});
it('bounds orphan deletion, ignores unknown files and symlinks, and preserves young temporary files', async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'kb-spool-'));
  const dir = indexingSpoolDirectory(root);
  await mkdir(dir, { mode: 0o700 });
  const old = new Date(Date.now() - 2 * 86400000);
  const names = Array.from(
    { length: 105 },
    () => 'kb-' + 'a'.repeat(24) + '-' + randomUUID() + '.jsonl',
  );
  for (const name of names) {
    const file = path.join(dir, name);
    await writeFile(file, 'orphan');
    await utimes(file, old, old);
  }
  const young = 'kb-' + 'b'.repeat(24) + '-' + randomUUID() + '.jsonl';
  await writeFile(path.join(dir, young), 'young');
  await writeFile(path.join(dir, 'not-owned.txt'), 'leave alone');
  const external = path.join(root, 'external');
  await writeFile(external, 'external');
  await utimes(external, old, old);
  const linked = 'kb-' + 'c'.repeat(24) + '-' + randomUUID() + '.jsonl';
  await symlink(external, path.join(dir, linked));
  await cleanupIndexingSpools(root, new Date(Date.now() - 86400000), signal());
  expect(
    (await readdir(dir)).filter((name) => names.includes(name)),
  ).toHaveLength(5);
  await cleanupIndexingSpools(root, new Date(Date.now() - 86400000), signal());
  expect((await readdir(dir)).sort()).toEqual(
    [young, linked, 'not-owned.txt'].sort(),
  );
  expect(await readFile(external, 'utf8')).toBe('external');
});
