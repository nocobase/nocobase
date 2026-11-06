// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { indexingFixture, type IndexingFixture } from './indexing-fixture.js';
import { sourcesRepo, settingsRepo } from '../server/indexing/store.js';
import { revisionOf } from '../server/indexing/vector.js';
describe('transactional Knowledge source journal', () => {
  let f: IndexingFixture;
  afterEach(async () => {
    await f?.close();
    vi.restoreAllMocks();
  });
  it('journals revisions even while indexing is disabled and archive/restore publish tombstones', async () => {
    f = await indexingFixture();
    const doc = await f.create();
    const source = await sourcesRepo(f.h.database.connection()).findOne({
      filter: { docId: doc.id },
    });
    expect(revisionOf(source!.revision)).toBe('1');
    await f.enable();
    await f.settled(doc.id);
    await f.h.knowledge.docs.archive(f.h.user('admin'), doc.id);
    await f.settled(doc.id);
    expect(
      (
        await sourcesRepo(f.h.database.connection()).findOne({
          filter: { docId: doc.id },
        })
      )?.deleted,
    ).toBe(true);
    await f.h.knowledge.docs.restore(f.h.user('admin'), doc.id);
    await f.settled(doc.id);
    expect(
      (
        await sourcesRepo(f.h.database.connection()).findOne({
          filter: { docId: doc.id },
        })
      )?.deleted,
    ).toBe(false);
    expect(
      await f.h.knowledge.docs.searchMany(
        f.h.user('admin'),
        [f.space],
        'semantic-query',
      ),
    ).toHaveLength(1);
  });
  it('rolls back chunks, source sequence and work together', async () => {
    f = await indexingFixture();
    const before = await settingsRepo(f.h.database.connection()).findOne({
      filter: { id: 'global' },
    });
    const original = f.h.database.transaction.bind(f.h.database);
    vi.spyOn(f.h.database, 'transaction').mockImplementationOnce(async (fn) =>
      original(async (conn) => {
        await fn(conn);
        throw new Error('Injected rollback.');
      }),
    );
    await expect(f.create()).rejects.toThrow('Injected rollback.');
    expect(await sourcesRepo(f.h.database.connection()).findMany()).toEqual([]);
    expect(
      (
        await settingsRepo(f.h.database.connection()).findOne({
          filter: { id: 'global' },
        })
      )?.sourceSeq,
    ).toBe(before?.sourceSeq);
    expect(
      await f.h.database.connection().repository('kbDocs').findMany(),
    ).toEqual([]);
  });
  it('forces re-embedding through the existing document reindex API', async () => {
    f = await indexingFixture();
    const doc = await f.create();
    await f.enable();
    await f.settled(doc.id);
    f.embed.mockClear();
    const result = await f.h.knowledge.indexing.reindex(
      f.h.user('admin'),
      doc.id,
    );
    expect(result.enabled).toBe(true);
    await f.settled(doc.id);
    expect(f.embed).toHaveBeenCalledTimes(1);
    expect(
      (await f.h.knowledge.indexing.doc(f.h.user('admin'), doc.id)).state,
    ).toBe('done');
  });
  it('journals same-version gate changes without paying for unchanged vectors', async () => {
    f = await indexingFixture();
    const doc = await f.create();
    await f.enable();
    await f.settled(doc.id);
    f.embed.mockClear();
    const before = await sourcesRepo(f.h.database.connection()).findOne({
      filter: { docId: doc.id },
    });
    await f.h.knowledge.permissions.replace(f.h.user('admin'), doc.id, {
      mode: 'custom',
      entries: [{ subject: { type: 'user', id: 'admin' }, level: 'manage' }],
    });
    await f.settled(doc.id);
    const after = await sourcesRepo(f.h.database.connection()).findOne({
      filter: { docId: doc.id },
    });
    expect(BigInt(revisionOf(after!.revision))).toBeGreaterThan(
      BigInt(revisionOf(before!.revision)),
    );
    expect(
      (await f.h.knowledge.docs.get(f.h.user('admin'), doc.id)).version,
    ).toBe(1);
    expect(f.embed).not.toHaveBeenCalled();
  });
  it('journals a rechunk at the unchanged document version', async () => {
    f = await indexingFixture();
    const doc = await f.create(
      '# A\n\nFirst.\n\n## B\n\nSecond.\n\n### C\n\nThird.',
    );
    await f.enable();
    await f.settled(doc.id);
    const before = await sourcesRepo(f.h.database.connection()).findOne({
      filter: { docId: doc.id },
    });
    await f.h.knowledge.chunking.set(f.h.user('admin'), f.space, {
      headingDepth: 1,
      target: 1200,
      max: 2000,
    });
    await f.h.knowledge.chunking.idle();
    await f.settled(doc.id);
    const after = await sourcesRepo(f.h.database.connection()).findOne({
      filter: { docId: doc.id },
    });
    expect(BigInt(revisionOf(after!.revision))).toBeGreaterThan(
      BigInt(revisionOf(before!.revision)),
    );
    expect(
      (await f.h.knowledge.docs.get(f.h.user('admin'), doc.id)).version,
    ).toBe(1);
  });
  it('journals extracted text while the uploaded file remains at version one', async () => {
    f = await indexingFixture();
    await f.enable();
    const doc = await f.h.knowledge.files.upload(
      f.h.user('admin'),
      f.space,
      new File(['Text extracted at the same version.'], 'source.txt', {
        type: 'text/plain',
      }),
    );
    await f.h.knowledge.files.idle();
    await f.settled(doc.id);
    const source = await sourcesRepo(f.h.database.connection()).findOne({
      filter: { docId: doc.id },
    });
    expect(BigInt(revisionOf(source!.revision))).toBeGreaterThan(1n);
    const parsed = await f.h.knowledge.docs.get(f.h.user('admin'), doc.id);
    expect(parsed.version).toBe(1);
    expect(parsed.file?.parseStatus).toBe('ready');
    expect(f.embed).toHaveBeenCalled();
  });
  it('finds failed current chunks before completed documents consume the bounded unfinished page', async () => {
    f = await indexingFixture();
    const done = await f.create();
    await f.enable();
    await f.settled(done.id);
    f.embed.mockRejectedValueOnce(new Error('Permanent fixture failure.'));
    const failed = await f.h.knowledge.docs.create(f.h.user('admin'), {
      ...f.space,
      title: 'Failed',
      content: 'Failed indexing.',
    });
    await expect
      .poll(
        async () =>
          (await f.h.knowledge.indexing.doc(f.h.user('admin'), failed.id))
            .state,
      )
      .toBe('failed');
    const source = await sourcesRepo(f.h.database.connection()).findOne({
      filter: { docId: failed.id },
    });
    expect(await f.indexer.unfinished(source!.spaceId, 1)).toEqual([
      {
        docId: failed.id,
        ordinal: 0,
        state: 'failed',
        error: 'Knowledge indexing failed.',
      },
    ]);
  });
});
