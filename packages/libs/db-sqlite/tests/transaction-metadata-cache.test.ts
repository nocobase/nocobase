import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Knex } from 'knex';
import { afterEach, describe, expect, it } from 'vitest';
import { createDatabaseManager, type DatabaseManager } from '@nocobase/db';
import sqlite from '../src/index.js';

const databases: DatabaseManager[] = [];
const directories: string[] = [];

function database(
  filename: string = ':memory:',
  poolSize: number = 1,
): DatabaseManager {
  const manager = createDatabaseManager({
    drivers: { sqlite },
    connections: {
      main: {
        dialect: 'sqlite',
        filename,
        pool: { min: 1, max: poolSize, acquireTimeoutMillis: 500 },
      },
    },
  });
  databases.push(manager);
  return manager;
}

async function createOrders(manager: DatabaseManager): Promise<void> {
  await manager.builder().createCollection('orders', (collection) => {
    collection.increments('id');
    collection.string('label', { title: 'Original label' });
  });
}

afterEach(async () => {
  for (const manager of databases.splice(0)) await manager.destroy();
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});

describe('transaction metadata cache', () => {
  it('prepares cold metadata before opening a transaction with a single-connection pool', async () => {
    const manager = database();
    const client = await manager.connection().client<Knex>();
    const statements: string[] = [];
    client.on('query', (query: { sql: string }) => statements.push(query.sql));
    await manager.transaction(async (transaction) => {
      const start = statements.length;
      expect(
        await transaction.collectionMetadata.get('orders'),
      ).toBeUndefined();
      await transaction.collectionMetadata.replaceDocument({
        version: 1,
        name: 'orders',
      });
      expect(
        statements.slice(start).some((sql) => /^create\s+table/i.test(sql)),
      ).toBe(false);
    });
    expect(statements.some((sql) => /^create\s+table/i.test(sql))).toBe(true);
  });

  it('reuses the naming metadata across Repository, Query, and savepoint reads', async () => {
    const manager = database();
    await createOrders(manager);
    const root = manager.connection();
    const client = await root.client<Knex>();
    await client('__nocobase_collection_metadata').insert(
      Array.from({ length: 135 }, (_, index) => ({
        name: `unused${index}`,
        document: JSON.stringify({
          version: 1,
          name: `unused${index}`,
          title: `Unused ${index}`,
        }),
        revision: 1,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    );
    root.collections.invalidate();
    await root.repository('orders').findMany();
    const scans: string[] = [];
    const record = (query: { sql: string }): void => {
      if (
        query.sql.includes('from `__nocobase_collection_metadata`') &&
        query.sql.includes('`document`') &&
        !query.sql.includes('where')
      )
        scans.push(query.sql);
    };
    client.on('query', record);

    for (let i = 0; i < 10; i++) {
      await root.transaction(async (transaction) => {
        await transaction.repository('orders').findMany();
        await transaction.query.selectFrom('orders').selectAll().execute();
        await transaction.transaction(async (savepoint) => {
          await savepoint.repository('orders').findMany();
        });
      });
    }

    client.off('query', record);
    expect(scans).toEqual([]);
  });

  it('loads cold metadata on the transaction connection with a single-connection pool', async () => {
    const manager = database();
    await createOrders(manager);
    manager.collections().invalidate();
    await manager.transaction(async (transaction) => {
      expect(await transaction.repository('orders').findMany()).toEqual([]);
    });
  });

  it('still inspects physical schema changes when the naming metadata is unchanged', async () => {
    const manager = database();
    await createOrders(manager);
    const root = manager.connection();
    await root.collections.get('orders');
    const client = await root.client<Knex>();
    await client.schema.table('orders', (table) => table.string('note'));
    await root.transaction(async (transaction) => {
      expect(
        (await transaction.collections.get('orders'))?.fields,
      ).toContainEqual(expect.objectContaining({ name: 'note' }));
    });
  });

  it('refreshes raw metadata edits when the public registry is invalidated', async () => {
    const manager = database();
    await createOrders(manager);
    const root = manager.connection();
    await root.collections.list();
    const client = await root.client<Knex>();
    await client('__nocobase_collection_metadata')
      .where({ name: 'orders' })
      .update({
        document: JSON.stringify({
          version: 1,
          name: 'orders',
          title: 'Raw title',
        }),
      });
    root.collections.invalidate();
    await root.transaction(async (transaction) => {
      expect((await transaction.collections.list()).items).toEqual([
        expect.objectContaining({ name: 'orders', title: 'Raw title' }),
      ]);
    });
  });

  it('keeps a transaction snapshot when the same root loads a newer committed index', async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), 'metadata-snapshot-'),
    );
    directories.push(directory);
    const manager = database(path.join(directory, 'database.sqlite'), 2);
    await createOrders(manager);
    const root = manager.connection();
    const client = await root.client<Knex>();
    await client.raw('pragma journal_mode = WAL');
    await root.collectionMetadata.updateCollection('orders', {
      title: 'Before',
    });
    await root.collections.list();

    await root.transaction(async (transaction) => {
      expect((await transaction.collections.list()).items[0]?.title).toBe(
        'Before',
      );
      await root.collectionMetadata.updateCollection('orders', {
        title: 'After',
      });
      expect((await root.collections.list()).items[0]?.title).toBe('After');
      await transaction.transaction(async (savepoint) => {
        expect((await savepoint.collections.list()).items[0]?.title).toBe(
          'Before',
        );
      });
    });
    await root.transaction(async (transaction) => {
      expect((await transaction.collections.list()).items[0]?.title).toBe(
        'After',
      );
    });
  });

  it('keeps metadata edits in the transaction until the outermost commit', async () => {
    const manager = database();
    await createOrders(manager);
    const root = manager.connection();
    const title = async (connection = root): Promise<string | undefined> =>
      (await connection.collections.get('orders'))?.fields?.find(
        (field) => field.name === 'label',
      )?.title;
    expect(await title()).toBe('Original label');
    const rollback = new Error('Expected rollback');

    await expect(
      root.transaction(async (transaction) => {
        await transaction.collectionMetadata.updateField('orders', 'label', {
          title: 'Outer label',
        });
        await transaction.transaction(async (savepoint) => {
          expect(await title(savepoint)).toBe('Outer label');
          await savepoint.collectionMetadata.updateField('orders', 'label', {
            title: 'Inner label',
          });
        });
        expect(await title(transaction)).toBe('Inner label');
        expect(await title()).toBe('Original label');
        throw rollback;
      }),
    ).rejects.toBe(rollback);

    expect(await title()).toBe('Original label');
    await root.transaction(async (transaction) => {
      expect(await title(transaction)).toBe('Original label');
      await transaction.collectionMetadata.updateField('orders', 'label', {
        title: 'Committed label',
      });
      transaction.afterCommit(async () => {
        expect(await title()).toBe('Committed label');
      });
    });
  });

  it('observes another connection updating, deleting, and recreating metadata', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'metadata-cache-'));
    directories.push(directory);
    const filename = path.join(directory, 'database.sqlite');
    const first = database(filename);
    const second = database(filename);
    await createOrders(first);
    await first.connection().collectionMetadata.updateCollection('orders', {
      title: 'Before',
    });
    await first.collections().get('orders');
    await second.connection().collectionMetadata.updateCollection('orders', {
      title: 'After',
    });

    const title = async (): Promise<string | undefined> =>
      first.transaction(async (transaction) => {
        const page = await transaction.collections.list();
        return page.items.find((item) => item.name === 'orders')?.title;
      });
    expect(await title()).toBe('After');
    await second.connection().collectionMetadata.removeDocument('orders');
    expect(await title()).toBeUndefined();
    await second.connection().collectionMetadata.updateCollection('orders', {
      title: 'Recreated',
    });
    expect(await title()).toBe('Recreated');
  });

  it('does not reuse an uncommitted index when COMMIT itself fails', async () => {
    const manager = database();
    await createOrders(manager);
    const root = manager.connection();
    const client = await root.client<Knex>();
    await client.raw('pragma foreign_keys = on');
    await client.raw('create table parents (id integer primary key)');
    await client.raw(
      'create table children (id integer primary key, parent_id integer references parents (id) deferrable initially deferred)',
    );
    await root.collectionMetadata.updateCollection('orders', {
      title: 'Before',
    });
    await root.collections.list();

    await expect(
      root.transaction(async (transaction) => {
        await transaction.collectionMetadata.updateCollection('orders', {
          title: 'Uncommitted',
        });
        expect(
          (await transaction.collections.list()).items.find(
            (item) => item.name === 'orders',
          )?.title,
        ).toBe('Uncommitted');
        const trx = await transaction.client<Knex>();
        await trx('children').insert({ id: 1, parent_id: 404 });
      }),
    ).rejects.toThrow();

    await root.transaction(async (transaction) => {
      expect(
        (await transaction.collections.list()).items.find(
          (item) => item.name === 'orders',
        )?.title,
      ).toBe('Before');
    });
    expect((await root.collectionMetadata.get('orders'))?.document.title).toBe(
      'Before',
    );
  });
});
