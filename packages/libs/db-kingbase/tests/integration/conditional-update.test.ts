import { rawRows } from '@nocobase/db';
import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import { expect, it } from 'vitest';

describeIntegrationDatabases(
  'Kingbase conditional update identities',
  (context) => {
    it('keeps non-default operator classes out of conditional identities', async () => {
      const table = context.table('opclassItems');
      await context.db.raw(
        'create table ?? (code text not null, name varchar(64) not null, version integer not null)',
        [table],
      );
      await context.db.raw(
        'create unique index ?? on ?? (code text_pattern_ops)',
        [context.table('opclassUnique'), table],
      );
      await context.builder.alterCollection('opclassItems', (c) =>
        c.optimisticLock('version'),
      );
      const collection =
        await context.connection.collections.get('opclassItems');
      expect(collection?.constraints).toContainEqual(
        expect.objectContaining({
          type: 'unique',
          fields: ['code'],
          db: { columnEquality: false },
        }),
      );
      const repository = context.database.repository('opclassItems');
      await repository.createOne({ values: { code: 'key', name: 'before' } });
      expect(
        await repository.updateOne({
          filter: { code: 'key' },
          ifVersion: 1,
          values: { name: 'after' },
        }),
      ).toMatchObject({ record: { code: 'key', name: 'after', version: 2 } });
    });

    it.each([1, 2])(
      'rejects an invalid unique index with second row version %s',
      async (secondVersion) => {
        await context.builder.createCollection('invalidIndexItems', (c) => {
          c.string('id').primary().notNull();
          c.string('code').notNull();
          c.string('name').notNull();
          c.integer('version').notNull();
          c.optimisticLock('version');
        });
        const repository = context.database.repository('invalidIndexItems');
        await repository.createMany({
          values: [
            { id: 'A', code: 'same', name: 'first' },
            { id: 'B', code: 'same', name: 'second' },
          ],
        });
        if (secondVersion === 2)
          await repository.updateOne({
            filter: { id: 'B' },
            ifVersion: 1,
            values: { name: 'second' },
          });
        const index = context.table('failedCodeUnique');
        await expect(
          context.db.raw('create unique index concurrently ?? on ?? (code)', [
            index,
            context.table('invalidIndexItems'),
          ]),
        ).rejects.toMatchObject({ code: '23505' });
        const state = rawRows(
          await context.db.raw(
            'select indisunique, indisvalid, indisready from pg_index where indexrelid = ?::regclass',
            [index],
          ),
        );
        expect(state).toEqual([
          { indisunique: true, indisvalid: false, indisready: false },
        ]);
        context.connection.collections.invalidate();
        const collection =
          await context.connection.collections.get('invalidIndexItems');
        expect(collection?.indexes).toContainEqual(
          expect.objectContaining({
            name: index,
            db: expect.objectContaining({ unique: true, valid: false }),
          }),
        );
        expect(collection?.constraints).not.toContainEqual(
          expect.objectContaining({
            type: 'unique',
            fields: ['code'],
          }),
        );
        await expect(
          repository.updateOne({
            filter: { code: 'same' },
            ifVersion: 1,
            values: { name: 'changed' },
          }),
        ).rejects.toMatchObject({ code: 'MULTIPLE_RECORDS_MATCHED' });
        expect(
          await repository.findMany({ sort: (s) => s.field('id').asc() }),
        ).toEqual([
          { id: 'A', code: 'same', name: 'first', version: 1 },
          { id: 'B', code: 'same', name: 'second', version: secondVersion },
        ]);
      },
    );
  },
);
