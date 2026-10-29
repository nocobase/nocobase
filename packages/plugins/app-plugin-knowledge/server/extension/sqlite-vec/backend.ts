import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { z } from 'zod';

import type {
  IndexingBackendContext,
  IndexingTarget,
  KnowledgeIndexingBackend,
} from '../../indexing/types.js';
import { revisionOf, sha256, validateVectors } from '../../indexing/vector.js';
import { invalid } from '../../errors.js';
import { prepareSqliteVectorSpool } from './spool.js';

const controlSchema = z.object({
  namespace: z.string(),
  generationId: z.string(),
  identityHash: z.string(),
  targetName: z.string(),
  dimension: z.union([z.bigint(), z.number()]).nullable(),
  contractVersion: z.union([z.bigint(), z.number()]),
  state: z.enum(['open', 'closed']),
});
const manifestSchema = z.object({
  revision: z.union([z.bigint(), z.number(), z.string()]),
  snapshotHash: z.string(),
});
const ownershipError = () =>
  invalid(
    'INDEXING_TARGET_OWNERSHIP_CONFLICT',
    'Knowledge index target ownership does not match.',
  );
const names = (target: IndexingTarget) => {
  if (
    target.type !== 'sqlite-vec' ||
    target.contractVersion !== 1 ||
    !target.namespace ||
    target.namespace.length > 64 ||
    !target.generationId ||
    target.generationId.length > 64
  )
    throw ownershipError();
  const entries =
    'kb_g_' + sha256(target.namespace + ':' + target.generationId).slice(0, 24);
  return { entries, documents: entries + '_docs' };
};
function vectorBytes(vector: readonly number[]): Buffer {
  const encoded = new Float32Array(vector);
  validateVectors([Array.from(encoded)], 1, vector.length);
  return Buffer.from(encoded.buffer);
}

/** The native connection belongs to this backend, and is opened only by an accepted storage operation. */
export function createSqliteVecBackend(
  context: IndexingBackendContext,
): KnowledgeIndexingBackend {
  let opening: Promise<Database.Database> | undefined;
  let closed = false;
  async function database(): Promise<Database.Database> {
    if (closed)
      throw invalid(
        'INDEXING_UNAVAILABLE',
        'Knowledge index storage is closed.',
      );
    opening ??= (async () => {
      const { default: Sqlite } = await import('better-sqlite3');
      const vec = await import('sqlite-vec');
      if (typeof context.config.file !== 'string') throw ownershipError();
      const file = path.resolve(context.storagePath, context.config.file);
      await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
      const db = new Sqlite(file);
      try {
        db.defaultSafeIntegers(true);
        db.pragma('journal_mode = WAL');
        db.pragma('busy_timeout = 5000');
        vec.load(db);
        return db;
      } catch (error) {
        db.close();
        throw error;
      }
    })();
    const db = await opening;
    if (closed)
      throw invalid(
        'INDEXING_UNAVAILABLE',
        'Knowledge index storage is closed.',
      );
    return db;
  }
  function control(db: Database.Database, target: IndexingTarget) {
    const raw = db
      .prepare(
        'SELECT * FROM __kb_index_targets WHERE namespace=? AND generationId=?',
      )
      .get(target.namespace, target.generationId);
    if (!raw) throw ownershipError();
    const row = controlSchema.parse(raw);
    if (
      row.identityHash !== target.identityHash ||
      row.targetName !== names(target).entries ||
      Number(row.contractVersion) !== target.contractVersion ||
      row.state !== 'open'
    )
      throw ownershipError();
    if (
      target.dimension !== null &&
      row.dimension !== null &&
      Number(row.dimension) !== target.dimension
    )
      throw ownershipError();
    assertLayout(db, names(target).documents, [
      'docId',
      'revision',
      'snapshotHash',
      'deleted',
      'updatedAt',
    ]);
    if (row.dimension !== null)
      assertLayout(db, names(target).entries, [
        'chunkId',
        'docId',
        'spaceId',
        'revision',
        'version',
        'ordinal',
        'contentHash',
        'gate',
        'embedding',
      ]);
    return row;
  }
  function assertLayout(
    db: Database.Database,
    table: string,
    expected: readonly string[],
  ): void {
    const info = z
      .object({ type: z.string(), sql: z.string() })
      .optional()
      .parse(
        db
          .prepare('SELECT type,sql FROM sqlite_master WHERE name=?')
          .get(table),
      );
    if (!info || info.type !== 'table' || !/^CREATE TABLE\b/i.test(info.sql))
      throw ownershipError();
    const columns = z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          notnull: z.coerce.number(),
          pk: z.coerce.number(),
        }),
      )
      .parse(db.prepare('PRAGMA table_info("' + table + '")').all());
    const isControl = table === '__kb_index_targets';
    const primary = isControl
      ? ['namespace', 'generationId']
      : [table.endsWith('_docs') ? 'docId' : 'chunkId'];
    if (
      columns.length !== expected.length ||
      columns.some((column, index) => {
        const type =
          column.name === 'embedding'
            ? 'BLOB'
            : [
                  'dimension',
                  'contractVersion',
                  'revision',
                  'version',
                  'ordinal',
                  'deleted',
                ].includes(column.name)
              ? 'INTEGER'
              : 'TEXT';
        const required = !(
          isControl && ['dimension', 'closedAt'].includes(column.name)
        );
        return (
          column.name !== expected[index] ||
          column.type.toUpperCase() !== type ||
          column.notnull !== (required ? 1 : 0) ||
          column.pk !== primary.indexOf(column.name) + 1
        );
      })
    )
      throw ownershipError();
    const uniques = z
      .array(z.object({ name: z.string(), origin: z.string() }))
      .parse(db.prepare('PRAGMA index_list("' + table + '")').all())
      .filter((index) => index.origin === 'u');
    if (uniques.length !== (isControl ? 1 : 0)) throw ownershipError();
    if (isControl) {
      const name = uniques[0].name.replaceAll('"', '""');
      const keys = z
        .array(z.object({ name: z.string() }))
        .parse(db.prepare('PRAGMA index_info("' + name + '")').all());
      if (keys.length !== 1 || keys[0].name !== 'targetName')
        throw ownershipError();
    }
  }
  function ensureControl(db: Database.Database): void {
    const existing = db
      .prepare("SELECT name FROM sqlite_master WHERE name='__kb_index_targets'")
      .get();
    if (!existing)
      db.exec(
        'CREATE TABLE __kb_index_targets (namespace TEXT NOT NULL, generationId TEXT NOT NULL, identityHash TEXT NOT NULL, targetName TEXT NOT NULL UNIQUE, dimension INTEGER, contractVersion INTEGER NOT NULL, state TEXT NOT NULL, createdAt TEXT NOT NULL, closedAt TEXT, PRIMARY KEY(namespace,generationId))',
      );
    assertLayout(db, '__kb_index_targets', [
      'namespace',
      'generationId',
      'identityHash',
      'targetName',
      'dimension',
      'contractVersion',
      'state',
      'createdAt',
      'closedAt',
    ]);
  }
  return {
    async ensureTarget(target, signal) {
      signal.throwIfAborted();
      const db = await database();
      signal.throwIfAborted();
      const { entries, documents } = names(target);
      db.transaction(() => {
        ensureControl(db);
        const row = db
          .prepare(
            'SELECT * FROM __kb_index_targets WHERE namespace=? AND generationId=?',
          )
          .get(target.namespace, target.generationId);
        if (!row) {
          if (
            db
              .prepare('SELECT name FROM sqlite_master WHERE name IN (?,?)')
              .get(entries, documents)
          )
            throw ownershipError();
          db.prepare(
            "INSERT INTO __kb_index_targets VALUES (?,?,?,?,?,?, 'open',?,NULL)",
          ).run(
            target.namespace,
            target.generationId,
            target.identityHash,
            entries,
            null,
            target.contractVersion,
            new Date().toISOString(),
          );
          db.exec(
            'CREATE TABLE "' +
              documents +
              '" (docId TEXT PRIMARY KEY NOT NULL, revision INTEGER NOT NULL, snapshotHash TEXT NOT NULL, deleted INTEGER NOT NULL, updatedAt TEXT NOT NULL)',
          );
        }
        const stored = control(db, target);
        if (target.dimension !== null && stored.dimension === null) {
          validateVectors(
            [Array.from({ length: target.dimension }, () => 1)],
            1,
            target.dimension,
          );
          if (
            db
              .prepare('SELECT name FROM sqlite_master WHERE name=?')
              .get(entries)
          )
            throw ownershipError();
          db.exec(
            'CREATE TABLE "' +
              entries +
              '" (chunkId TEXT PRIMARY KEY NOT NULL, docId TEXT NOT NULL, spaceId TEXT NOT NULL, revision INTEGER NOT NULL, version INTEGER NOT NULL, ordinal INTEGER NOT NULL, contentHash TEXT NOT NULL, gate TEXT NOT NULL, embedding BLOB NOT NULL)',
          );
          db.exec(
            'CREATE INDEX "' + entries + '_doc" ON "' + entries + '" (docId)',
          );
          db.exec(
            'CREATE INDEX "' +
              entries +
              '_scope" ON "' +
              entries +
              '" (spaceId,gate)',
          );
          db.prepare(
            'UPDATE __kb_index_targets SET dimension=? WHERE namespace=? AND generationId=?',
          ).run(target.dimension, target.namespace, target.generationId);
        }
      }).immediate();
    },
    async replaceDocument(target, document, input, signal) {
      signal.throwIfAborted();
      if (closed)
        throw invalid(
          'INDEXING_UNAVAILABLE',
          'Knowledge index storage is closed.',
        );
      const spool = await prepareSqliteVectorSpool(
        context.storagePath,
        target,
        document,
        input,
        signal,
      );
      try {
        const db = await database();
        signal.throwIfAborted();
        const { entries, documents } = names(target);
        return db
          .transaction((): 'applied' | 'alreadyApplied' | 'obsolete' => {
            const stored = control(db, target);
            const raw = db
              .prepare(
                'SELECT revision,snapshotHash FROM "' +
                  documents +
                  '" WHERE docId=?',
              )
              .get(document.docId);
            const incoming = BigInt(revisionOf(document.revision));
            if (raw) {
              const old = manifestSchema.parse(raw);
              const previous = BigInt(revisionOf(old.revision));
              if (incoming < previous) return 'obsolete';
              if (incoming === previous) {
                if (document.snapshotHash !== old.snapshotHash)
                  throw invalid(
                    'INDEXING_SNAPSHOT_CONFLICT',
                    'Knowledge index snapshot does not match.',
                  );
                return 'alreadyApplied';
              }
            }
            if (spool.count && stored.dimension === null)
              throw ownershipError();
            if (stored.dimension !== null) {
              db.prepare('DELETE FROM "' + entries + '" WHERE docId=?').run(
                document.docId,
              );
              const insert = db.prepare(
                'INSERT INTO "' + entries + '" VALUES (?,?,?,?,?,?,?,?,?)',
              );
              for (const item of spool.rows())
                insert.run(
                  item.chunkId,
                  item.docId,
                  item.spaceId,
                  incoming,
                  item.version,
                  item.ordinal,
                  item.contentHash,
                  item.gate,
                  item.embedding,
                );
            }
            db.prepare(
              'INSERT INTO "' +
                documents +
                '" VALUES (?,?,?,?,?) ON CONFLICT(docId) DO UPDATE SET revision=excluded.revision,snapshotHash=excluded.snapshotHash,deleted=excluded.deleted,updatedAt=excluded.updatedAt',
            ).run(
              document.docId,
              incoming,
              document.snapshotHash,
              Number(document.deleted),
              new Date().toISOString(),
            );
            return 'applied';
          })
          .immediate();
      } finally {
        await spool
          .close()
          .catch(() =>
            context.onError(
              'INDEXING_SPOOL_CLEANUP_FAILED',
              new Error('Knowledge index temporary data cleanup failed.'),
            ),
          );
      }
    },
    async vectorsOf(target, docId, chunks, signal) {
      signal.throwIfAborted();
      const db = await database();
      const stored = control(db, target);
      const result = new Map<string, readonly number[]>();
      if (stored.dimension === null) return result;
      const select = db.prepare(
        'SELECT embedding FROM "' +
          names(target).entries +
          '" WHERE docId=? AND chunkId=? AND contentHash=?',
      );
      for (const chunk of chunks) {
        const raw = select.get(docId, chunk.chunkId, chunk.contentHash);
        if (!raw) continue;
        const row = z.object({ embedding: z.instanceof(Buffer) }).parse(raw);
        const vector = Array.from(
          { length: row.embedding.byteLength / 4 },
          (_, i) => row.embedding.readFloatLE(i * 4),
        );
        result.set(chunk.chunkId, vector);
      }
      return result;
    },
    async search(target, request, signal) {
      signal.throwIfAborted();
      if (closed)
        throw invalid(
          'INDEXING_UNAVAILABLE',
          'Knowledge index storage is closed.',
        );
      const scopes = request.scopes.filter((scope) => scope.gates.length > 0);
      if (!scopes.length || request.limit <= 0) return [];
      if (request.channel !== 'vector' || request.query.kind !== 'vector')
        throw invalid(
          'INDEXING_OPTIONS_INVALID',
          'Unsupported Knowledge index query.',
        );
      validateVectors([request.query.vector], 1, target.dimension);
      const db = await database();
      signal.throwIfAborted();
      const stored = control(db, target);
      if (stored.dimension === null) return [];
      const conditions = scopes.map(
        (scope) =>
          '(spaceId=? AND gate IN (' +
          scope.gates.map(() => '?').join(',') +
          '))',
      );
      const bindings = scopes.flatMap((scope) => [
        scope.spaceId,
        ...scope.gates,
      ]);
      const sql =
        'SELECT chunkId, 1-vec_distance_cosine(embedding,?) AS score FROM "' +
        names(target).entries +
        '" WHERE ' +
        conditions.join(' OR ') +
        ' ORDER BY score DESC, chunkId ASC LIMIT ?';
      return z
        .array(z.object({ chunkId: z.string(), score: z.number().finite() }))
        .parse(
          db
            .prepare(sql)
            .all(
              vectorBytes(request.query.vector),
              ...bindings,
              Math.floor(request.limit),
            ),
        );
    },
    async dropTarget(target, signal) {
      signal.throwIfAborted();
      const db = await database();
      const { entries, documents } = names(target);
      db.transaction(() => {
        ensureControl(db);
        const raw = db
          .prepare(
            'SELECT * FROM __kb_index_targets WHERE namespace=? AND generationId=?',
          )
          .get(target.namespace, target.generationId);
        if (!raw) {
          if (
            db
              .prepare('SELECT name FROM sqlite_master WHERE name IN (?,?)')
              .get(entries, documents)
          )
            throw ownershipError();
          db.prepare(
            "INSERT INTO __kb_index_targets VALUES (?,?,?,?,?,?, 'closed',?,?)",
          ).run(
            target.namespace,
            target.generationId,
            target.identityHash,
            entries,
            null,
            target.contractVersion,
            new Date().toISOString(),
            new Date().toISOString(),
          );
          return;
        }
        const row = controlSchema.parse(raw);
        if (
          row.identityHash !== target.identityHash ||
          row.targetName !== entries
        )
          throw ownershipError();
        if (
          Number(row.contractVersion) !== target.contractVersion ||
          (target.dimension !== null &&
            row.dimension !== null &&
            Number(row.dimension) !== target.dimension)
        )
          throw ownershipError();
        if (
          db
            .prepare('SELECT name FROM sqlite_master WHERE name=?')
            .get(documents)
        )
          assertLayout(db, documents, [
            'docId',
            'revision',
            'snapshotHash',
            'deleted',
            'updatedAt',
          ]);
        if (
          db.prepare('SELECT name FROM sqlite_master WHERE name=?').get(entries)
        )
          assertLayout(db, entries, [
            'chunkId',
            'docId',
            'spaceId',
            'revision',
            'version',
            'ordinal',
            'contentHash',
            'gate',
            'embedding',
          ]);
        db.prepare(
          "UPDATE __kb_index_targets SET state='closed',closedAt=? WHERE namespace=? AND generationId=?",
        ).run(new Date().toISOString(), target.namespace, target.generationId);
        db.exec('DROP TABLE IF EXISTS "' + entries + '"');
        db.exec('DROP TABLE IF EXISTS "' + documents + '"');
      }).immediate();
    },
    async close() {
      closed = true;
      const db = await opening;
      if (db?.open) db.close();
    },
  };
}
