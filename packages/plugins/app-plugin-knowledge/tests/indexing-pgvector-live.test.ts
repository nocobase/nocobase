// @vitest-environment node
// db-test-portability: dialect-specific — the subject is the optional pgvector storage, not the business database.
import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import type { IndexingItem, IndexingTarget } from '../server/indexing/index.js';
import { pgvectorIndexingExtension } from '../server/indexing/index.js';

// Explicit opt-in only. Never reuse the application's database, Agents vectors, or general PG* environment.
const url = process.env.KNOWLEDGE_TEST_PGVECTOR_URL;
it.skipIf(!url)(
  'uses an authorized isolated PostgreSQL schema for replace, filtering, revision and closed-target fencing',
  async () => {
    const { Pool } = await import('pg');
    const schema = 'kb_test_' + randomUUID().replaceAll('-', '');
    const control = new Pool({
      connectionString: url,
      max: 1,
      connectionTimeoutMillis: 10000,
      statement_timeout: 10000,
    });
    const backend = pgvectorIndexingExtension.create({
      key: 'isolated',
      config: { url: url!, schema },
      storagePath: 'unused',
      onError: () => {},
    });
    const signal = new AbortController().signal;
    let created = false;
    const target: IndexingTarget = {
      namespace: randomUUID(),
      generationId: randomUUID(),
      type: 'pgvector',
      contractVersion: 1,
      options: {
        table: 'knowledge',
        embedding: { modelService: 'fixture', model: 'embed' },
      },
      dimension: 3,
      identityHash: 'a'.repeat(64),
    };
    const items = (
      docId: string,
      spaceId: string,
      gate: string,
      vector: readonly number[],
    ): IndexingItem => ({
      chunkId: docId + '-chunk',
      docId,
      spaceId,
      gate,
      vector,
      text: 'Source',
      version: 1,
      ordinal: 0,
      contentHash: 'b'.repeat(64),
    });
    const input = async function* (item: IndexingItem) {
      yield item;
    };
    const write = (item: IndexingItem, revision = '1', hash = 'c'.repeat(64)) =>
      backend.replaceDocument(
        target,
        {
          docId: item.docId,
          spaceId: item.spaceId,
          revision,
          snapshotHash: hash,
          deleted: false,
        },
        input(item),
        signal,
      );
    try {
      // This test creates and removes only its own random schema. It never installs the vector extension.
      await control.query('CREATE SCHEMA "' + schema + '"');
      created = true;
      await backend.ensureTarget(target, signal);
      const hidden = items('hidden', 'private', '', [1, 0, 0]);
      const gated = items('gated', 'visible', 'private-gate', [1, 0, 0]);
      const visible = items('visible', 'visible', '', [0.8, 0.6, 0]);
      expect(await write(hidden)).toBe('applied');
      expect(await write(gated)).toBe('applied');
      expect(await write(visible, '2')).toBe('applied');
      expect(await write(visible, '1')).toBe('obsolete');
      expect(await write(visible, '2')).toBe('alreadyApplied');
      await expect(write(visible, '2', 'd'.repeat(64))).rejects.toMatchObject({
        code: 'INDEXING_SNAPSHOT_CONFLICT',
      });
      const hits = await backend.search(
        target,
        {
          channel: 'vector',
          query: { kind: 'vector', vector: [1, 0, 0] },
          scopes: [{ spaceId: 'visible', gates: [''] }],
          limit: 1,
        },
        signal,
      );
      expect(hits).toHaveLength(1);
      expect(hits[0].chunkId).toBe(visible.chunkId);
      expect(
        (
          await backend.vectorsOf(
            target,
            visible.docId,
            [{ chunkId: visible.chunkId, contentHash: visible.contentHash }],
            signal,
          )
        ).get(visible.chunkId),
      ).toHaveLength(3);
      expect(
        await backend.replaceDocument(
          target,
          {
            docId: visible.docId,
            spaceId: visible.spaceId,
            revision: '3',
            snapshotHash: 'e'.repeat(64),
            deleted: true,
          },
          (async function* () {})(),
          signal,
        ),
      ).toBe('applied');
      expect(
        await backend.search(
          target,
          {
            channel: 'vector',
            query: { kind: 'vector', vector: [1, 0, 0] },
            scopes: [{ spaceId: 'visible', gates: [''] }],
            limit: 1,
          },
          signal,
        ),
      ).toEqual([]);
      await backend.dropTarget(target, signal);
      await backend.dropTarget(target, signal);
      await expect(backend.ensureTarget(target, signal)).rejects.toMatchObject({
        code: 'INDEXING_TARGET_OWNERSHIP_CONFLICT',
      });
      const uninitialized = {
        ...target,
        generationId: randomUUID(),
        dimension: null,
      };
      await backend.dropTarget(uninitialized, signal);
      await expect(
        backend.ensureTarget(uninitialized, signal),
      ).rejects.toMatchObject({ code: 'INDEXING_TARGET_OWNERSHIP_CONFLICT' });
    } finally {
      await backend.close();
      if (created) await control.query('DROP SCHEMA "' + schema + '" CASCADE');
      await control.end();
    }
  },
  60000,
);
