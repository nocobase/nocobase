import { randomUUID } from 'node:crypto';
import {
  createDatabaseManager,
  rawRows,
  type CollectionMetadataStore,
} from '@nocobase/db';
import { DatabaseCollectionMetadataStore } from '../../../db/src/metadata/internal/database-document-store.js';
import type { Knex } from 'knex';
import { describe, expect, it } from 'vitest';
import mysql from '../../src/index.js';

describe('MySQL transaction isolation', () => {
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

function createManager(metadataStore?: CollectionMetadataStore) {
  return createDatabaseManager({
    metadataStore,
    connections: {
      main: mysql({
        host: process.env.MYSQL_HOST ?? '127.0.0.1',
        port: Number(process.env.MYSQL_PORT ?? 13306),
        username: process.env.MYSQL_USER ?? 'nocobase',
        password: process.env.MYSQL_PASSWORD ?? 'nocobase',
        database: process.env.MYSQL_DATABASE ?? 'nocobase_collection_builder',
      }),
    },
  });
}
