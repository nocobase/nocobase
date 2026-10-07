/**
 * The `pgvector` vector store: SQL over a PostgreSQL database of its own with the `vector` extension, reached with the
 * connection settings of `agents.vectors` (`url`, or `host`, `port`, `database`, `user`, `password`; `ssl`), never the
 * application's database connection. It is available once that database answers and the extension is there or can
 * be created.
 *
 * One table per index (`agv_<index>`): `id` text primary key, `embedding` as `vector(<dimension>)` (`halfvec` from
 * 2001 to 4000 dimensions, which HNSW indexes only up to then; above 4000 it is `vector` without an index, searched
 * exactly), `metadata` jsonb. An HNSW index with the metric's operator class, and a btree index on
 * `metadata->>'<key>'` for each filterable key. A query filters in its WHERE clause before ordering by distance and
 * taking `topK`, in a transaction that turns on pgvector's iterative index scans (0.8 and later; ignored before) so a
 * selective filter still finds `topK` items. A large delete vacuums the table, so the HNSW graph forgets the rows.
 */
import { keyOf, tableOf } from './naming.js';
import type {
  VectorAvailability,
  VectorFilter,
  VectorIndexSpec,
  VectorMatch,
  VectorMetadata,
  VectorMetric,
  VectorStore,
  VectorStoreContext,
  VectorStoreType,
} from './types.js';

/** What this store needs of its client (knex). */
interface SqlClient {
  raw(sql: string, bindings?: readonly unknown[]): Promise<unknown>;
  transaction<T>(fn: (trx: SqlClient) => Promise<T>): Promise<T>;
}

interface KnexClient extends SqlClient {
  destroy(): Promise<void>;
}

type KnexFactory = (config: Record<string, unknown>) => KnexClient;

export const PGVECTOR = 'pgvector';
/** The largest dimension `vector` takes an HNSW index at. */
const VECTOR_HNSW_MAX = 2000;
/** The largest dimension `halfvec` takes an HNSW index at. */
const HALFVEC_HNSW_MAX = 4000;
/** Deleting this many rows at once (or as many as are left) vacuums the table. */
const VACUUM_AFTER = 500;

const OPERATORS: Readonly<Record<VectorMetric, string>> = {
  cosine: '<=>',
  l2: '<->',
  ip: '<#>',
};

const OPCLASS: Readonly<Record<VectorMetric, string>> = {
  cosine: 'cosine_ops',
  l2: 'l2_ops',
  ip: 'ip_ops',
};

const rowsOf = <T>(result: unknown): T[] =>
  (result as { rows?: T[] } | undefined)?.rows ?? [];

const quote = (identifier: string): string =>
  `"${identifier.replace(/"/gu, '""')}"`;

/** A metadata key as an SQL literal, so a filter matches its expression index; only plain keys are taken. */
function keyLiteral(key: string): string {
  return `'${keyOf(key)}'`;
}

const vectorText = (vector: readonly number[]): string => {
  for (const value of vector)
    if (!Number.isFinite(value))
      throw new Error('A vector holds a value that is not a finite number.');
  return `[${vector.join(',')}]`;
};

/** The WHERE condition of a filter, with its bindings. */
export function whereOf(filter: VectorFilter | undefined): {
  sql: string;
  bindings: unknown[];
} {
  const parts: string[] = [];
  const bindings: unknown[] = [];
  for (const [key, value] of Object.entries(filter ?? {})) {
    const field = `metadata->>${keyLiteral(key)}`;
    if (typeof value === 'object' && value !== null) {
      if (value.in.length === 0) {
        parts.push('false');
        continue;
      }
      parts.push(`${field} = any(?::text[])`);
      bindings.push(value.in.map(String));
    } else {
      parts.push(`${field} = ?`);
      bindings.push(String(value));
    }
  }
  return { sql: parts.length > 0 ? parts.join(' and ') : 'true', bindings };
}

function metadataOf(value: unknown): VectorMetadata {
  if (typeof value === 'string')
    try {
      return JSON.parse(value) as VectorMetadata;
    } catch {
      return {};
    }
  return value && typeof value === 'object' ? (value as VectorMetadata) : {};
}

interface TableInfo {
  readonly type: 'vector' | 'halfvec';
  readonly metric: VectorMetric;
}

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

/** The `pg` connection settings of `agents.vectors`; null when it names no database server. */
export function pgvectorConnectionOf(
  config: Readonly<Record<string, unknown>>,
): Record<string, unknown> | null {
  const ssl =
    config.ssl === true || (config.ssl && typeof config.ssl === 'object')
      ? { ssl: config.ssl }
      : {};
  const url = text(config.url);
  if (url) return { connectionString: url, ...ssl };
  const host = text(config.host);
  if (!host) return null;
  const port = Number(config.port);
  return {
    host,
    ...(Number.isInteger(port) && port > 0 ? { port } : {}),
    ...(text(config.database) ? { database: text(config.database) } : {}),
    ...(text(config.user) ? { user: text(config.user) } : {}),
    ...(typeof config.password === 'string'
      ? { password: config.password }
      : {}),
    ...ssl,
  };
}

/** Where the store points, with no password and no query: `postgres://user@host:port/database`. */
export function pgvectorTargetOf(
  config: Readonly<Record<string, unknown>>,
): string {
  const url = text(config.url);
  if (url) {
    try {
      const parsed = new URL(url);
      const user = parsed.username ? `${parsed.username}@` : '';
      return `postgres://${user}${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname === '/' ? '' : parsed.pathname}`;
    } catch {
      return 'postgres://(invalid url)';
    }
  }
  const host = text(config.host);
  if (!host) return 'postgres://(not configured)';
  const user = text(config.user);
  const port = Number(config.port);
  const database = text(config.database);
  return `postgres://${user ? `${encodeURIComponent(user)}@` : ''}${host}:${Number.isInteger(port) && port > 0 ? port : 5432}${database ? `/${encodeURIComponent(database)}` : ''}`;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export function createPgvectorStore(
  context: VectorStoreContext,
  /** Makes the client; knex by default (for tests). */
  connect?: KnexFactory,
): VectorStore {
  const settings = pgvectorConnectionOf(context.config);
  const tables = new Map<string, TableInfo>();
  let ready: Promise<VectorAvailability> | null = null;
  let made: Promise<KnexClient> | null = null;

  function client(): Promise<KnexClient> {
    made ??= (async () => {
      if (!settings) throw new Error('pgvector has no connection settings.');
      const factory = connect ?? (await import('knex')).default;
      return factory({
        client: 'pg',
        connection: settings,
        pool: { min: 0, max: 4 },
      });
    })().catch((error: unknown) => {
      made = null;
      throw error;
    });
    return made;
  }

  async function check(): Promise<VectorAvailability> {
    if (!settings)
      return {
        ok: false,
        code: 'PGVECTOR_NOT_CONFIGURED',
        message:
          'pgvector needs agents.vectors.url, or agents.vectors.host and the rest of its connection settings.',
      };
    let sql: SqlClient;
    let present: { extversion: string }[];
    try {
      sql = await client();
      present = rowsOf<{ extversion: string }>(
        await sql.raw(
          "select extversion from pg_extension where extname = 'vector'",
        ),
      );
    } catch (error) {
      return {
        ok: false,
        code: 'PGVECTOR_CONNECTION_FAILED',
        message: `pgvector could not reach ${pgvectorTargetOf(context.config)}: ${messageOf(error)}`,
      };
    }
    if (present.length > 0) return { ok: true };
    try {
      await sql.raw('create extension if not exists vector');
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        code: 'PGVECTOR_EXTENSION_MISSING',
        message: `The pgvector extension is not installed in ${pgvectorTargetOf(context.config)} and could not be created: ${messageOf(error)}`,
      };
    }
  }

  /** The column type and metric of an index's table, read once. */
  async function infoOf(index: string): Promise<TableInfo> {
    const table = tableOf(index);
    const known = tables.get(table);
    if (known) return known;
    const sql = await client();
    const rows = rowsOf<{ type: string; comment: string | null }>(
      await sql.raw(
        `select format_type(a.atttypid, a.atttypmod) as type, obj_description(c.oid, 'pg_class') as comment
           from pg_attribute a join pg_class c on c.oid = a.attrelid
          where c.oid = to_regclass(?) and a.attname = 'embedding'`,
        [table],
      ),
    );
    const row = rows[0];
    if (!row) throw new Error(`The vector index ${index} is not there.`);
    const metric = (row.comment ?? 'cosine') as VectorMetric;
    const info: TableInfo = {
      type: row.type.startsWith('halfvec') ? 'halfvec' : 'vector',
      metric: metric in OPERATORS ? metric : 'cosine',
    };
    tables.set(table, info);
    return info;
  }

  /**
   * After a large delete, vacuums the table: until then an HNSW scan still walks the deleted rows' graph nodes and can
   * answer fewer rows than there are (or none, when most of the table went).
   */
  async function settle(table: string, result: unknown): Promise<void> {
    const deleted =
      (result as { rowCount?: number } | undefined)?.rowCount ?? 0;
    if (deleted === 0) return;
    const sql = await client();
    try {
      const left = Number(
        rowsOf<{ count: string | number }>(
          await sql.raw(`select count(*) as count from ${quote(table)}`),
        )[0]?.count ?? 0,
      );
      if (deleted >= VACUUM_AFTER || deleted >= left)
        await sql.raw(`vacuum ${quote(table)}`);
    } catch {
      // Autovacuum gets there in the end.
    }
  }

  return {
    type: PGVECTOR,
    target: pgvectorTargetOf(context.config),

    available() {
      // A failed check is tried again next time; a successful one holds.
      ready ??= check().then((result) => {
        if (!result.ok) ready = null;
        return result;
      });
      return ready;
    },

    async createIndex(spec: VectorIndexSpec) {
      const table = tableOf(spec.name);
      const dimension = Math.trunc(spec.dimension);
      if (!(dimension > 0 && dimension <= 16000))
        throw new Error(
          `A vector dimension of ${spec.dimension} is not usable.`,
        );
      if (!(spec.metric in OPERATORS))
        throw new Error(`The vector metric ${spec.metric} is not known.`);
      const type =
        dimension > VECTOR_HNSW_MAX && dimension <= HALFVEC_HNSW_MAX
          ? 'halfvec'
          : 'vector';
      const sql = await client();
      await sql.raw(
        `create table if not exists ${quote(table)} (
           id text primary key,
           embedding ${type}(${dimension}) not null,
           metadata jsonb not null default '{}'::jsonb
         )`,
      );
      await sql.raw(`comment on table ${quote(table)} is '${spec.metric}'`);
      if (dimension <= HALFVEC_HNSW_MAX)
        // `vector` up to 2000 dimensions, `halfvec` up to 4000; beyond, the table is searched exactly.
        await sql.raw(
          `create index if not exists ${quote(`${table}_hnsw`)} on ${quote(table)} using hnsw (embedding ${type}_${OPCLASS[spec.metric]})`,
        );
      for (const [at, key] of (spec.filterable ?? []).entries())
        await sql.raw(
          `create index if not exists ${quote(`${table}_k${at}`)} on ${quote(table)} ((metadata->>${keyLiteral(key)}))`,
        );
      tables.set(table, { type, metric: spec.metric });
    },

    async dropIndex(name) {
      const table = tableOf(name);
      await (await client()).raw(`drop table if exists ${quote(table)}`);
      tables.delete(table);
    },

    async upsert(index, items) {
      if (items.length === 0) return;
      const table = tableOf(index);
      const sql = await client();
      for (let at = 0; at < items.length; at += 200) {
        const batch = items.slice(at, at + 200);
        await sql.raw(
          `insert into ${quote(table)} (id, embedding, metadata) values ${batch.map(() => '(?, ?, ?::jsonb)').join(', ')}
             on conflict (id) do update set embedding = excluded.embedding, metadata = excluded.metadata`,
          batch.flatMap((item) => [
            item.id,
            vectorText(item.vector),
            JSON.stringify(item.metadata),
          ]),
        );
      }
    },

    async update(index, items) {
      if (items.length === 0) return;
      const table = tableOf(index);
      const sql = await client();
      await sql.transaction(async (trx) => {
        for (const item of items)
          await trx.raw(
            `update ${quote(table)} set metadata = ?::jsonb where id = ?`,
            [JSON.stringify(item.metadata), item.id],
          );
      });
    },

    async query(index, request) {
      const table = tableOf(index);
      const info = await infoOf(index);
      const topK = Math.max(1, Math.min(Math.trunc(request.topK), 1000));
      const where = whereOf(request.filter);
      const operator = OPERATORS[info.metric];
      const score =
        info.metric === 'cosine'
          ? `1 - (embedding ${operator} ?::${info.type})`
          : `-(embedding ${operator} ?::${info.type})`;
      const literal = vectorText(request.vector);
      const sql = await client();
      return sql.transaction(async (trx) => {
        await trx.raw(`select set_config('hnsw.ef_search', ?, true)`, [
          String(Math.min(1000, Math.max(40, topK * 2))),
        ]);
        // pgvector 0.8 and later scan the index further when the filter drops candidates; an earlier one has no such
        // setting and refuses it, which leaves the query as it was.
        await trx.raw('savepoint agv_iterative');
        try {
          await trx.raw(
            `select set_config('hnsw.iterative_scan', 'strict_order', true)`,
          );
          await trx.raw('release savepoint agv_iterative');
        } catch {
          await trx.raw('rollback to savepoint agv_iterative');
        }
        const rows = rowsOf<{ id: string; score: number; metadata: unknown }>(
          await trx.raw(
            `select id, ${score} as score, metadata
               from ${quote(table)}
              where ${where.sql}
              order by embedding ${operator} ?::${info.type}
              limit ${topK}`,
            [literal, ...where.bindings, literal],
          ),
        );
        return rows.map((row): VectorMatch => ({
          id: row.id,
          score: Number(row.score),
          metadata: metadataOf(row.metadata),
        }));
      });
    },

    async delete(index, target) {
      const table = tableOf(index);
      const sql = await client();
      if ('ids' in target) {
        if (target.ids.length === 0) return;
        await settle(
          table,
          await sql.raw(
            `delete from ${quote(table)} where id = any(?::text[])`,
            [[...target.ids]],
          ),
        );
        return;
      }
      const where = whereOf(target.filter);
      await settle(
        table,
        await sql.raw(
          `delete from ${quote(table)} where ${where.sql}`,
          where.bindings,
        ),
      );
    },

    async close() {
      const pending = made;
      made = null;
      ready = null;
      tables.clear();
      if (pending) await (await pending.catch(() => null))?.destroy();
    },
  };
}

export const pgvectorStoreType: VectorStoreType = {
  type: PGVECTOR,
  create: (context) => createPgvectorStore(context),
};
