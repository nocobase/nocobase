import type { Pool, PoolClient } from 'pg';
import { z } from 'zod';
import { invalid, KnowledgeError } from '../../errors.js';
import type {
  IndexingBackendContext,
  IndexingItem,
  IndexingTarget,
  KnowledgeIndexingBackend,
} from '../../indexing/types.js';
import { revisionOf, sha256, validateVectors } from '../../indexing/vector.js';
import { pgConfiguration, parsePgSettings } from './config.js';

const MARKER = '@nocobase/app-plugin-knowledge/indexing/v1';
const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
const ownership = () =>
  invalid(
    'INDEXING_TARGET_OWNERSHIP_CONFLICT',
    'Knowledge index target ownership does not match.',
  );
const controlShape = [
  ['namespace', 'character varying(64)', true],
  ['generationId', 'character varying(64)', true],
  ['identityHash', 'character varying(64)', true],
  ['targetName', 'character varying(63)', true],
  ['dimension', 'integer', false],
  ['contractVersion', 'integer', true],
  ['state', 'character varying(16)', true],
  ['createdAt', 'timestamp with time zone', true],
  ['closedAt', 'timestamp with time zone', false],
] as const;
const documentShape = [
  ['docId', 'character varying(64)', true],
  ['revision', 'bigint', true],
  ['snapshotHash', 'character varying(64)', true],
  ['deleted', 'boolean', true],
  ['updatedAt', 'timestamp with time zone', true],
] as const;
function storageError(error: unknown): Error {
  if (error instanceof KnowledgeError) return error;
  const code =
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    /^[A-Z0-9]{5,20}$/.test(error.code)
      ? error.code
      : 'INDEXING_UNAVAILABLE';
  return Object.assign(new Error('Knowledge index storage is unavailable.'), {
    code,
  });
}
/** Lazy, dedicated pool: no application or Agents vector connection is borrowed. */
export function createPgvectorBackend(
  context: IndexingBackendContext,
): KnowledgeIndexingBackend {
  const config = pgConfiguration(context.config);
  const controlName = '__kb_index_targets';
  const qualified = (name: string) => quote(config.schema) + '.' + quote(name);
  const control = qualified(controlName);
  let opening: Promise<Pool> | undefined;
  let closing: Promise<void> | undefined;
  let closed = false;
  function check(signal: AbortSignal) {
    signal.throwIfAborted();
    if (closed)
      throw invalid(
        'INDEXING_UNAVAILABLE',
        'Knowledge index storage is closed.',
      );
  }
  async function pool(): Promise<Pool> {
    if (closed)
      throw invalid(
        'INDEXING_UNAVAILABLE',
        'Knowledge index storage is closed.',
      );
    opening ??= (async () => {
      const { Pool } = await import('pg');
      if (closed)
        throw invalid(
          'INDEXING_UNAVAILABLE',
          'Knowledge index storage is closed.',
        );
      const instance = new Pool({
        ...(config.url
          ? { connectionString: config.url }
          : {
              host: config.host,
              port: config.port,
              database: config.database,
              user: config.user,
              password: config.password,
            }),
        ssl: config.ssl,
        max: 5,
        connectionTimeoutMillis: 10000,
        statement_timeout: 10000,
        query_timeout: 10000,
      });
      instance.on('error', () =>
        context.onError(
          'INDEXING_UNAVAILABLE',
          new Error('Knowledge index storage is unavailable.'),
        ),
      );
      return instance;
    })();
    return opening;
  }
  async function transaction<T>(
    signal: AbortSignal,
    run: (client: PoolClient) => Promise<T>,
    timeout = 10000,
  ): Promise<T> {
    check(signal);
    let client: PoolClient | undefined;
    try {
      client = await (await pool()).connect();
      check(signal);
      await client.query('BEGIN');
      await client.query(
        timeout === 5000
          ? "SET LOCAL statement_timeout = '5000ms'"
          : "SET LOCAL statement_timeout = '10000ms'",
      );
      const value = await run(client);
      check(signal);
      await client.query('COMMIT');
      return value;
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      throw storageError(error);
    } finally {
      client?.release();
    }
  }
  function names(target: IndexingTarget) {
    if (
      target.type !== 'pgvector' ||
      target.contractVersion !== 1 ||
      !target.namespace ||
      target.namespace.length > 64 ||
      !target.generationId ||
      target.generationId.length > 64
    )
      throw ownership();
    parsePgSettings(target.options);
    const table =
      config.table +
      '_g_' +
      sha256(target.namespace + ':' + target.generationId).slice(0, 24);
    return { entries: table, documents: table + '_docs' };
  }
  async function metadata(client: PoolClient, table: string) {
    const result = await client.query(
      "SELECT c.relkind AS kind, obj_description(c.oid,'pg_class') AS marker FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND c.relname=$2",
      [config.schema, table],
    );
    return z
      .array(z.object({ kind: z.string(), marker: z.string().nullable() }))
      .parse(result.rows)[0];
  }
  async function assertLayout(
    client: PoolClient,
    table: string,
    shape: readonly (readonly [string, string, boolean])[],
    primary: readonly string[],
    unique: readonly string[] = [],
  ) {
    const info = await metadata(client, table);
    if (!info || info.kind !== 'r' || info.marker !== MARKER) throw ownership();
    const columns = z
      .array(
        z.object({ name: z.string(), type: z.string(), required: z.boolean() }),
      )
      .parse(
        (
          await client.query(
            'SELECT a.attname AS name, pg_catalog.format_type(a.atttypid,a.atttypmod) AS type, a.attnotnull AS required FROM pg_attribute a WHERE a.attrelid=$1::regclass AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum',
            [qualified(table)],
          )
        ).rows,
      );
    if (
      columns.length !== shape.length ||
      columns.some(
        (column, index) =>
          column.name !== shape[index][0] ||
          column.type !== shape[index][1] ||
          column.required !== shape[index][2],
      )
    )
      throw ownership();
    const constraints = z
      .array(z.object({ kind: z.string(), columns: z.array(z.string()) }))
      .parse(
        (
          await client.query(
            "SELECT c.contype AS kind, array_agg(a.attname::text ORDER BY k.ordinality) AS columns FROM pg_constraint c CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY k(attnum,ordinality) JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.attnum WHERE c.conrelid=$1::regclass AND c.contype IN ('p','u') GROUP BY c.oid,c.contype",
            [qualified(table)],
          )
        ).rows,
      );
    if (
      constraints.length !== (unique.length ? 2 : 1) ||
      !constraints.some(
        (item) =>
          item.kind === 'p' && item.columns.join(',') === primary.join(','),
      ) ||
      (unique.length &&
        !constraints.some(
          (item) =>
            item.kind === 'u' && item.columns.join(',') === unique.join(','),
        ))
    )
      throw ownership();
  }
  async function mark(client: PoolClient, table: string) {
    await client.query(
      'COMMENT ON TABLE ' + qualified(table) + " IS '" + MARKER + "'",
    );
  }
  async function ensureControl(client: PoolClient) {
    // A storage DDL lock, never a business execution lease.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
      config.schema + '.' + controlName,
    ]);
    if (!(await metadata(client, controlName))) {
      await client.query(
        'CREATE TABLE ' +
          control +
          ' ("namespace" varchar(64) NOT NULL,"generationId" varchar(64) NOT NULL,"identityHash" varchar(64) NOT NULL,"targetName" varchar(63) NOT NULL UNIQUE,"dimension" integer,"contractVersion" integer NOT NULL,"state" varchar(16) NOT NULL,"createdAt" timestamptz NOT NULL,"closedAt" timestamptz,PRIMARY KEY ("namespace","generationId"))',
      );
      await mark(client, controlName);
    }
    await assertLayout(
      client,
      controlName,
      controlShape,
      ['namespace', 'generationId'],
      ['targetName'],
    );
  }
  async function owner(
    client: PoolClient,
    target: IndexingTarget,
    exclusive = false,
    allowClosed = false,
  ) {
    await assertLayout(
      client,
      controlName,
      controlShape,
      ['namespace', 'generationId'],
      ['targetName'],
    );
    const row = z
      .object({
        namespace: z.string(),
        generationId: z.string(),
        identityHash: z.string(),
        targetName: z.string(),
        dimension: z.number().int().nullable(),
        contractVersion: z.number().int(),
        state: z.string(),
      })
      .optional()
      .parse(
        (
          await client.query(
            'SELECT * FROM ' +
              control +
              ' WHERE "namespace"=$1 AND "generationId"=$2 FOR ' +
              (exclusive ? 'UPDATE' : 'SHARE'),
            [target.namespace, target.generationId],
          )
        ).rows[0],
      );
    if (
      !row ||
      row.identityHash !== target.identityHash ||
      row.targetName !== names(target).entries ||
      row.contractVersion !== target.contractVersion ||
      (!allowClosed && row.state !== 'open') ||
      !['open', 'closed'].includes(row.state) ||
      (row.dimension !== null &&
        target.dimension !== null &&
        row.dimension !== target.dimension)
    )
      throw ownership();
    if (!allowClosed) {
      await assertLayout(client, names(target).documents, documentShape, [
        'docId',
      ]);
      if (row.dimension !== null)
        await assertLayout(
          client,
          names(target).entries,
          await entryShape(client, row.dimension),
          ['chunkId'],
        );
    }
    return row;
  }
  async function vectorType(client: PoolClient): Promise<string> {
    const info = z
      .object({ schema: z.string() })
      .optional()
      .parse(
        (
          await client.query(
            "SELECT n.nspname AS schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='vector'",
          )
        ).rows[0],
      );
    if (!info)
      throw invalid(
        'INDEXING_VECTOR_EXTENSION_MISSING',
        'The vector extension must be installed by the database administrator.',
      );
    return quote(info.schema) + '.vector';
  }
  async function entryShape(client: PoolClient, dimension: number) {
    const type = await vectorType(client);
    // format_type quotes a non-visible extension schema; resolve its own canonical spelling.
    const formatted = z
      .object({ type: z.string() })
      .parse(
        (
          await client.query(
            'SELECT pg_catalog.format_type($1::regtype,$2) AS type',
            [type, dimension],
          )
        ).rows[0],
      );
    return [
      ['chunkId', 'character varying(64)', true],
      ['docId', 'character varying(64)', true],
      ['spaceId', 'character varying(64)', true],
      ['revision', 'bigint', true],
      ['version', 'integer', true],
      ['ordinal', 'integer', true],
      ['contentHash', 'character varying(64)', true],
      ['gate', 'character varying(132)', true],
      ['embedding', formatted.type, true],
    ] as const;
  }
  return {
    async ensureTarget(target, signal) {
      const { entries, documents } = names(target);
      await transaction(signal, async (client) => {
        await ensureControl(client);
        const existing =
          (
            await client.query(
              'SELECT 1 FROM ' +
                control +
                ' WHERE "namespace"=$1 AND "generationId"=$2',
              [target.namespace, target.generationId],
            )
          ).rows.length > 0;
        if (!existing) {
          if (
            (await metadata(client, entries)) ||
            (await metadata(client, documents))
          )
            throw ownership();
          await client.query(
            'INSERT INTO ' +
              control +
              ' ("namespace","generationId","identityHash","targetName","dimension","contractVersion","state","createdAt") VALUES ($1,$2,$3,$4,NULL,$5,\'open\',now()) ON CONFLICT ("namespace","generationId") DO NOTHING',
            [
              target.namespace,
              target.generationId,
              target.identityHash,
              entries,
              target.contractVersion,
            ],
          );
          await client.query(
            'CREATE TABLE ' +
              qualified(documents) +
              ' ("docId" varchar(64) PRIMARY KEY,"revision" bigint NOT NULL,"snapshotHash" varchar(64) NOT NULL,"deleted" boolean NOT NULL,"updatedAt" timestamptz NOT NULL)',
          );
          await mark(client, documents);
        }
        const row = await owner(client, target, true);
        await assertLayout(client, documents, documentShape, ['docId']);
        if (target.dimension !== null && row.dimension === null) {
          validateVectors(
            [Array.from({ length: target.dimension }, () => 1)],
            1,
            target.dimension,
          );
          if (await metadata(client, entries)) throw ownership();
          const type = await vectorType(client);
          await client.query(
            'CREATE TABLE ' +
              qualified(entries) +
              ' ("chunkId" varchar(64) PRIMARY KEY,"docId" varchar(64) NOT NULL,"spaceId" varchar(64) NOT NULL,"revision" bigint NOT NULL,"version" integer NOT NULL,"ordinal" integer NOT NULL,"contentHash" varchar(64) NOT NULL,"gate" varchar(132) NOT NULL,"embedding" ' +
              type +
              '(' +
              target.dimension +
              ') NOT NULL)',
          );
          await mark(client, entries);
          await client.query(
            'CREATE INDEX ' +
              quote(entries + '_doc') +
              ' ON ' +
              qualified(entries) +
              ' ("docId")',
          );
          await client.query(
            'CREATE INDEX ' +
              quote(entries + '_scope') +
              ' ON ' +
              qualified(entries) +
              ' ("spaceId","gate")',
          );
          await client.query(
            'UPDATE ' +
              control +
              ' SET "dimension"=$3 WHERE "namespace"=$1 AND "generationId"=$2',
            [target.namespace, target.generationId, target.dimension],
          );
        }
        if (target.dimension !== null)
          await assertLayout(
            client,
            entries,
            await entryShape(client, target.dimension),
            ['chunkId'],
          );
      });
    },
    async replaceDocument(target, document, input, signal) {
      check(signal);
      const { entries, documents } = names(target);
      const items: IndexingItem[] = [];
      const ids = new Set<string>();
      for await (const item of input) {
        check(signal);
        if (
          document.deleted ||
          item.docId !== document.docId ||
          item.spaceId !== document.spaceId ||
          !item.vector ||
          ids.has(item.chunkId)
        )
          throw invalid(
            'INDEXING_SNAPSHOT_CONFLICT',
            'Knowledge index snapshot does not match.',
          );
        ids.add(item.chunkId);
        const vector = Array.from(new Float32Array(item.vector));
        validateVectors([vector], 1, target.dimension);
        items.push({ ...item, vector });
      }
      const revision = revisionOf(document.revision);
      return transaction(signal, async (client) => {
        const row = await owner(client, target);
        if (items.length && row.dimension === null) throw ownership();
        await client.query(
          'INSERT INTO ' +
            qualified(documents) +
            ' ("docId","revision","snapshotHash","deleted","updatedAt") VALUES ($1,0,$2,true,now()) ON CONFLICT ("docId") DO NOTHING',
          [document.docId, '0'.repeat(64)],
        );
        const prior = z
          .object({
            revision: z.union([z.string(), z.number()]),
            snapshotHash: z.string(),
          })
          .parse(
            (
              await client.query(
                'SELECT "revision","snapshotHash" FROM ' +
                  qualified(documents) +
                  ' WHERE "docId"=$1 FOR UPDATE',
                [document.docId],
              )
            ).rows[0],
          );
        const comparison =
          BigInt(revision) - BigInt(revisionOf(prior.revision));
        if (comparison < 0n) return 'obsolete';
        if (comparison === 0n) {
          if (prior.snapshotHash !== document.snapshotHash)
            throw invalid(
              'INDEXING_SNAPSHOT_CONFLICT',
              'Knowledge index snapshot does not match.',
            );
          return 'alreadyApplied';
        }
        if (row.dimension !== null)
          await client.query(
            'DELETE FROM ' + qualified(entries) + ' WHERE "docId"=$1',
            [document.docId],
          );
        const type = items.length ? await vectorType(client) : '';
        for (const item of items) {
          check(signal);
          await client.query(
            'INSERT INTO ' +
              qualified(entries) +
              ' ("chunkId","docId","spaceId","revision","version","ordinal","contentHash","gate","embedding") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::' +
              type +
              ')',
            [
              item.chunkId,
              item.docId,
              item.spaceId,
              revision,
              item.version,
              item.ordinal,
              item.contentHash,
              item.gate,
              '[' + item.vector!.join(',') + ']',
            ],
          );
        }
        await client.query(
          'UPDATE ' +
            qualified(documents) +
            ' SET "revision"=$2,"snapshotHash"=$3,"deleted"=$4,"updatedAt"=now() WHERE "docId"=$1',
          [document.docId, revision, document.snapshotHash, document.deleted],
        );
        return 'applied';
      });
    },
    async vectorsOf(target, docId, chunks, signal) {
      check(signal);
      const { entries } = names(target);
      if (!chunks.length) return new Map();
      return transaction(signal, async (client) => {
        const row = await owner(client, target);
        if (row.dimension === null) return new Map();
        const expected = new Map(
          chunks.map((chunk) => [chunk.chunkId, chunk.contentHash]),
        );
        const rows = z
          .array(
            z.object({
              chunkId: z.string(),
              contentHash: z.string(),
              embedding: z.string(),
            }),
          )
          .parse(
            (
              await client.query(
                'SELECT "chunkId","contentHash","embedding"::text AS embedding FROM ' +
                  qualified(entries) +
                  ' WHERE "docId"=$1 AND "chunkId"=ANY($2::varchar[])',
                [docId, [...expected.keys()]],
              )
            ).rows,
          );
        const result = new Map<string, readonly number[]>();
        for (const item of rows)
          if (expected.get(item.chunkId) === item.contentHash) {
            const vector = z
              .array(z.number().finite())
              .parse(JSON.parse(item.embedding));
            validateVectors([vector], 1, row.dimension);
            result.set(item.chunkId, vector);
          }
        return result;
      });
    },
    async search(target, request, signal) {
      check(signal);
      const { entries } = names(target);
      if (request.channel !== 'vector' || request.query.kind !== 'vector')
        throw invalid(
          'INDEXING_UNAVAILABLE',
          'Unsupported Knowledge index query.',
        );
      if (!request.scopes.length) return [];
      const vector = Array.from(new Float32Array(request.query.vector));
      validateVectors([vector], 1, target.dimension);
      const limit = z.number().int().min(1).max(1000).parse(request.limit);
      return transaction(
        signal,
        async (client) => {
          const row = await owner(client, target);
          if (row.dimension === null) return [];
          validateVectors([vector], 1, row.dimension);
          const type = await vectorType(client);
          const params: unknown[] = ['[' + vector.join(',') + ']'];
          const scope = request.scopes
            .filter((item) => item.gates.length)
            .map((item) => {
              params.push(item.spaceId, [...item.gates]);
              return (
                '("spaceId"=$' +
                (params.length - 1) +
                ' AND "gate"=ANY($' +
                params.length +
                '::varchar[]))'
              );
            });
          if (!scope.length) return [];
          params.push(limit);
          const sql =
            'WITH authorized AS MATERIALIZED (SELECT "chunkId","embedding" FROM ' +
            qualified(entries) +
            ' WHERE ' +
            scope.join(' OR ') +
            ') SELECT "chunkId", 1-("embedding" OPERATOR(' +
            type.slice(0, -7) +
            '.<=>) $1::' +
            type +
            ') AS score FROM authorized ORDER BY score DESC,"chunkId" ASC LIMIT $' +
            params.length;
          return z
            .array(
              z.object({ chunkId: z.string(), score: z.number().finite() }),
            )
            .parse((await client.query(sql, params)).rows);
        },
        5000,
      );
    },
    async dropTarget(target, signal) {
      const { entries, documents } = names(target);
      await transaction(signal, async (client) => {
        await ensureControl(client);
        const exists =
          (
            await client.query(
              'SELECT 1 FROM ' +
                control +
                ' WHERE "namespace"=$1 AND "generationId"=$2',
              [target.namespace, target.generationId],
            )
          ).rows.length > 0;
        if (!exists) {
          if (
            (await metadata(client, entries)) ||
            (await metadata(client, documents))
          )
            throw ownership();
          await client.query(
            'INSERT INTO ' +
              control +
              ' ("namespace","generationId","identityHash","targetName","dimension","contractVersion","state","createdAt","closedAt") VALUES ($1,$2,$3,$4,$5,$6,\'closed\',now(),now())',
            [
              target.namespace,
              target.generationId,
              target.identityHash,
              entries,
              target.dimension,
              target.contractVersion,
            ],
          );
          return;
        }
        const row = await owner(client, target, true, true);
        if (await metadata(client, documents))
          await assertLayout(client, documents, documentShape, ['docId']);
        if (await metadata(client, entries)) {
          if (row.dimension === null) throw ownership();
          await assertLayout(
            client,
            entries,
            await entryShape(client, row.dimension),
            ['chunkId'],
          );
        }
        await client.query(
          'UPDATE ' +
            control +
            ' SET "state"=\'closed\',"closedAt"=coalesce("closedAt",now()) WHERE "namespace"=$1 AND "generationId"=$2',
          [target.namespace, target.generationId],
        );
        await client.query('DROP TABLE IF EXISTS ' + qualified(entries));
        await client.query('DROP TABLE IF EXISTS ' + qualified(documents));
      });
    },
    async close() {
      closed = true;
      closing ??= opening
        ? opening.then((instance) => instance.end())
        : Promise.resolve();
      await closing;
    },
  };
}
