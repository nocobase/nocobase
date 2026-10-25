// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pgvectorIndexingExtension as extension } from '../server/extension/pgvector/index.js';
import type {
  IndexingTarget,
  KnowledgeIndexingBackend,
} from '../server/indexing/types.js';
import { sha256 } from '../server/indexing/vector.js';

const fixture = vi.hoisted(() => ({
  query: vi.fn(),
  connect: vi.fn(),
  release: vi.fn(),
  end: vi.fn(),
  options: vi.fn(),
  on: vi.fn(),
  revision: '2',
  snapshot: 'a'.repeat(64),
  state: 'open',
  table: 'knowledge',
}));
vi.mock('pg', () => ({
  Pool: class {
    constructor(options: unknown) {
      fixture.options(options);
    }
    on = fixture.on;
    connect = fixture.connect;
    end = fixture.end;
  },
}));
describe('pgvector pure config and SQL protocol fixtures (not live PostgreSQL acceptance)', () => {
  let backend: KnowledgeIndexingBackend;
  let target: IndexingTarget;
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.revision = '2';
    fixture.snapshot = 'a'.repeat(64);
    fixture.state = 'open';
    fixture.table = 'knowledge';
    target = {
      namespace: randomUUID(),
      generationId: randomUUID(),
      type: 'pgvector',
      contractVersion: 1,
      options: {
        table: 'knowledge',
        embedding: { modelService: 'fixture', model: 'embed' },
      },
      dimension: 3,
      identityHash: 'b'.repeat(64),
    };
    fixture.query.mockImplementation(
      async (sql: string, params: unknown[] = []) => {
        if (sql.includes('obj_description'))
          return {
            rows: [
              {
                kind: 'r',
                marker: '@nocobase/app-plugin-knowledge/indexing/v1',
              },
            ],
          };
        if (sql.includes('FROM pg_attribute')) {
          const table = String(params[0]);
          const shape = table.includes('__kb_index_targets')
            ? [
                ['namespace', 'character varying(64)', true],
                ['generationId', 'character varying(64)', true],
                ['identityHash', 'character varying(64)', true],
                ['targetName', 'character varying(63)', true],
                ['dimension', 'integer', false],
                ['contractVersion', 'integer', true],
                ['state', 'character varying(16)', true],
                ['createdAt', 'timestamp with time zone', true],
                ['closedAt', 'timestamp with time zone', false],
              ]
            : table.endsWith('_docs"')
              ? [
                  ['docId', 'character varying(64)', true],
                  ['revision', 'bigint', true],
                  ['snapshotHash', 'character varying(64)', true],
                  ['deleted', 'boolean', true],
                  ['updatedAt', 'timestamp with time zone', true],
                ]
              : [
                  ['chunkId', 'character varying(64)', true],
                  ['docId', 'character varying(64)', true],
                  ['spaceId', 'character varying(64)', true],
                  ['revision', 'bigint', true],
                  ['version', 'integer', true],
                  ['ordinal', 'integer', true],
                  ['contentHash', 'character varying(64)', true],
                  ['gate', 'character varying(132)', true],
                  ['embedding', 'vector(3)', true],
                ];
          return {
            rows: shape.map(([name, type, required]) => ({
              name,
              type,
              required,
            })),
          };
        }
        if (sql.includes('FROM pg_constraint')) {
          const table = String(params[0]);
          return {
            rows: table.includes('__kb_index_targets')
              ? [
                  { kind: 'p', columns: ['namespace', 'generationId'] },
                  { kind: 'u', columns: ['targetName'] },
                ]
              : [
                  {
                    kind: 'p',
                    columns: [table.endsWith('_docs"') ? 'docId' : 'chunkId'],
                  },
                ],
          };
        }
        if (sql.startsWith('SELECT pg_catalog.format_type'))
          return { rows: [{ type: 'vector(3)' }] };
        if (sql.startsWith('SELECT * FROM'))
          return {
            rows: [
              {
                namespace: target.namespace,
                generationId: target.generationId,
                identityHash: target.identityHash,
                targetName:
                  fixture.table +
                  '_g_' +
                  sha256(target.namespace + ':' + target.generationId).slice(
                    0,
                    24,
                  ),
                dimension: target.dimension,
                contractVersion: 1,
                state: fixture.state,
              },
            ],
          };
        if (sql.includes("e.extname='vector'"))
          return { rows: [{ schema: 'public' }] };
        if (sql.startsWith('WITH authorized'))
          return { rows: [{ chunkId: 'visible', score: 0.5 }] };
        if (sql.startsWith('SELECT "revision","snapshotHash"'))
          return {
            rows: [
              { revision: fixture.revision, snapshotHash: fixture.snapshot },
            ],
          };
        return { rows: [] };
      },
    );
    fixture.connect.mockResolvedValue({
      query: fixture.query,
      release: fixture.release,
    });
    fixture.end.mockResolvedValue(undefined);
    backend = extension.create({
      key: 'pg',
      config: {
        host: 'database.invalid',
        database: 'vectors',
        user: 'knowledge',
        password: 'private-password',
      },
      storagePath: 'unused',
      onError: () => {},
    });
  });
  afterEach(async () => {
    await backend.close();
  });
  it('is lazy and rejects ambiguous connection or table identifiers without IO', () => {
    expect(fixture.options).not.toHaveBeenCalled();
    expect(
      extension.parseConfig({
        host: 'database.invalid',
        database: 'vectors',
        user: 'knowledge',
      }),
    ).toMatchObject({ port: 5432, schema: 'public' });
    expect(
      extension.parseConfig({
        url: 'postgresql://user:secret@database.invalid/vectors',
      }),
    ).toMatchObject({ schema: 'public' });
    expect(() =>
      extension.parseConfig({
        url: 'postgresql://database.invalid/vectors',
        port: 5432,
      }),
    ).toThrow();
    expect(() =>
      extension.parseConfig({
        host: 'host',
        database: 'db',
        user: 'user',
        schema: 'public;drop',
      }),
    ).toThrow();
    expect(() =>
      extension.parseConfig({
        host: 'host',
        database: 'db',
        user: 'user',
        ssl: { rejectUnauthorized: true, extra: 'no' },
      }),
    ).toThrow();
    expect(() =>
      extension.parseSettings({
        table: 'public.table',
        embedding: { modelService: 'fixture', model: 'embed' },
      }),
    ).toThrow();
    expect(fixture.options).not.toHaveBeenCalled();
  });
  it('owns the table prefix in deployment configuration and strips legacy request options', async () => {
    expect(
      extension.parseConfig({
        host: 'host',
        database: 'db',
        user: 'user',
        table: 'custom_prefix',
      }),
    ).toMatchObject({ table: 'custom_prefix' });
    expect(
      extension.parseSettings({
        embedding: { modelService: 'fixture', model: 'embed' },
      }).options,
    ).toEqual({ embedding: { modelService: 'fixture', model: 'embed' } });
    expect(
      extension.parseSettings({
        table: 'forged',
        embedding: { modelService: 'fixture', model: 'embed' },
      }).options,
    ).not.toHaveProperty('table');
    target = { ...target, options: { ...target.options, table: 'forged' } };
    await backend.search(
      target,
      {
        channel: 'vector',
        query: { kind: 'vector', vector: [1, 0, 0] },
        scopes: [{ spaceId: 'space', gates: [''] }],
        limit: 1,
      },
      new AbortController().signal,
    );
    const query = fixture.query.mock.calls.find(([sql]) =>
      sql.startsWith('WITH authorized'),
    )!;
    expect(query[0]).toContain('knowledge_g_');
    expect(query[0]).not.toContain('forged');
  });
  it('uses a custom deployed prefix in SQL without taking a prefix from target options', async () => {
    await backend.close();
    fixture.table = 'deployed';
    backend = extension.create({
      key: 'pg',
      config: {
        host: 'host',
        database: 'db',
        user: 'user',
        table: fixture.table,
      },
      storagePath: 'unused',
      onError: () => {},
    });
    target = {
      ...target,
      options: { embedding: { modelService: 'fixture', model: 'embed' } },
    };
    await backend.search(
      target,
      {
        channel: 'vector',
        query: { kind: 'vector', vector: [1, 0, 0] },
        scopes: [{ spaceId: 'space', gates: [''] }],
        limit: 1,
      },
      new AbortController().signal,
    );
    const sql = fixture.query.mock.calls.find(([sql]) =>
      sql.startsWith('WITH authorized'),
    )![0];
    expect(sql).toContain('deployed_g_');
    expect(sql).not.toContain('knowledge_g_');
  });
  it('changes resource identity for deployment table rotation but not a default spelled explicitly', () => {
    const config = { host: 'host', database: 'db', user: 'user' };
    expect(extension.resourceIdentity(config)).toBe(
      extension.resourceIdentity({ ...config, table: 'knowledge' }),
    );
    expect(extension.resourceIdentity(config)).not.toBe(
      extension.resourceIdentity({ ...config, table: 'another' }),
    );
    expect(() =>
      extension.parseConfig({ ...config, table: 'unsafe.table' }),
    ).toThrow();
    expect(fixture.options).not.toHaveBeenCalled();
  });
  it('keeps credentials out of resource identity while detecting locator changes', () => {
    const a = { url: 'postgresql://user:first@database.invalid/vectors' };
    expect(extension.resourceIdentity(a)).toBe(
      extension.resourceIdentity({
        url: 'postgresql://user:second@database.invalid/vectors',
      }),
    );
    expect(extension.resourceIdentity(a)).not.toBe(
      extension.resourceIdentity({
        url: 'postgresql://user:first@elsewhere.invalid/vectors',
      }),
    );
    expect(extension.resourceIdentity(a)).toBe(
      extension.resourceIdentity({
        host: 'database.invalid',
        database: 'vectors',
        user: 'user',
        password: 'different',
      }),
    );
  });
  it('matches pg URL locator precedence without hashing ignored database query fields or credentials', () => {
    const canonical = {
      host: 'database.invalid',
      database: 'vectors',
      user: 'user',
      port: 6432,
    };
    expect(
      extension.resourceIdentity({
        url: 'postgresql://user:secret@database.invalid/vectors?database=ignored&port=06432',
      }),
    ).toBe(extension.resourceIdentity(canonical));
    expect(
      extension.resourceIdentity({
        url: 'postgresql://original@database.invalid/vectors?host=elsewhere.invalid&user=user',
      }),
    ).toBe(
      extension.resourceIdentity({
        host: 'elsewhere.invalid',
        database: 'vectors',
        user: 'user',
      }),
    );
    expect(() =>
      extension.parseConfig({ url: 'postgresql://database.invalid/vectors' }),
    ).toThrow();
    expect(() =>
      extension.parseConfig({
        url: 'postgresql://user@database.invalid/vectors?port=invalid',
      }),
    ).toThrow();
  });
  it.each([1e50, 1e-50])(
    'rejects vectors that become invalid after float32 encoding (%s) before IO',
    async (value) => {
      await expect(
        backend.search(
          target,
          {
            channel: 'vector',
            query: { kind: 'vector', vector: [value, 0, 0] },
            scopes: [{ spaceId: 'space', gates: [''] }],
            limit: 1,
          },
          new AbortController().signal,
        ),
      ).rejects.toThrow();
      expect(fixture.options).not.toHaveBeenCalled();
    },
  );
  it.each(['replace', 'vectors', 'search'] as const)(
    'checks control ownership again on every %s operation',
    async (operation) => {
      fixture.query.mockImplementation(async (sql: string) => ({
        rows: sql.includes('obj_description')
          ? [{ kind: 'r', marker: 'foreign-owner' }]
          : [],
      }));
      const signal = new AbortController().signal;
      const result =
        operation === 'replace'
          ? backend.replaceDocument(
              target,
              {
                docId: 'doc',
                spaceId: 'space',
                revision: '3',
                snapshotHash: fixture.snapshot,
                deleted: true,
              },
              (async function* () {})(),
              signal,
            )
          : operation === 'vectors'
            ? backend.vectorsOf(
                target,
                'doc',
                [{ chunkId: 'chunk', contentHash: 'hash' }],
                signal,
              )
            : backend.search(
                target,
                {
                  channel: 'vector',
                  query: { kind: 'vector', vector: [1, 0, 0] },
                  scopes: [{ spaceId: 'space', gates: [''] }],
                  limit: 1,
                },
                signal,
              );
      await expect(result).rejects.toMatchObject({
        code: 'INDEXING_TARGET_OWNERSHIP_CONFLICT',
      });
      expect(
        fixture.query.mock.calls.some(([sql]) =>
          /^(INSERT|UPDATE|DELETE|DROP)/.test(sql),
        ),
      ).toBe(false);
    },
  );
  it('materializes authorized scopes before exact cosine ranking and binds all values', async () => {
    expect(
      await backend.search(
        target,
        {
          channel: 'vector',
          query: { kind: 'vector', vector: [1, 0, 0] },
          scopes: [{ spaceId: 'private-looking-id', gates: ['allowed-gate'] }],
          limit: 1,
        },
        new AbortController().signal,
      ),
    ).toEqual([{ chunkId: 'visible', score: 0.5 }]);
    const call = fixture.query.mock.calls.find(([sql]) =>
      sql.startsWith('WITH authorized'),
    )!;
    expect(call[0]).toContain('WITH authorized AS MATERIALIZED');
    expect(call[0]).toContain(
      'WHERE ("spaceId"=$2 AND "gate"=ANY($3::varchar[]))',
    );
    expect(call[0]).toContain('FROM authorized ORDER BY');
    expect(call[0]).toContain('OPERATOR("public".<=>)');
    expect(call[1]).toEqual([
      '[1,0,0]',
      'private-looking-id',
      ['allowed-gate'],
      1,
    ]);
    expect(call[0]).not.toContain('private-looking-id');
    expect(
      fixture.query.mock.calls.some(([sql]) => sql.endsWith('FOR SHARE')),
    ).toBe(true);
    expect(fixture.options).toHaveBeenCalledWith(
      expect.objectContaining({
        max: 5,
        connectionTimeoutMillis: 10000,
        statement_timeout: 10000,
      }),
    );
    expect(fixture.query).toHaveBeenCalledWith(
      "SET LOCAL statement_timeout = '5000ms'",
    );
  });
  it('fences old and duplicate document snapshots before any entry writes', async () => {
    const document = {
      docId: 'doc',
      spaceId: 'space',
      revision: '1',
      snapshotHash: fixture.snapshot,
      deleted: true,
    };
    expect(
      await backend.replaceDocument(
        target,
        document,
        (async function* () {})(),
        new AbortController().signal,
      ),
    ).toBe('obsolete');
    expect(
      await backend.replaceDocument(
        target,
        { ...document, revision: '2' },
        (async function* () {})(),
        new AbortController().signal,
      ),
    ).toBe('alreadyApplied');
    await expect(
      backend.replaceDocument(
        target,
        { ...document, revision: '2', snapshotHash: 'c'.repeat(64) },
        (async function* () {})(),
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'INDEXING_SNAPSHOT_CONFLICT' });
    expect(
      fixture.query.mock.calls.some(([sql]) => sql.startsWith('DELETE FROM')),
    ).toBe(false);
    expect(
      fixture.query.mock.calls.some(([sql]) => sql.endsWith('FOR UPDATE')),
    ).toBe(true);
  });
  it('refuses foreign control tables before any CREATE, ALTER or DROP', async () => {
    fixture.query.mockImplementation(async (sql: string) => ({
      rows: sql.includes('obj_description')
        ? [{ kind: 'r', marker: 'foreign-owner' }]
        : [],
    }));
    await expect(
      backend.ensureTarget(target, new AbortController().signal),
    ).rejects.toMatchObject({ code: 'INDEXING_TARGET_OWNERSHIP_CONFLICT' });
    expect(
      fixture.query.mock.calls.some(([sql]) =>
        /^(CREATE|ALTER|DROP)/.test(sql),
      ),
    ).toBe(false);
  });
  it('does not let a closed fence or closed pool serve a query', async () => {
    fixture.state = 'closed';
    await expect(
      backend.search(
        target,
        {
          channel: 'vector',
          query: { kind: 'vector', vector: [1, 0, 0] },
          scopes: [{ spaceId: 'space', gates: [''] }],
          limit: 1,
        },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'INDEXING_TARGET_OWNERSHIP_CONFLICT' });
    await backend.close();
    const count = fixture.query.mock.calls.length;
    await expect(
      backend.vectorsOf(target, 'doc', [], new AbortController().signal),
    ).rejects.toMatchObject({ code: 'INDEXING_UNAVAILABLE' });
    expect(fixture.query).toHaveBeenCalledTimes(count);
  });
  it('sanitizes raw database diagnostics but preserves the public transient code', async () => {
    fixture.query.mockRejectedValueOnce(
      Object.assign(new Error('private-password and host details'), {
        code: '40P01',
      }),
    );
    await expect(
      backend.ensureTarget(target, new AbortController().signal),
    ).rejects.toMatchObject({
      code: '40P01',
      message: 'Knowledge index storage is unavailable.',
    });
  });
});
