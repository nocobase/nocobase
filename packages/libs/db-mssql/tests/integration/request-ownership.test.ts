import { rawRows } from '@nocobase/db';
import {
  describeIntegrationDatabases,
  installDatabaseIntegrationAdapter,
} from '@nocobase/db-testkit';
import { expect, it } from 'vitest';

import { mssqlDialectIntegrationAdapter } from './legacy-adapter.js';

installDatabaseIntegrationAdapter(mssqlDialectIntegrationAdapter);

describeIntegrationDatabases(
  'MSSQL concurrent request ownership',
  (context) => {
    it('keeps parallel queries on their transaction session', async () => {
      await Promise.all(
        Array.from({ length: 3 }, () =>
          context.db.transaction(async (transaction) => {
            const session = rawRows<{ id: number }>(
              await transaction.raw('select @@spid as id'),
            )[0].id;
            const results = await Promise.all(
              Array.from({ length: 4 }, () =>
                transaction.raw(
                  "waitfor delay '00:00:00.020'; select @@spid as id",
                ),
              ),
            );
            for (const result of results)
              expect(rawRows<{ id: number }>(result)[0].id).toBe(session);
          }),
        ),
      );
    });

    it.each([false, true])(
      'allocates distinct serials concurrently (existing: %s)',
      async (existing) => {
        await context.builder.createCollection('requestSerials', (table) => {
          table.string('key').primary();
          table.integer('value').notNull();
        });
        const serials = context.database.repository('requestSerials');
        if (existing)
          await serials.createOne({ values: { key: 'serial', value: 0 } });
        const results = await Promise.all(
          Array.from({ length: 3 }, () =>
            serials.upsertOne({
              filter: { key: 'serial' },
              create: { key: 'serial', value: 1 },
              update: { value: (value) => value.increment(1) },
            }),
          ),
        );
        expect(
          results.map(({ record }) => Number(record.value)).sort(),
        ).toEqual([1, 2, 3]);
        expect(
          (await serials.findOne({ filter: { key: 'serial' } }))?.value,
        ).toBe(3);
      },
    );
  },
);
