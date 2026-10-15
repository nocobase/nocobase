import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import type { Knex } from 'knex';
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

describeIntegrationDatabases(
  'Oracle session-dependent identities',
  (context) => {
    it.each(['primary', 'unique', 'index', 'composite'] as const)(
      'checks cardinality for a session-dependent %s identity with warm and refreshed metadata',
      async (kind) => {
        await context.builder.createCollection('linguisticItems', (c) => {
          c.string('id').notNull();
          if (kind === 'primary') c.primary(['id']);
          if (kind === 'unique') c.unique(['id']);
          if (kind === 'composite') {
            c.integer('tenant').notNull();
            c.primary(['tenant', 'id']);
          }
          c.string('name').notNull();
          c.integer('version').notNull();
          c.optimisticLock('version');
        });
        const table = context.table('linguisticItems');
        if (kind === 'index') {
          await context.db.raw('create unique index ?? on ?? ("id")', [
            context.identifier('linguisticKey'),
            table,
          ]);
          context.connection.collections.invalidate();
        }
        const tenant = kind === 'composite' ? { tenant: 1 } : {};
        await context
          .db(table)
          .insert({ ...tenant, id: 'key', name: 'first', version: 1 });
        await context
          .db(table)
          .insert({ ...tenant, id: 'KEY', name: 'second', version: 2 });
        // Resolve on the default session first: eligibility must not cache its NLS settings.
        await context.connection.collections.get('linguisticItems');
        await context.database.transaction(async (connection) => {
          const client = await connection.client<Knex>();
          await client.raw(
            'alter session set nls_comp = LINGUISTIC nls_sort = BINARY_CI',
          );
          try {
            for (const refresh of [false, true]) {
              if (refresh) connection.collections.invalidate();
              const repository = connection.repository('linguisticItems');
              const filter = { ...tenant, id: 'key' };
              expect(await repository.findMany({ filter })).toHaveLength(2);
              await expect(
                repository.updateOne({
                  filter,
                  ifVersion: 1,
                  values: { name: 'changed' },
                }),
              ).rejects.toMatchObject({ code: 'MULTIPLE_RECORDS_MATCHED' });
            }
          } finally {
            await client.raw(
              'alter session set nls_comp = BINARY nls_sort = BINARY',
            );
          }
        }, context.spec.name);
        expect(await context.db(table).select('*').orderBy('name')).toEqual([
          { ...tenant, id: 'key', name: 'first', version: 1 },
          { ...tenant, id: 'KEY', name: 'second', version: 2 },
        ]);
      },
    );
  },
);

describeIntegrationDatabases('Oracle binary identities', (context) => {
  it('keeps explicit binary character keys eligible under linguistic session settings', async ({
    skip,
  }) => {
    const table = context.table('binaryItems');
    try {
      await context.db.raw(
        'create table ?? ("id" varchar2(64) collate BINARY primary key, "name" varchar2(64), "version" number(10) not null)',
        [table],
      );
    } catch (error) {
      if ((error as { errorNum?: number }).errorNum === 43929)
        skip('Explicit column collations require MAX_STRING_SIZE=EXTENDED.');
      throw error;
    }
    await context.builder.alterCollection('binaryItems', (c) =>
      c.optimisticLock('version'),
    );
    await context.db(table).insert({ id: 'key', name: 'first', version: 1 });
    await context.db(table).insert({ id: 'KEY', name: 'second', version: 2 });
    await context.connection.collections.get('binaryItems');
    await context.database.transaction(async (connection) => {
      const client = await connection.client<Knex>();
      await client.raw(
        'alter session set nls_comp = LINGUISTIC nls_sort = BINARY_CI',
      );
      const statements: string[] = [];
      const listener = ({ sql }: { sql: string }) => {
        if (/^(select|update)\b/i.test(sql) && sql.includes(table))
          statements.push(sql);
      };
      context.db.on('query', listener);
      try {
        await expect(
          connection.repository('binaryItems').updateOne({
            filter: { id: 'key' },
            ifVersion: 1,
            values: { name: 'changed' },
          }),
        ).resolves.toMatchObject({
          record: { id: 'key', name: 'changed', version: 2 },
        });
      } finally {
        context.db.off('query', listener);
        await client.raw(
          'alter session set nls_comp = BINARY nls_sort = BINARY',
        );
      }
      expect(statements).toHaveLength(2);
      expect(statements[0]).toMatch(/^update\b/i);
    }, context.spec.name);
    expect(await context.db(table).select('*').orderBy('name')).toEqual([
      { id: 'key', name: 'changed', version: 2 },
      { id: 'KEY', name: 'second', version: 2 },
    ]);
  });
});
