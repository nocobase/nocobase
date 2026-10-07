/**
 * The `sqlite-vec` vector store, the default: a SQLite file of its own (`agents.vectors.path`, `storage/vectors.sqlite`
 * by default) opened with better-sqlite3 and the sqlite-vec extension, so vectors work with no service to run. It is
 * local to the instance: an application running several instances keeps vectors in pgvector instead.
 *
 * One table per index (`agv_<index>`): `id` text primary key, `embedding` as a float32 blob, `metadata` JSON text, and an
 * index on each filterable key's text value; `agv__meta` keeps each index's metric and dimension. A query is exact:
 * it filters in its WHERE clause, orders what passes by sqlite-vec's distance and takes `topK`, so a filter always
 * applies before the limit.
 */
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

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

export const SQLITE_VEC = 'sqlite-vec';
/** The file under the application's storage directory when `path` is not set. */
export const SQLITE_VEC_FILE = 'vectors.sqlite';
const DIMENSION_MAX = 16000;
const require = createRequire(import.meta.url);
const META = 'agv__meta';

/** What this store needs of a better-sqlite3 database. */
interface Statement {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}
interface SqliteDatabase {
  exec(sql: string): unknown;
  prepare(sql: string): Statement;
  pragma(sql: string): unknown;
  transaction<T extends (...args: never[]) => unknown>(fn: T): T;
  function(
    name: string,
    options: { deterministic: boolean },
    fn: (a: unknown, b: unknown) => number | null,
  ): unknown;
  loadExtension(path: string): void;
  close(): void;
}

const quote = (identifier: string): string =>
  `"${identifier.replace(/"/gu, '""')}"`;

/** The text value of a metadata key, as filters compare it (and its index is on). */
const fieldOf = (key: string): string =>
  `cast(json_extract(metadata, '$."${keyOf(key)}"') as text)`;

/** A filter value as the text `fieldOf` answers: SQLite keeps JSON booleans as 1 and 0. */
const textOf = (value: string | number | boolean): string =>
  typeof value === 'boolean' ? (value ? '1' : '0') : String(value);

/** The WHERE condition of a filter, with its parameters. */
export function sqliteWhereOf(filter: VectorFilter | undefined): {
  sql: string;
  params: unknown[];
} {
  const parts: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(filter ?? {})) {
    if (typeof value === 'object' && value !== null) {
      if (value.in.length === 0) {
        parts.push('0');
        continue;
      }
      parts.push(`${fieldOf(key)} in (select value from json_each(?))`);
      params.push(JSON.stringify(value.in.map(textOf)));
    } else {
      parts.push(`${fieldOf(key)} = ?`);
      params.push(textOf(value));
    }
  }
  return { sql: parts.length > 0 ? parts.join(' and ') : '1', params };
}

const blobOf = (vector: readonly number[]): Buffer => {
  const values = new Float32Array(vector.length);
  vector.forEach((value, at) => {
    if (!Number.isFinite(value))
      throw new Error('A vector holds a value that is not a finite number.');
    values[at] = value;
  });
  return Buffer.from(values.buffer);
};

const floatsOf = (value: unknown): Float32Array | null =>
  Buffer.isBuffer(value)
    ? new Float32Array(
        value.buffer.slice(value.byteOffset, value.byteOffset + value.length),
      )
    : null;

function metadataOf(value: unknown): VectorMetadata {
  if (typeof value !== 'string') return {};
  try {
    return JSON.parse(value) as VectorMetadata;
  } catch {
    return {};
  }
}

/** The file of the store: `path` against the application root, else `storage/vectors.sqlite`. */
export function sqliteVecFileOf(context: VectorStoreContext): string {
  const configured = context.config.path;
  return typeof configured === 'string' && configured.trim()
    ? resolve(context.paths.root, configured)
    : resolve(context.paths.storage, SQLITE_VEC_FILE);
}

/** The file as people see it: relative to the application root when it is inside it. */
function targetOf(file: string, root: string): string {
  const inside = relative(root, file);
  return inside && !inside.startsWith('..') && !isAbsolute(inside)
    ? inside.split('\\').join('/')
    : file;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export function createSqliteVecStore(context: VectorStoreContext): VectorStore {
  const file = sqliteVecFileOf(context);
  const metrics = new Map<string, VectorMetric>();
  let opened: Promise<SqliteDatabase> | null = null;
  let db: SqliteDatabase | null = null;

  async function open(): Promise<SqliteDatabase> {
    let Database: new (file: string) => SqliteDatabase;
    let extension: { getLoadablePath(): string };
    try {
      // better-sqlite3 ships no type declarations; this store needs only the methods `SqliteDatabase` names.
      Database = require('better-sqlite3') as typeof Database;
      extension = await import('sqlite-vec');
    } catch (error) {
      throw Object.assign(new Error(messageOf(error)), {
        code: 'SQLITE_VEC_UNSUPPORTED',
      });
    }
    let handle: SqliteDatabase;
    try {
      mkdirSync(dirname(file), { recursive: true });
      handle = new Database(file);
      handle.pragma('journal_mode = WAL');
      handle.pragma('busy_timeout = 5000');
    } catch (error) {
      throw Object.assign(new Error(messageOf(error)), {
        code: 'SQLITE_VEC_OPEN_FAILED',
      });
    }
    try {
      handle.loadExtension(extension.getLoadablePath());
    } catch (error) {
      handle.close();
      throw Object.assign(new Error(messageOf(error)), {
        code: 'SQLITE_VEC_UNSUPPORTED',
      });
    }
    // sqlite-vec has no inner-product distance; the dot product of two float32 blobs, for `ip` indexes.
    handle.function('agv_ip', { deterministic: true }, (a, b) => {
      const x = floatsOf(a);
      const y = floatsOf(b);
      if (!x || !y || x.length !== y.length) return null;
      let dot = 0;
      for (let at = 0; at < x.length; at += 1) dot += x[at] * y[at];
      return dot;
    });
    handle.exec(
      `create table if not exists ${META} (name text primary key, dimension integer not null, metric text not null)`,
    );
    db = handle;
    return handle;
  }

  /** The database, opened once; a failed open is tried again next time. */
  function database(): Promise<SqliteDatabase> {
    opened ??= open().catch((error: unknown) => {
      opened = null;
      throw error;
    });
    return opened;
  }

  async function metricOf(index: string): Promise<VectorMetric> {
    const table = tableOf(index);
    const known = metrics.get(table);
    if (known) return known;
    const row = (await database())
      .prepare(`select metric from ${META} where name = ?`)
      .get(table) as { metric: VectorMetric } | undefined;
    if (!row) throw new Error(`The vector index ${index} is not there.`);
    metrics.set(table, row.metric);
    return row.metric;
  }

  return {
    type: SQLITE_VEC,
    target: targetOf(file, context.paths.root),

    async available(): Promise<VectorAvailability> {
      try {
        await database();
        return { ok: true };
      } catch (error) {
        const code = (error as { code?: unknown }).code;
        return {
          ok: false,
          code:
            code === 'SQLITE_VEC_OPEN_FAILED'
              ? 'SQLITE_VEC_OPEN_FAILED'
              : 'SQLITE_VEC_UNSUPPORTED',
          message: `sqlite-vec could not open ${file}: ${messageOf(error)}`,
        };
      }
    },

    async createIndex(spec: VectorIndexSpec) {
      const table = tableOf(spec.name);
      const dimension = Math.trunc(spec.dimension);
      if (!(dimension > 0 && dimension <= DIMENSION_MAX))
        throw new Error(
          `A vector dimension of ${spec.dimension} is not usable.`,
        );
      if (!['cosine', 'l2', 'ip'].includes(spec.metric))
        throw new Error(`The vector metric ${spec.metric} is not known.`);
      const sql = await database();
      sql.transaction(() => {
        sql.exec(
          `create table if not exists ${quote(table)} (
             id text primary key,
             embedding blob not null,
             metadata text not null default '{}'
           )`,
        );
        sql
          .prepare(
            `insert into ${META} (name, dimension, metric) values (?, ?, ?)
               on conflict (name) do update set dimension = excluded.dimension, metric = excluded.metric`,
          )
          .run(table, dimension, spec.metric);
        for (const [at, key] of (spec.filterable ?? []).entries())
          sql.exec(
            `create index if not exists ${quote(`${table}_k${at}`)} on ${quote(table)} (${fieldOf(key)})`,
          );
      })();
      metrics.set(table, spec.metric);
    },

    async dropIndex(name) {
      const table = tableOf(name);
      const sql = await database();
      sql.transaction(() => {
        sql.exec(`drop table if exists ${quote(table)}`);
        sql.prepare(`delete from ${META} where name = ?`).run(table);
      })();
      metrics.delete(table);
    },

    async upsert(index, items) {
      if (items.length === 0) return;
      const sql = await database();
      const insert = sql.prepare(
        `insert into ${quote(tableOf(index))} (id, embedding, metadata) values (?, ?, ?)
           on conflict (id) do update set embedding = excluded.embedding, metadata = excluded.metadata`,
      );
      sql.transaction(() => {
        for (const item of items)
          insert.run(
            item.id,
            blobOf(item.vector),
            JSON.stringify(item.metadata),
          );
      })();
    },

    async update(index, items) {
      if (items.length === 0) return;
      const sql = await database();
      const update = sql.prepare(
        `update ${quote(tableOf(index))} set metadata = ? where id = ?`,
      );
      sql.transaction(() => {
        for (const item of items)
          update.run(JSON.stringify(item.metadata), item.id);
      })();
    },

    async query(index, request) {
      const table = tableOf(index);
      const metric = await metricOf(index);
      const topK = Math.max(1, Math.min(Math.trunc(request.topK), 1000));
      const where = sqliteWhereOf(request.filter);
      const distance =
        metric === 'cosine'
          ? 'vec_distance_cosine(embedding, ?)'
          : metric === 'l2'
            ? 'vec_distance_l2(embedding, ?)'
            : '-agv_ip(embedding, ?)';
      const rows = (await database())
        .prepare(
          `select id, ${distance} as distance, metadata
             from ${quote(table)}
            where ${where.sql}
            order by distance
            limit ${topK}`,
        )
        .all(blobOf(request.vector), ...where.params) as {
        id: string;
        distance: number;
        metadata: string;
      }[];
      return rows.map((row): VectorMatch => {
        const distance = Number(row.distance);
        return {
          id: row.id,
          score: metric === 'cosine' ? 1 - distance : -distance,
          metadata: metadataOf(row.metadata),
        };
      });
    },

    async delete(index, target) {
      const table = quote(tableOf(index));
      const sql = await database();
      if ('ids' in target) {
        if (target.ids.length === 0) return;
        sql
          .prepare(
            `delete from ${table} where id in (select value from json_each(?))`,
          )
          .run(JSON.stringify(target.ids));
        return;
      }
      const where = sqliteWhereOf(target.filter);
      sql
        .prepare(`delete from ${table} where ${where.sql}`)
        .run(...where.params);
    },

    close() {
      const handle = db;
      db = null;
      opened = null;
      metrics.clear();
      handle?.close();
      return Promise.resolve();
    },
  };
}

export const sqliteVecStoreType: VectorStoreType = {
  type: SQLITE_VEC,
  create: createSqliteVecStore,
};
