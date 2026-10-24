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

describeIntegrationDatabases('Oracle constraint backing indexes', (context) => {
  it.each(
    (['primary', 'unique'] as const).flatMap((kind) =>
      [false, true].flatMap((extended) =>
        [false, true].map((character) => ({ kind, extended, character })),
      ),
    ),
  )(
    'preserves $kind safety with reordered keys (extra key=$extended, character=$character)',
    async ({ kind, extended, character }) => {
      await context.builder.createCollection('backedItems', (c) => {
        c.integer('tenant').notNull();
        if (character) c.string('id').notNull();
        else c.integer('id').notNull();
        c.integer('extra').notNull();
        c.string('name').notNull();
        c.integer('version').notNull();
        c.optimisticLock('version');
      });
      const table = context.table('backedItems');
      const index = context.identifier('backingIndex');
      const constraint = context.identifier('backedConstraint');
      await context.db.raw(
        `create ${extended ? '' : 'unique '}index ?? on ?? ("id", "tenant"${extended ? ', "extra"' : ''})`,
        [index, table],
      );
      await context.db.raw(
        `alter table ?? add constraint ?? ${kind === 'primary' ? 'primary key' : 'unique'} ("tenant", "id") using index ??`,
        [table, constraint, index],
      );
      context.connection.collections.invalidate();
      const rows = [
        {
          tenant: 1,
          id: character ? 'key' : 1,
          extra: 1,
          name: 'first',
          version: 1,
        },
        {
          tenant: 1,
          id: character ? 'KEY' : 2,
          extra: 2,
          name: 'second',
          version: 2,
        },
      ];
      for (const row of rows) await context.db(table).insert(row);
      const definition =
        await context.connection.collections.get('backedItems');
      const statements: string[] = [];
      const listener = ({ sql }: { sql: string }) => {
        if (/^(select|update)\b/i.test(sql) && sql.includes(table))
          statements.push(sql);
      };
      let outcome: unknown;
      await context.database.transaction(async (connection) => {
        const client = await connection.client<Knex>();
        await client.raw(
          'alter session set nls_comp = LINGUISTIC nls_sort = BINARY_CI',
        );
        try {
          const repository = connection.repository('backedItems');
          const filter = { tenant: 1, id: character ? 'key' : 1 };
          expect(await repository.findMany({ filter })).toHaveLength(
            character ? 2 : 1,
          );
          context.db.on('query', listener);
          try {
            outcome = await repository.updateOne({
              filter,
              ifVersion: 1,
              values: { name: 'changed' },
            });
          } catch (error) {
            // Commit the caller transaction so a rejected call cannot hide persisted writes.
            outcome = error;
          } finally {
            context.db.off('query', listener);
          }
        } finally {
          await client.raw(
            'alter session set nls_comp = BINARY nls_sort = BINARY',
          );
        }
      }, context.spec.name);
      if (character) {
        expect(outcome).toMatchObject({ code: 'MULTIPLE_RECORDS_MATCHED' });
        expect(statements.some((sql) => /^update\b/i.test(sql))).toBe(false);
        expect(definition?.constraints).toContainEqual(
          expect.objectContaining({
            type: kind,
            name: constraint,
            db: { columnEquality: false },
          }),
        );
        expect(await context.db(table).select('*').orderBy('extra')).toEqual(
          rows,
        );
      } else {
        expect(outcome).toMatchObject({
          record: { ...rows[0], name: 'changed', version: 2 },
          version: 2,
        });
        expect(statements).toHaveLength(2);
        expect(statements[0]).toMatch(/^update\b/i);
        expect(await context.db(table).select('*').orderBy('extra')).toEqual([
          { ...rows[0], name: 'changed', version: 2 },
          rows[1],
        ]);
      }
    },
  );
});

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

describeIntegrationDatabases('Oracle shared backing indexes', (context) => {
  it.each(
    (
      [
        ['unique', 'primary'],
        ['primary', 'unique'],
        ['unique', 'unique'],
      ] as const
    ).flatMap(([first, second]) =>
      [false, true].flatMap((reverseNames) =>
        [false, true].map((character) => ({
          first,
          second,
          reverseNames,
          character,
        })),
      ),
    ),
  )(
    'preserves $first then $second sharing an index (reverse names=$reverseNames, character=$character)',
    async ({ first, second, reverseNames, character }) => {
      await context.builder.createCollection('sharedItems', (c) => {
        if (character) c.string('id').notNull();
        else c.integer('id').notNull();
        c.integer('tenant').notNull();
        c.string('name').notNull();
        c.integer('version').notNull();
        c.optimisticLock('version');
      });
      const table = context.table('sharedItems');
      const index = context.identifier('sharedIndex');
      const names = [context.identifier('aKey'), context.identifier('zKey')];
      if (reverseNames) names.reverse();
      await context.db.raw('create unique index ?? on ?? ("id", "tenant")', [
        index,
        table,
      ]);
      for (const [position, kind] of [first, second].entries()) {
        await context.db.raw(
          `alter table ?? add constraint ?? ${kind === 'primary' ? 'primary key' : 'unique'} (${position === 0 ? '"id", "tenant"' : '"tenant", "id"'}) using index ??`,
          [table, names[position], index],
        );
      }
      context.connection.collections.invalidate();
      const rows = [
        { tenant: 1, id: character ? 'key' : 1, name: 'first', version: 1 },
        { tenant: 1, id: character ? 'KEY' : 2, name: 'second', version: 2 },
      ];
      for (const row of rows) await context.db(table).insert(row);
      const definition =
        await context.connection.collections.get('sharedItems');
      const physical =
        await context.connection.schemaInspector.getPhysicalCollection({
          tableName: table,
        });
      const statements: string[] = [];
      const listener = ({ sql }: { sql: string }) => {
        if (/^(select|update)\b/i.test(sql) && sql.includes(table))
          statements.push(sql);
      };
      let outcome: unknown;
      await context.database.transaction(async (connection) => {
        const client = await connection.client<Knex>();
        await client.raw(
          'alter session set nls_comp = LINGUISTIC nls_sort = BINARY_CI',
        );
        try {
          const repository = connection.repository('sharedItems');
          const filter = { tenant: 1, id: character ? 'key' : 1 };
          expect(await repository.findMany({ filter })).toHaveLength(
            character ? 2 : 1,
          );
          context.db.on('query', listener);
          try {
            outcome = await repository.updateOne({
              filter,
              ifVersion: 1,
              values: { name: 'changed' },
            });
          } catch (error) {
            // Commit the caller transaction to expose writes left behind by rejected calls.
            outcome = error;
          } finally {
            context.db.off('query', listener);
          }
        } finally {
          await client.raw(
            'alter session set nls_comp = BINARY nls_sort = BINARY',
          );
        }
      }, context.spec.name);
      if (character) {
        expect(outcome).toMatchObject({ code: 'MULTIPLE_RECORDS_MATCHED' });
        expect(statements.some((sql) => /^update\b/i.test(sql))).toBe(false);
        expect(await context.db(table).select('*').orderBy('name')).toEqual(
          rows,
        );
        for (const name of names) {
          expect(definition?.constraints).toContainEqual(
            expect.objectContaining({ name, db: { columnEquality: false } }),
          );
        }
      } else {
        expect(outcome).toMatchObject({
          record: { ...rows[0], name: 'changed', version: 2 },
          version: 2,
        });
        expect(statements).toHaveLength(2);
        expect(statements[0]).toMatch(/^update\b/i);
        expect(await context.db(table).select('*').orderBy('id')).toEqual([
          { ...rows[0], name: 'changed', version: 2 },
          rows[1],
        ]);
      }
      const sharedIndex = physical?.indexes.find(
        (entry) => entry.name === index,
      );
      expect(sharedIndex?.keys.map((key) => key.columnName)).toEqual([
        'id',
        'tenant',
      ]);
      expect(sharedIndex?.backsConstraints).toEqual(
        expect.arrayContaining(
          [first, second].map((kind, position) => ({
            kind: kind === 'primary' ? 'primaryKey' : 'unique',
            name: names[position],
          })),
        ),
      );
      expect(sharedIndex?.backsConstraints).toHaveLength(2);
    },
  );
});
