import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import { expect, it } from 'vitest';

describeIntegrationDatabases(
  'PostgreSQL inherited optimistic updates',
  (context) => {
    it.each(
      (['primary', 'unique', 'index'] as const).flatMap((identity) =>
        [1, 2].map((secondVersion) => ({ identity, secondVersion })),
      ),
    )(
      'checks inherited matches with a $identity identity and child version $secondVersion',
      async ({ identity, secondVersion }) => {
        await context.builder.createCollection('inheritedItems', (c) => {
          c.string('id').notNull();
          if (identity === 'primary') c.primary(['id']);
          if (identity === 'unique') c.unique(['id']);
          c.string('name').notNull();
          c.integer('version').notNull();
          c.optimisticLock('version');
        });
        const parent = context.table('inheritedItems');
        const child = context.table('inheritedChild');
        if (identity === 'index')
          await context.db.raw('create unique index ?? on ?? (id)', [
            context.table('inheritedIdUnique'),
            parent,
          ]);
        await context.db.raw('create table ?? () inherits (??)', [
          child,
          parent,
        ]);
        await context
          .db(parent)
          .insert({ id: 'same', name: 'parent', version: 1 });
        await context.db(child).insert({
          id: 'same',
          name: 'child',
          version: secondVersion,
        });
        context.connection.collections.invalidate();
        const repository = context.database.repository('inheritedItems');
        const update = () => ({
          filter: { id: 'same' },
          ifVersion: 1,
          values: { name: 'changed' },
        });
        await expect(repository.updateOne(update())).rejects.toMatchObject({
          code: 'MULTIPLE_RECORDS_MATCHED',
        });
        // Catch the error and commit to verify the rejected write cannot persist.
        await context.database.transaction(async (connection) => {
          await expect(
            connection.repository('inheritedItems').updateOne(update()),
          ).rejects.toMatchObject({ code: 'MULTIPLE_RECORDS_MATCHED' });
        }, context.spec.name);
        expect(
          await repository.findMany({ sort: (s) => s.field('name').asc() }),
        ).toEqual([
          { id: 'same', name: 'child', version: secondVersion },
          { id: 'same', name: 'parent', version: 1 },
        ]);
      },
    );

    it('updates a single inherited match through the cardinality-checking path', async () => {
      await context.builder.createCollection('inheritedItems', (c) => {
        c.string('id').primary().notNull();
        c.string('name').notNull();
        c.integer('version').notNull();
        c.optimisticLock('version');
      });
      const parent = context.table('inheritedItems');
      const child = context.table('inheritedChild');
      await context.db.raw('create table ?? () inherits (??)', [child, parent]);
      await context.db(parent).insert({ id: 'A', name: 'parent', version: 1 });
      await context.db(child).insert({ id: 'B', name: 'child', version: 1 });
      context.connection.collections.invalidate();
      const repository = context.database.repository('inheritedItems');
      for (const id of ['A', 'B']) {
        await expect(
          repository.updateOne({
            filter: { id },
            ifVersion: 1,
            values: { name: 'changed' },
          }),
        ).resolves.toMatchObject({
          record: { id, name: 'changed', version: 2 },
          version: 2,
        });
      }
      expect(
        await repository.findMany({ sort: (s) => s.field('id').asc() }),
      ).toEqual([
        { id: 'A', name: 'changed', version: 2 },
        { id: 'B', name: 'changed', version: 2 },
      ]);
    });

    it.each(['ordinary', 'partitioned'] as const)(
      'keeps two business statements for a %s table with a primary identity',
      async (kind) => {
        const table = context.table('eligibleItems');
        await context.db.raw(
          `create table ?? (id varchar(64) primary key, name varchar(64) not null, version integer not null)${kind === 'partitioned' ? ' partition by list (id)' : ''}`,
          [table],
        );
        if (kind === 'partitioned')
          await context.db.raw(
            "create table ?? partition of ?? for values in ('A')",
            [context.table('eligiblePartition'), table],
          );
        await context.builder.alterCollection('eligibleItems', (c) =>
          c.optimisticLock('version'),
        );
        const repository = context.database.repository('eligibleItems');
        await repository.createOne({ values: { id: 'A', name: 'before' } });
        const statements: string[] = [];
        const listener = ({ sql }: { sql: string }) => {
          if (/^(select|update)\b/i.test(sql) && sql.includes(table))
            statements.push(sql);
        };
        context.db.on('query', listener);
        try {
          await expect(
            repository.updateOne({
              filter: { id: 'A' },
              ifVersion: 1,
              values: { name: 'changed' },
            }),
          ).resolves.toMatchObject({
            record: { id: 'A', name: 'changed', version: 2 },
            version: 2,
          });
        } finally {
          context.db.off('query', listener);
        }
        expect(statements).toHaveLength(2);
        expect(statements[0]).toMatch(/^update\b/i);
        expect(statements[1]).toMatch(/^select\b/i);
      },
    );
  },
);
