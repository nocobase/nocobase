import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import { expect, it } from 'vitest';

describeIntegrationDatabases(
  'SQL Server conditional update identities',
  (context) => {
    it.each(['primary', 'unique', 'index'] as const)(
      'does not trust a disabled %s index',
      async (kind) => {
        const table = context.table('disabledItems');
        const primary = context.identifier('disabledPrimary');
        const unique = context.identifier('disabledUnique');
        await context.db.raw(
          'create table ?? (id varchar(64) not null, code varchar(64) not null, marker varchar(64) not null unique, name varchar(64) not null, version int not null, constraint ?? primary key nonclustered (id))',
          [table, primary],
        );
        if (kind === 'unique') {
          await context.db.raw(
            'alter table ?? add constraint ?? unique (code)',
            [table, unique],
          );
        } else if (kind === 'index') {
          await context.db.raw('create unique index ?? on ?? (code)', [
            unique,
            table,
          ]);
        }
        await context.builder.alterCollection('disabledItems', (c) =>
          c.optimisticLock('version'),
        );
        const key = kind === 'primary' ? primary : unique;
        await context.db.raw('alter index ?? on ?? disable', [key, table]);
        context.connection.collections.invalidate();
        const collection =
          await context.connection.collections.get('disabledItems');
        if (kind === 'index') {
          expect(collection?.constraints).not.toContainEqual(
            expect.objectContaining({ type: 'unique', fields: ['code'] }),
          );
          expect(collection?.indexes).toContainEqual(
            expect.objectContaining({
              name: unique,
              db: expect.objectContaining({ valid: false }),
            }),
          );
        } else {
          expect(collection?.constraints).toContainEqual(
            expect.objectContaining({
              type: kind,
              name: key,
              db: expect.objectContaining({ valid: false }),
            }),
          );
        }
        const repository = context.database.repository('disabledItems');
        const ids = kind === 'primary' ? ['same', 'same'] : ['A', 'B'];
        await repository.createMany({
          values: [
            { id: ids[0], code: 'same', marker: 'A', name: 'first' },
            { id: ids[1], code: 'same', marker: 'B', name: 'second' },
          ],
        });
        for (const version of [1, 2]) {
          if (version === 2)
            await repository.updateMany({
              filter: { marker: 'B' },
              values: { name: 'second' },
            });
          await expect(
            repository.updateOne({
              filter: kind === 'primary' ? { id: 'same' } : { code: 'same' },
              ifVersion: 1,
              values: { name: 'changed' },
            }),
          ).rejects.toMatchObject({ code: 'MULTIPLE_RECORDS_MATCHED' });
          expect(
            await repository.findMany({ sort: (s) => s.field('marker').asc() }),
          ).toEqual([
            {
              id: ids[0],
              code: 'same',
              marker: 'A',
              name: 'first',
              version: 1,
            },
            { id: ids[1], code: 'same', marker: 'B', name: 'second', version },
          ]);
        }
      },
    );
  },
);
