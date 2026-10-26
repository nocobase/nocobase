// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { indexingFixture, type IndexingFixture } from './indexing-fixture.js';
describe('global Knowledge generation publication', () => {
  let f: IndexingFixture;
  afterEach(async () => {
    await f?.close();
    vi.restoreAllMocks();
  });
  it('creates an empty active and indexes the first later document', async () => {
    f = await indexingFixture();
    const receipt = await f.enable();
    await expect
      .poll(async () => (await f.runtime.service.status(f.context)).serving?.id)
      .toBe(receipt.generationId);
    const doc = await f.create();
    await f.settled(doc.id);
    expect(f.embed).toHaveBeenCalledTimes(1);
  });
  it('keeps the previous active while rebuilding and publishes only after all work succeeds', async () => {
    f = await indexingFixture();
    const doc = await f.create();
    const initial = await f.enable();
    await f.settled(doc.id);
    f.embed.mockRejectedValueOnce(new Error('Permanent fixture failure.'));
    const rebuilt = await f.runtime.service.rebuild(f.context, {
      requestId: randomUUID(),
      expectedRevision: '1',
      acknowledgeFullRebuild: true,
    });
    expect(rebuilt.generationId).not.toBe(initial.generationId);
    await expect
      .poll(
        async () =>
          (await f.runtime.service.status(f.context)).target?.documents.failed,
      )
      .toBe(1);
    expect((await f.runtime.service.status(f.context)).serving?.id).toBe(
      initial.generationId,
    );
    const retried = await f.runtime.service.retry(f.context, {
      requestId: randomUUID(),
      expectedRevision: '2',
      generationId: rebuilt.generationId!,
      acknowledgeFullRebuild: true,
    });
    expect(retried.revision).toBe('2');
    expect(retried.generationId).toBe(rebuilt.generationId);
    await f.settled(doc.id);
    expect((await f.runtime.service.status(f.context)).serving?.id).toBe(
      rebuilt.generationId,
    );
  });
  it.each(['success', 'failure'] as const)(
    'ignores a late old %s after a newer source revision succeeds',
    async (kind) => {
      const started = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      let calls = 0;
      let ended = 0;
      f = await indexingFixture({
        concurrency: 2,
        embed: async ({ values }) => {
          if (++calls === 1) {
            started.resolve();
            await release.promise;
            if (kind === 'failure') throw new Error('Old failure.');
          }
          return { embeddings: values.map(() => [1, 0, 0]), dimension: 3 };
        },
      });
      const unsubscribe = f.executor.subscribe((event) => {
        if (
          event.jobName === 'knowledge.indexing.document' &&
          event.name === 'JobEnd'
        )
          ended++;
      });
      const doc = await f.create();
      await f.enable();
      await started.promise;
      await f.h.knowledge.docs.update(f.h.user('admin'), doc.id, {
        expectedVersion: 1,
        content: 'Newer revision.',
      });
      await f.settled(doc.id);
      release.resolve();
      await expect.poll(() => ended).toBe(2);
      expect((await f.runtime.service.status(f.context)).availability).toBe(
        'ready',
      );
      expect(
        (await f.h.knowledge.indexing.doc(f.h.user('admin'), doc.id)).state,
      ).toBe('done');
      unsubscribe();
    },
  );
  it('journals each update to both active and building before either worker can complete', async () => {
    f = await indexingFixture();
    const doc = await f.create();
    const first = await f.enable();
    await f.settled(doc.id);
    const started = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    f.embed.mockImplementation(async ({ values }) => {
      started.resolve();
      await release.promise;
      return { embeddings: values.map(() => [1, 0, 0]), dimension: 3 };
    });
    const next = await f.runtime.service.rebuild(f.context, {
      requestId: randomUUID(),
      expectedRevision: '1',
      acknowledgeFullRebuild: true,
    });
    await started.promise;
    await f.h.knowledge.docs.update(f.h.user('admin'), doc.id, {
      expectedVersion: 1,
      content: 'Updated while rebuilding.',
    });
    const work = await f.h.database
      .connection()
      .query.selectFrom('kbIndexWork')
      .select(['generationId', 'wantedRevision', 'appliedRevision'])
      .where('docId', '=', doc.id)
      .execute();
    expect(work).toHaveLength(2);
    expect(new Set(work.map((row) => row.generationId))).toEqual(
      new Set([first.generationId, next.generationId]),
    );
    expect(
      work.every(
        (row) =>
          String(row.wantedRevision) === '2' &&
          String(row.appliedRevision) !== '2',
      ),
    ).toBe(true);
    expect((await f.runtime.service.status(f.context)).serving?.id).toBe(
      first.generationId,
    );
    release.resolve();
    await f.settled(doc.id);
    expect((await f.runtime.service.status(f.context)).serving?.id).toBe(
      next.generationId,
    );
  });
});
