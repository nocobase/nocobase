import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import { expect, it } from 'vitest';

describeIntegrationDatabases(
  'MySQL conditional update identities',
  (context) => {
    it('returns the updated record when a generated locating key changes', async () => {
      await context.builder.createCollection('generatedItems', (c) => {
        c.string('id').primary().notNull();
        c.string('name').notNull();
        c.integer('version').notNull();
        c.optimisticLock('version');
      });
      await context.db.raw(
        'alter table ?? add column slug varchar(255) generated always as (lower(name)) virtual',
        [context.table('generatedItems')],
      );
      await context.db.raw('create unique index ?? on ?? (slug)', [
        context.table('slugUnique'),
        context.table('generatedItems'),
      ]);
      context.connection.collections.invalidate();
      const repository = context.database.repository('generatedItems');
      await repository.createOne({ values: { id: 'A', name: 'Old' } });
      const result = await repository.updateOne({
        filter: { slug: 'old' },
        ifVersion: 1,
        values: { name: 'New' },
      });
      expect(result).toMatchObject({
        record: { id: 'A', name: 'New', slug: 'new', version: 2 },
        version: 2,
      });
      expect(await repository.findOne({ filter: { id: 'A' } })).toEqual(
        result.record,
      );
    });
  },
);
