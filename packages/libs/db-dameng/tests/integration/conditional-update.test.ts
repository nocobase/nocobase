import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import { expect, it } from 'vitest';

describeIntegrationDatabases(
  'Disabled conditional update identities',
  (context) => {
    it.each(['primary', 'unique'] as const)(
      'does not trust a disabled %s constraint',
      async (kind) => {
        const key = context.identifier('disabledKey');
        await context.builder.createCollection('disabledItems', (c) => {
          c.string('id').notNull();
          c.primary(['id'], kind === 'primary' ? { name: key } : {});
          c.string('code').notNull();
          if (kind === 'unique') c.unique(['code'], { name: key });
          c.string('marker').notNull();
          c.unique(['marker']);
          c.string('name').notNull();
          c.integer('version').notNull();
          c.optimisticLock('version');
        });
        await context.db.raw('alter table ?? disable constraint ??', [
          context.table('disabledItems'),
          key,
        ]);
        context.connection.collections.invalidate();
        const collection =
          await context.connection.collections.get('disabledItems');
        expect(collection?.constraints).toContainEqual(
          expect.objectContaining({
            type: kind,
            name: key,
            db: expect.objectContaining({ valid: false }),
          }),
        );
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
