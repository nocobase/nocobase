// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { indexingFixture, type IndexingFixture } from './indexing-fixture.js';
import { requestsRepo, workRepo } from '../server/indexing/store.js';
describe('Knowledge durable admission and recovery', () => {
  let f: IndexingFixture;
  afterEach(async () => {
    await f?.close();
    vi.restoreAllMocks();
  });
  it('retains durable acceptance when enqueue fails and recovers from the registered sweep', async () => {
    f = await indexingFixture();
    const doc = await f.create();
    const add = vi
      .spyOn(f.executor, 'addJob')
      .mockRejectedValueOnce(new Error('Injected unavailable queue.'));
    const receipt = await f.enable();
    expect(receipt.enabled).toBe(true);
    expect(
      await requestsRepo(f.h.database.connection()).findOne({
        filter: { requestId: receipt.requestId },
      }),
    ).not.toBeNull();
    expect(f.errors).toContain('INDEXING_DISPATCH_FAILED');
    add.mockRestore();
    f.advance(300001);
    await f.tick();
    await f.settled(doc.id);
    expect((await f.runtime.service.status(f.context)).serving?.id).toBe(
      receipt.generationId,
    );
  });
  it('recovers committed source intents when all local wake events are lost', async () => {
    f = await indexingFixture({ dropWake: true });
    const doc = await f.create();
    await f.enable();
    await f.settled(doc.id);
    await f.h.knowledge.docs.update(f.h.user('admin'), doc.id, {
      expectedVersion: 1,
      content: 'Replacement.',
    });
    expect(
      (
        await workRepo(f.h.database.connection()).findOne({
          filter: { docId: doc.id },
        })
      )?.state,
    ).toBe('pending');
    await f.tick();
    await f.settled(doc.id);
  });
  it('replays a saved receipt without re-resolving a model and rejects reused payloads', async () => {
    f = await indexingFixture();
    const receipt = await f.enable();
    const input = {
      requestId: receipt.requestId,
      expectedRevision: '0',
      config: {
        version: 1,
        key: 'local',
        options: { embedding: { modelService: 'fixture', model: 'embed' } },
      },
      acknowledgeFullRebuild: true,
    } as const;
    vi.spyOn(f.model, 'identity').mockRejectedValue(
      new Error('Deleted model.'),
    );
    expect(await f.runtime.service.save(f.context, input)).toEqual(receipt);
    await expect(
      f.runtime.service.save(f.context, { ...input, config: null }),
    ).rejects.toMatchObject({ code: 'INDEXING_REQUEST_CONFLICT' });
    await expect(
      f.runtime.service.save(f.context, {
        ...input,
        requestId: randomUUID(),
        config: null,
      }),
    ).rejects.toMatchObject({ code: 'INDEXING_REVISION_CONFLICT' });
  });
  it('does not reject acceptance when a real enqueue receipt is lost', async () => {
    f = await indexingFixture();
    const doc = await f.create();
    const original = f.executor.addJob.bind(f.executor);
    vi.spyOn(f.executor, 'addJob').mockImplementationOnce(async (job) => {
      await original(job);
      throw new Error('Injected response loss.');
    });
    const receipt = await f.enable();
    expect(receipt.enabled).toBe(true);
    await f.settled(doc.id);
    expect((await f.runtime.service.status(f.context)).serving?.id).toBe(
      receipt.generationId,
    );
  });
});
