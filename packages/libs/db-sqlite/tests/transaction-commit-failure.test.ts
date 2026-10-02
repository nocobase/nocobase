import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Knex } from 'knex';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDatabaseManager,
  InMemoryCollectionMetadataStore,
  type DatabaseManager,
} from '@nocobase/db';
import sqlite from '../src/index.js';

const require = createRequire(import.meta.url);

interface NativeDatabase {
  readonly inTransaction: boolean;
  exec(sql: string): unknown;
  close(): void;
  __knex__disposed?: unknown;
}
const BetterSqlite3 = require('better-sqlite3') as new (
  filename: string,
) => NativeDatabase;

function temporaryFile(cleanups: (() => Promise<void> | void)[], name: string) {
  const directory = mkdtempSync(path.join(tmpdir(), 'nb-sqlite-commit-'));
  cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
  return path.join(directory, name);
}

async function createDeferredForeignKeyTables(client: Knex) {
  await client.raw('pragma foreign_keys = on');
  await client.raw('create table parents (id integer primary key)');
  await client.raw(
    'create table children (id integer primary key, parent_id integer references parents (id) deferrable initially deferred)',
  );
}

function insertOrphan(database: DatabaseManager) {
  return database.transaction(async (connection) => {
    await (
      await connection.client<Knex>()
    ).raw('insert into children (id, parent_id) values (1, 404)');
  });
}

function createManager(filename: string): DatabaseManager {
  return createDatabaseManager({
    drivers: { sqlite },
    metadataStore: new InMemoryCollectionMetadataStore(),
    connections: { main: { dialect: 'sqlite', filename } },
  });
}

async function count(database: DatabaseManager, table: string) {
  const client = await database.connection().client<Knex>();
  const [row] = (await client(table).count({ count: '*' })) as {
    count: number;
  }[];
  return Number(row?.count);
}

// SQLite keeps a transaction open when COMMIT fails, so that the caller can
// retry it; Knex never retries, so the connection has to be rolled back.
describe('SQLite transaction whose COMMIT fails', () => {
  const cleanups: (() => Promise<void> | void)[] = [];
  afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  });

  it('rolls back a deferred foreign key violation and keeps the connection usable', async () => {
    const database = createManager(':memory:');
    cleanups.push(() => database.destroy());
    await createDeferredForeignKeyTables(
      await database.connection().client<Knex>(),
    );

    await expect(insertOrphan(database)).rejects.toThrow(
      'FOREIGN KEY constraint failed',
    );

    expect(await count(database, 'children')).toBe(0);
    await database.transaction(async (connection) => {
      const trx = await connection.client<Knex>();
      await trx.raw('insert into parents (id) values (404)');
      await trx.raw('insert into children (id, parent_id) values (1, 404)');
    });
    expect(await count(database, 'children')).toBe(1);
  });

  it('rolls back a COMMIT that fails with SQLITE_BUSY', async () => {
    const filename = temporaryFile(cleanups, 'busy.sqlite');
    const database = createManager(filename);
    cleanups.push(() => database.destroy());
    const client = await database.connection().client<Knex>();
    // A reader only blocks COMMIT in rollback-journal mode; in WAL it would
    // succeed and the test would not exercise the failed COMMIT at all.
    await client.raw('pragma journal_mode = delete');
    await client.raw('pragma busy_timeout = 0');
    await client.raw('create table items (id integer primary key)');

    // Another process holding a read transaction keeps the writer from
    // taking the exclusive lock its COMMIT needs.
    const reader = new BetterSqlite3(filename);
    cleanups.push(() => reader.close());
    reader.exec('begin; select count(*) from items;');

    await expect(
      database.transaction(async (connection) => {
        await (await connection.client<Knex>())('items').insert({ id: 1 });
      }),
    ).rejects.toMatchObject({ code: 'SQLITE_BUSY' });

    reader.exec('commit');
    expect(await count(database, 'items')).toBe(0);
    await database.transaction(async (connection) => {
      await (await connection.client<Knex>())('items').insert({ id: 2 });
    });
    expect(await count(database, 'items')).toBe(1);
  });

  it('discards the connection when the rollback fails too', async () => {
    const database = createManager(temporaryFile(cleanups, 'rollback.sqlite'));
    cleanups.push(() => database.destroy());
    const client = await database.connection().client<Knex>();
    await createDeferredForeignKeyTables(client);

    const native = (await client.client.acquireConnection()) as NativeDatabase;
    await client.client.releaseConnection(native);
    const exec = native.exec.bind(native);
    native.exec = (sql) => {
      if (/^rollback\b/i.test(sql)) throw new Error('disk I/O error');
      return exec(sql);
    };
    const close = vi.spyOn(native, 'close');
    // Silences the warning Knex prints for the discarded connection.
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    cleanups.push(() => log.mockRestore());

    await expect(insertOrphan(database)).rejects.toThrow(
      'FOREIGN KEY constraint failed',
    );
    expect(native.__knex__disposed).toMatchObject({
      message: 'disk I/O error',
    });

    // The pool replaces the connection; closing it discarded the open
    // transaction, and the replacement starts transactions again.
    expect(await count(database, 'children')).toBe(0);
    expect(close).toHaveBeenCalledTimes(1);
    await database.transaction(async (connection) => {
      await (await connection.client<Knex>())('parents').insert({ id: 1 });
    });
    expect(await count(database, 'parents')).toBe(1);
  });

  it('leaves a connection alone once the transaction has released it', async () => {
    const database = createManager(':memory:');
    cleanups.push(() => database.destroy());
    const client = await database.connection().client<Knex>();
    await client.raw('create table items (id integer primary key)');
    const native = (await client.client.acquireConnection()) as NativeDatabase;
    await client.client.releaseConnection(native);
    const exec = vi.spyOn(native, 'exec');

    // The container commits itself, so Knex's own commit afterwards is
    // rejected as already complete after the connection was released. A
    // transaction open on the connection by then belongs to the next caller
    // and must not be rolled back.
    await client.transaction(async (trx) => {
      await trx('items').insert({ id: 1 });
      await trx.commit();
      native.exec('begin');
    });
    expect(native.inTransaction).toBe(true);
    expect(exec).not.toHaveBeenCalledWith(expect.stringMatching(/rollback/i));
    native.exec('rollback');
    expect(await count(database, 'items')).toBe(1);
  });
});
