import { randomUUID } from 'node:crypto';
import {
  CollectionMetadataConflictError,
  createDatabaseManager,
  rawRows,
  type CollectionMetadataStore,
} from '@nocobase/db';
import { DatabaseCollectionMetadataStore } from '@nocobase/db/testing';
import type { Knex } from 'knex';
import { describe, expect, it } from 'vitest';
import mysql from '../../src/index.js';

describe('MySQL transaction isolation', () => {
  it.each(['insert', 'delete', 'scope'] as const)(
    'diagnoses a conditional update after a concurrent %s using current rows',
    async (operation) => {
      const prefix = `conditional_${randomUUID().replaceAll('-', '')}_`;
      const database = createManager(undefined, prefix);
      const other = createManager();
      try {
        await database.builder().createCollection('items', (c) => {
          c.string('id').primary().notNull();
          c.string('tenant').notNull();
          c.string('name').notNull();
          c.integer('version').notNull();
          c.optimisticLock('version');
        });
        const client = await database.connection().client<Knex>();
        const otherClient = await other.connection().client<Knex>();
        const table = `${prefix}items`;
        if (operation !== 'insert') {
          await otherClient(table).insert({
            id: 'A',
            tenant: 'T1',
            name: 'before',
            version: 1,
          });
        }
        await database.collections().get('items');
        // The single-connection pool keeps this isolation level for the next BEGIN.
        await client.raw(
          'set session transaction isolation level repeatable read',
        );
        await database.transaction(async (transaction) => {
          const repository = transaction.repository('items');
          await repository.findMany();
          if (operation === 'insert') {
            await otherClient(table).insert({
              id: 'A',
              tenant: 'T1',
              name: 'concurrent',
              version: 2,
            });
          } else if (operation === 'delete') {
            await otherClient(table).where({ id: 'A' }).delete();
          } else {
            await otherClient(table)
              .where({ id: 'A' })
              .update({ tenant: 'T2' });
          }
          await expect(
            repository.updateOne({
              filter: { id: 'A', tenant: 'T1' },
              ifVersion: 1,
              values: { name: 'changed' },
            }),
          ).rejects.toMatchObject({
            code:
              operation === 'insert' ? 'VERSION_CONFLICT' : 'RECORD_NOT_FOUND',
          });
        });
      } finally {
        await other.destroy();
        await database.connection().resetManagedSchema();
        await database.destroy();
      }
    },
  );

  it.each(['insert', 'update', 'delete'] as const)(
    'checks the current revision after a concurrent %s outside a repeatable-read snapshot',
    async (operation) => {
      const prefix = `revision_${randomUUID().replaceAll('-', '')}`;
      const tableName = `${prefix}_metadata`;
      const database = createManager();
      try {
        const client = await database.connection().client<Knex>();
        const root = new DatabaseCollectionMetadataStore({
          resolveClient: async () => client,
          tableName,
        });
        await root.initialize();
        if (operation !== 'insert') {
          await root.put(
            { version: 1, name: 'orders', title: 'Before' },
            { expectedRevision: null },
          );
        }
        await client.transaction(
          async (transaction) => {
            const child = root.withClient(async () => transaction);
            const previous = await child.get('orders');
            if (operation === 'delete') {
              await root.delete('orders', { expectedRevision: 1 });
            } else {
              await root.put(
                { version: 1, name: 'orders', title: 'Concurrent' },
                { expectedRevision: previous?.revision ?? null },
              );
            }
            const latest = await root.get('orders');
            const document = {
              version: 1,
              name: 'orders',
              title: 'After',
            } as const;
            // A stale token must report the current row, not the old read view.
            await expect(
              child.put(document, {
                expectedRevision: previous?.revision ?? null,
              }),
            ).rejects.toMatchObject(
              new CollectionMetadataConflictError(
                'orders',
                previous?.revision ?? null,
                latest?.revision ?? null,
              ),
            );
            const saved = await child.put(document, {
              expectedRevision: latest?.revision ?? null,
            });
            expect(saved.revision).toBe(
              operation === 'insert' ? 2 : operation === 'update' ? 3 : 1,
            );
          },
          { isolationLevel: 'repeatable read' },
        );
        expect((await root.get('orders'))?.document.title).toBe('After');
      } finally {
        const client = await database.connection().client<Knex>();
        for (const row of rawRows<Record<string, string>>(
          await client.raw('show tables like ?', [`${prefix}%`]),
        )) {
          await client.schema.dropTable(Object.values(row)[0]!);
        }
        await database.destroy();
      }
    },
  );

  it('keeps a repeatable-read transaction with own writes out of the shared cache', async () => {
    const prefix = `snapshot_${randomUUID().replaceAll('-', '')}`;
    const tableName = `${prefix}_metadata`;
    let client: Knex;
    const store = new DatabaseCollectionMetadataStore({
      resolveClient: async () => client,
      tableName,
    });
    const database = createManager(store, `${prefix}_`);
    const other = createManager();
    try {
      client = await database.connection().client<Knex>();
      for (const name of ['orders', 'accounts']) {
        await database
          .builder()
          .createCollection(name, (collection) => collection.increments('id'));
      }
      await database
        .connection()
        .collectionMetadata.updateCollection('orders', { title: 'Before' });
      await database.collections().list();
      const otherStore = new DatabaseCollectionMetadataStore({
        resolveClient: () => other.connection().client<Knex>(),
        tableName,
      });
      await otherStore.initialize();
      // The single-connection pool keeps this isolation level for the next BEGIN.
      await client.raw(
        'set session transaction isolation level repeatable read',
      );
      await database.transaction(async (transaction) => {
        const stored = (await transaction.collectionMetadata.get('orders'))!;
        await otherStore.put(
          { ...stored.document, title: 'After' },
          { expectedRevision: stored.revision },
        );
        await transaction.collectionMetadata.updateCollection('accounts', {
          title: 'Own write',
        });
        expect(
          (await transaction.collections.list()).items.find(
            (item) => item.name === 'orders',
          )?.title,
        ).toBe('Before');
      });
      expect((await store.get('orders'))?.document.title).toBe('After');
      expect(
        (await database.collections().list()).items.find(
          (item) => item.name === 'orders',
        )?.title,
      ).toBe('After');
    } finally {
      await other.destroy();
      const cleanup = await database.connection().client<Knex>();
      for (const row of rawRows<Record<string, string>>(
        await cleanup.raw('show tables like ?', [`${prefix}%`]),
      )) {
        await cleanup.schema.dropTable(Object.values(row)[0]!);
      }
      await database.destroy();
    }
  });

  it('runs transactions at READ COMMITTED', async () => {
    const database = createManager();
    try {
      const level = await database.connection().transaction(async (trx) => {
        const client = await trx.client<Knex>();
        // MySQL 8 knows only transaction_isolation, MariaDB before 11.1 only tx_isolation.
        const result = await client
          .raw('select @@transaction_isolation as level')
          .catch((error: unknown) => {
            if (
              (error as { code?: unknown }).code !==
              'ER_UNKNOWN_SYSTEM_VARIABLE'
            )
              throw error;
            return client.raw('select @@tx_isolation as level');
          });
        return rawRows<{ level: string }>(result)[0]?.level;
      });
      expect(level).toBe('READ-COMMITTED');
    } finally {
      await database.destroy();
    }
  });

  it('prepares an upgraded metadata store before business writes and preserves rollback', async () => {
    const prefix = `init_${randomUUID().replaceAll('-', '')}`;
    const metadataTable = `${prefix}_metadata`;
    const dataTable = `${prefix}_data`;
    let client: Knex;
    const store = new DatabaseCollectionMetadataStore({
      resolveClient: async () => client,
      tableName: metadataTable,
    });
    const database = createManager(store);
    try {
      client = await database.connection().client<Knex>();
      await client.schema.createTable(metadataTable, (table) => {
        table.string('name', 191).primary();
        table.text('document').notNullable();
        table.bigInteger('revision').notNullable();
        table.dateTime('created_at').notNullable();
        table.dateTime('updated_at').notNullable();
      });
      await client.schema.createTable(dataTable, (table) =>
        table.integer('id').primary(),
      );
      const rollback = new Error('Expected rollback');
      await expect(
        database.transaction(async (transaction) => {
          const trx = await transaction.client<Knex>();
          await trx(dataTable).insert({ id: 1 });
          expect(
            await transaction.collectionMetadata.get('orders'),
          ).toBeUndefined();
          await transaction.transaction(async (savepoint) => {
            expect(
              await savepoint.collectionMetadata.get('orders'),
            ).toBeUndefined();
          });
          throw rollback;
        }),
      ).rejects.toBe(rollback);
      expect(await client(dataTable).select('*')).toEqual([]);
    } finally {
      const client = await database.connection().client<Knex>();
      for (const row of rawRows<Record<string, string>>(
        await client.raw('show tables like ?', [`${prefix}%`]),
      )) {
        await client.schema.dropTable(Object.values(row)[0]!);
      }
      await database.destroy();
    }
  });
});

function createManager(
  metadataStore?: CollectionMetadataStore,
  tablePrefix?: string,
) {
  return createDatabaseManager({
    metadataStore,
    connections: {
      main: mysql({
        host: process.env.MYSQL_HOST ?? '127.0.0.1',
        port: Number(process.env.MYSQL_PORT ?? 13306),
        username: process.env.MYSQL_USER ?? 'nocobase',
        password: process.env.MYSQL_PASSWORD ?? 'nocobase',
        database: process.env.MYSQL_DATABASE ?? 'nocobase_collection_builder',
        ...(tablePrefix
          ? { naming: { tablePrefix }, pool: { min: 1, max: 1 } }
          : {}),
      }),
    },
  });
}
