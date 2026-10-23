// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { sqliteVecIndexingExtension as extension } from '../server/extension/sqlite-vec/index.js';
import type {
  IndexingItem,
  IndexingTarget,
  KnowledgeIndexingBackend,
} from '../server/indexing/types.js';
import { sha256 } from '../server/indexing/vector.js';

const signal = () => new AbortController().signal;
const stream = async function* (items: readonly IndexingItem[]) {
  yield* items;
};
const item = (
  id: string,
  spaceId = 'allowed',
  gate = 'open',
  vector: readonly number[] = [1, 0, 0],
): IndexingItem => ({
  chunkId: id,
  docId: 'doc-' + id,
  spaceId,
  version: 1,
  ordinal: 0,
  contentHash: sha256(id),
  gate,
  text: 'Text ' + id,
  vector,
});
describe('real sqlite-vec target protocol', () => {
  let storage: string;
  let target: IndexingTarget;
  let backend: KnowledgeIndexingBackend;
  beforeEach(async () => {
    storage = await mkdtemp(path.join(tmpdir(), 'kb-sqlite-contract-'));
    target = {
      namespace: randomUUID(),
      generationId: randomUUID(),
      type: 'sqlite-vec',
      contractVersion: 1,
      options: { embedding: { modelService: 'fixture', model: 'embed' } },
      dimension: 3,
      identityHash: 'b'.repeat(64),
    };
    backend = extension.create({
      key: 'local',
      config: { file: 'vectors.sqlite' },
      storagePath: storage,
      onError: () => {},
    });
  });
  afterEach(async () => {
    await backend.close();
    await rm(storage, { recursive: true, force: true });
  });
  async function apply(
    value: IndexingItem,
    revision = '1',
    snapshot = sha256(value.chunkId),
  ) {
    return backend.replaceDocument(
      target,
      {
        docId: value.docId,
        spaceId: value.spaceId,
        revision,
        snapshotHash: snapshot,
        deleted: false,
      },
      stream([value]),
      signal(),
    );
  }
  const search = async (scopes = [{ spaceId: 'allowed', gates: ['open'] }]) =>
    backend.search(
      target,
      {
        channel: 'vector',
        query: { kind: 'vector', vector: [1, 0, 0] },
        scopes,
        limit: 1,
      },
      signal(),
    );
  it('filters unauthorized nearer candidates before top-k and reuses only matching chunk identities', async () => {
    await backend.ensureTarget(target, signal());
    const visible = item('visible', 'allowed', 'open', [0.5, 1, 0]);
    const privateGate = item('secret', 'allowed', 'restricted');
    const privateSpace = item('space-secret', 'forbidden');
    await apply(visible);
    await apply(privateGate);
    await apply(privateSpace);
    expect((await search()).map((hit) => hit.chunkId)).toEqual(['visible']);
    const vectors = await backend.vectorsOf(
      target,
      visible.docId,
      [
        { chunkId: visible.chunkId, contentHash: visible.contentHash },
        { chunkId: privateGate.chunkId, contentHash: privateGate.contentHash },
      ],
      signal(),
    );
    expect([...vectors.keys()]).toEqual(['visible']);
    expect(
      await backend.vectorsOf(
        target,
        visible.docId,
        [{ chunkId: visible.chunkId, contentHash: 'changed' }],
        signal(),
      ),
    ).toEqual(new Map());
  });
  it('rejects conflicting snapshots, ignores stale writers and retains deletion fences', async () => {
    await backend.ensureTarget(target, signal());
    const value = item('chunk');
    expect(await apply(value, '2')).toBe('applied');
    expect(await apply(value, '2')).toBe('alreadyApplied');
    await expect(apply(value, '2', 'different')).rejects.toMatchObject({
      code: 'INDEXING_SNAPSHOT_CONFLICT',
    });
    expect(await apply(value, '1')).toBe('obsolete');
    await backend.replaceDocument(
      target,
      {
        docId: value.docId,
        spaceId: value.spaceId,
        revision: '3',
        snapshotHash: sha256('deleted'),
        deleted: true,
      },
      stream([]),
      signal(),
    );
    expect(await apply(value, '2')).toBe('obsolete');
    expect(await search()).toEqual([]);
  });
  it('keeps an unknown-dimension empty snapshot fenced against a late nonempty writer', async () => {
    const empty = { ...target, dimension: null };
    await backend.ensureTarget(empty, signal());
    const value = item('chunk');
    expect(
      await backend.replaceDocument(
        empty,
        {
          docId: value.docId,
          spaceId: value.spaceId,
          revision: '2',
          snapshotHash: sha256('empty'),
          deleted: false,
        },
        stream([]),
        signal(),
      ),
    ).toBe('applied');
    await backend.ensureTarget(target, signal());
    expect(await apply(value, '1')).toBe('obsolete');
    expect(await search()).toEqual([]);
  });
  it('permanently closes even an uninitialized target without preventing another namespace', async () => {
    await backend.dropTarget(target, signal());
    await backend.dropTarget(target, signal());
    await expect(backend.ensureTarget(target, signal())).rejects.toMatchObject({
      code: 'INDEXING_TARGET_OWNERSHIP_CONFLICT',
    });
    const another = { ...target, namespace: randomUUID() };
    await expect(
      backend.ensureTarget(another, signal()),
    ).resolves.toBeUndefined();
  });
  it('drops only the owned generation and never allows its old ensure or replace to revive it', async () => {
    await backend.ensureTarget(target, signal());
    const value = item('chunk');
    await apply(value);
    await backend.dropTarget(target, signal());
    await backend.dropTarget(target, signal());
    await expect(apply(value, '2')).rejects.toMatchObject({
      code: 'INDEXING_TARGET_OWNERSHIP_CONFLICT',
    });
    await expect(backend.ensureTarget(target, signal())).rejects.toMatchObject({
      code: 'INDEXING_TARGET_OWNERSHIP_CONFLICT',
    });
  });
  it('refuses foreign same-column control layouts without touching their rows', async () => {
    const db = new Database(path.join(storage, 'vectors.sqlite'));
    db.exec(
      'CREATE TABLE __kb_index_targets (namespace TEXT,generationId TEXT,identityHash TEXT,targetName TEXT,dimension INTEGER,contractVersion INTEGER,state TEXT,createdAt TEXT,closedAt TEXT)',
    );
    db.exec("INSERT INTO __kb_index_targets (namespace) VALUES ('foreign')");
    await expect(backend.ensureTarget(target, signal())).rejects.toMatchObject({
      code: 'INDEXING_TARGET_OWNERSHIP_CONFLICT',
    });
    expect(
      db.prepare('SELECT namespace FROM __kb_index_targets').all(),
    ).toEqual([{ namespace: 'foreign' }]);
    db.close();
  });
  it('closes idempotently and rejects all subsequent calls, including empty searches', async () => {
    await backend.ensureTarget(target, signal());
    await backend.close();
    await backend.close();
    await expect(search([])).rejects.toMatchObject({
      code: 'INDEXING_UNAVAILABLE',
    });
    await expect(
      backend.vectorsOf(target, 'doc', [], signal()),
    ).rejects.toMatchObject({ code: 'INDEXING_UNAVAILABLE' });
  });
});
