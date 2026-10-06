import { createDatabaseManager, rawRows } from '@nocobase/db';
import type { Knex } from 'knex';
import { describe, expect, it } from 'vitest';
import mysql from '../../src/index.js';

describe('MySQL transaction isolation', () => {
  it('runs transactions at READ COMMITTED', async () => {
    const database = createDatabaseManager({
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
});
