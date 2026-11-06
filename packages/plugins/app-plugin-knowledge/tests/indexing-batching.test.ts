// @vitest-environment node
import { expect, it } from 'vitest';
import { indexingFixture } from './indexing-fixture.js';

it.each([25, 8])(
  'indexes all 27 sections when an embedding endpoint accepts at most %i inputs per call',
  async (limit) => {
    const f = await indexingFixture({
      embed: async ({ values, signal }) => {
        signal.throwIfAborted();
        if (values.length > limit)
          throw Object.assign(
            new Error('Fixture input batch limit exceeded.'),
            {
              code: 'badResponse',
            },
          );
        return { embeddings: values.map(() => [1, 0, 0]), dimension: 3 };
      },
    });
    try {
      const doc = await f.create(
        Array.from(
          { length: 27 },
          (_, i) => `## Section ${i + 1}\n\nUnique source text ${i + 1}.`,
        ).join('\n\n'),
      );
      expect(
        (await f.h.knowledge.indexing.doc(f.h.user('admin'), doc.id)).total,
      ).toBe(27);
      await f.enable();
      await f.settled(doc.id);
      expect(
        f.embed.mock.calls.map(([request]) => request.values.length),
      ).toEqual([8, 8, 8, 3]);
      const submitted = f.embed.mock.calls.flatMap(([request]) => [
        ...request.values,
      ]);
      expect(submitted).toHaveLength(27);
      expect(new Set(submitted).size).toBe(27);
      const status = await f.runtime.service.status(f.context);
      expect(status.availability).toBe('ready');
      expect(status.serving?.chunks).toEqual({
        total: 27,
        prepared: 27,
        committed: 27,
      });
      expect(status.serving?.documents.failed).toBe(0);
      const indexed = await f.h.knowledge.indexing.doc(
        f.h.user('admin'),
        doc.id,
      );
      expect(indexed).toMatchObject({
        state: 'done',
        total: 27,
        indexed: 27,
        failed: 0,
        pending: 0,
      });
    } finally {
      await f.close();
    }
  },
);
