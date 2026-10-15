import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../../helpers.js';
import { captureSql, createTenantFixture } from '../fixtures/tenants.js';
import { collectEvents } from '../events/fixture.js';

describeIntegrationDatabases(
  'Repository conditional optimistic updates',
  (context) => {
    it('does not infer global uniqueness from a partial unique index', async ({
      skip,
    }) => {
      if (!context.connection.capabilities.partialIndexes) skip();
      await context.builder.createCollection('partialItems', (c) => {
        c.string('id').primary().notNull();
        c.string('code').notNull();
        c.integer('active');
        c.unique(['code'], { predicate: { active: { $notNull: true } } });
        c.string('name').notNull();
        c.integer('version').notNull();
        c.optimisticLock('version');
      });
      const repository = context.database.repository('partialItems');
      await repository.createMany({
        values: [
          { id: 'A', code: 'same', active: null, name: 'first' },
          { id: 'B', code: 'same', active: null, name: 'second' },
        ],
      });
      const definition =
        await context.connection.collections.get('partialItems');
      expect(definition?.constraints).not.toContainEqual(
        expect.objectContaining({ type: 'unique', fields: ['code'] }),
      );
      for (const version of [1, 2]) {
        if (version === 2)
          await repository.updateOne({
            filter: { id: 'B' },
            ifVersion: 1,
            values: { name: 'second' },
          });
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
          { id: 'A', code: 'same', active: null, name: 'first', version: 1 },
          { id: 'B', code: 'same', active: null, name: 'second', version },
        ]);
      }
    });

    async function fixture() {
      await context.builder.createCollection('optimisticItems', (c) => {
        c.string('id').primary().notNull();
        c.string('tenantId').notNull();
        c.string('code').notNull();
        c.unique(['tenantId', 'code']);
        c.string('name').notNull();
        c.integer('amount').notNull();
        c.integer('revisionCounter').notNull();
        c.optimisticLock('revisionCounter');
      });
      const repository = context.database.repository('optimisticItems');
      await repository.createMany({
        values: [
          { id: 'A', tenantId: 'T1', code: 'one', name: 'First', amount: 10 },
          { id: 'B', tenantId: 'T1', code: 'two', name: 'Second', amount: 20 },
        ],
      });
      return repository;
    }

    function businessStatements(statements: readonly string[]) {
      return statements.filter(
        (sql) =>
          /^(select|update)\b/i.test(sql) &&
          sql.includes(context.table('optimisticItems')),
      );
    }

    it('preserves deferred primary key cardinality inside a transaction', async ({
      skip,
    }) => {
      if (!context.connection.capabilities.deferrableConstraints) skip();
      await context.builder.createCollection('deferredItems', (c) => {
        c.string('id').notNull();
        c.primary(['id'], { deferrable: 'deferred' });
        c.string('name').notNull();
        c.string('marker').notNull();
        c.integer('version').notNull();
        c.optimisticLock('version');
      });
      const collection =
        await context.connection.collections.get('deferredItems');
      expect(collection?.constraints).toContainEqual(
        expect.objectContaining({
          type: 'primary',
          fields: ['id'],
          deferrable: 'deferred',
        }),
      );
      await context.database.transaction(async (connection) => {
        const repository = connection.repository('deferredItems');
        await repository.createMany({
          values: [
            { id: 'A', name: 'first', marker: 'first' },
            { id: 'A', name: 'second', marker: 'second' },
          ],
        });
        await expect(
          repository.updateOne({
            filter: { id: 'A' },
            ifVersion: 1,
            values: { name: 'changed' },
          }),
        ).rejects.toMatchObject({ code: 'MULTIPLE_RECORDS_MATCHED' });
        await repository.updateMany({
          filter: { marker: 'second' },
          values: { id: 'B' },
        });
      }, context.spec.name);
      expect(
        await context.database
          .repository('deferredItems')
          .findMany({ sort: (s) => s.field('id').asc() }),
      ).toEqual([
        { id: 'A', name: 'first', marker: 'first', version: 1 },
        { id: 'B', name: 'second', marker: 'second', version: 2 },
      ]);
    });

    it('updates values and a custom version in one statement before reading the result', async () => {
      const repository = await fixture();
      const { result, statements } = await captureSql(context, () =>
        repository.updateOne({
          filter: { id: 'A', tenantId: 'T1' },
          ifVersion: 1,
          values: { name: 'Changed', amount: (value) => value.increment(4) },
          select: (s) => s.fields('name', 'amount'),
        }),
      );
      expect(result).toEqual({
        record: { name: 'Changed', amount: 14 },
        version: 2,
        createdTargets: [],
      });
      const sql = businessStatements(statements);
      expect(sql).toHaveLength(2);
      expect(sql[0]).toMatch(/^update\b/i);
      expect(sql[0]).toMatch(/revision_counter.*\+/i);
      expect(sql[0]).toMatch(/where.*revision_counter/i);
      expect(sql[1]).toMatch(/^select\b/i);
      expect(sql.join('\n')).not.toMatch(/for update/i);
    });

    it('preserves the primary identity when filtering by a secondary composite key', async () => {
      const repository = await fixture();
      const { statements } = await captureSql(context, () =>
        repository.updateOne({
          filter: { tenantId: 'T1', code: 'one', name: 'First' },
          ifVersion: 1,
          values: { name: 'Changed' },
        }),
      );
      expect(businessStatements(statements)).toHaveLength(4);
      await expect(
        repository.updateOne({
          filter: { tenantId: 'T1', code: 'one', name: 'First' },
          ifVersion: 2,
          values: { name: 'Must not change' },
        }),
      ).rejects.toMatchObject({ code: 'RECORD_NOT_FOUND' });
      expect(await repository.findOne({ filter: { id: 'A' } })).toMatchObject({
        name: 'Changed',
        revisionCounter: 2,
      });
    });

    it.each(['primary', 'unique'] as const)(
      'optimizes a complete composite %s identity',
      async (kind) => {
        await context.builder.createCollection('optimisticItems', (c) => {
          c.string('tenantId').notNull();
          c.string('code').notNull();
          if (kind === 'primary') c.primary(['tenantId', 'code']);
          else c.unique(['tenantId', 'code']);
          c.string('name').notNull();
          c.integer('version').notNull();
          c.optimisticLock('version');
        });
        const repository = context.database.repository('optimisticItems');
        await repository.createOne({
          values: { tenantId: 'T1', code: 'one', name: 'First' },
        });
        const { result, statements } = await captureSql(context, () =>
          repository.updateOne({
            filter: { tenantId: 'T1', code: 'one' },
            ifVersion: 1,
            values: { name: 'Changed' },
          }),
        );
        expect(result).toMatchObject({
          record: { tenantId: 'T1', code: 'one', name: 'Changed', version: 2 },
          version: 2,
        });
        expect(businessStatements(statements)).toHaveLength(2);
      },
    );

    it('rejects stale versions without changing scalar or atomic values', async () => {
      const repository = await fixture();
      await repository.updateOne({
        filter: { id: 'A' },
        ifVersion: 1,
        values: { name: 'Winner' },
      });
      await expect(
        repository.updateOne({
          filter: { id: 'A' },
          ifVersion: 1,
          values: { name: 'Stale', amount: (value) => value.increment(100) },
        }),
      ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
      expect(await repository.findOne({ filter: { id: 'A' } })).toMatchObject({
        name: 'Winner',
        amount: 10,
        revisionCounter: 2,
      });
      await expect(
        repository.updateOne({
          filter: { id: 'missing' },
          ifVersion: 1,
          values: { name: 'Missing' },
        }),
      ).rejects.toMatchObject({ code: 'RECORD_NOT_FOUND' });
    });

    it('rejects empty values and increments once for unchanged values', async () => {
      const repository = await fixture();
      await expect(
        repository.updateOne({ filter: { id: 'A' }, ifVersion: 1, values: {} }),
      ).rejects.toMatchObject({ code: 'INVALID_MUTATION' });
      for (const ifVersion of [1, 2]) {
        const values = { name: 'First' };
        const { result, statements } = await captureSql(context, () =>
          repository.updateOne({ filter: { id: 'A' }, ifVersion, values }),
        );
        expect(result.version).toBe(ifVersion + 1);
        expect(businessStatements(statements)).toHaveLength(2);
      }
    });

    it('rolls back both the data and version with the caller transaction', async () => {
      const repository = await fixture();
      await expect(
        context.database.transaction(async (connection) => {
          await connection.repository('optimisticItems').updateOne({
            filter: { id: 'A' },
            ifVersion: 1,
            values: { amount: 99 },
          });
          throw new Error('Abort the transaction');
        }, context.spec.name),
      ).rejects.toThrow('Abort the transaction');
      expect(await repository.findOne({ filter: { id: 'A' } })).toMatchObject({
        amount: 10,
        revisionCounter: 1,
      });
    });

    it('rejects multiple matches even when only one row has the requested version', async () => {
      const repository = await fixture();
      await repository.updateOne({
        filter: { id: 'A' },
        ifVersion: 1,
        values: { name: 'First' },
      });
      await expect(
        repository.updateOne({
          filter: { tenantId: 'T1' },
          ifVersion: 1,
          values: { name: 'Changed' },
        }),
      ).rejects.toMatchObject({ code: 'MULTIPLE_RECORDS_MATCHED' });
      await expect(
        repository.updateOne({
          filter: (f) => f.or([f.string('id').eq('A'), f.string('id').eq('B')]),
          ifVersion: 1,
          values: { name: 'Changed' },
        }),
      ).rejects.toMatchObject({ code: 'MULTIPLE_RECORDS_MATCHED' });
      expect(await repository.findOne({ filter: { id: 'B' } })).toMatchObject({
        name: 'Second',
        revisionCounter: 1,
      });
    });

    it('does not change the comparison semantics of string versions', async () => {
      const repository = await fixture();
      await expect(
        repository.updateOne({
          filter: { id: 'A' },
          ifVersion: '1',
          values: { name: 'Changed' },
        }),
      ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
    });

    it('retains OR predicates beside a required unique key', async () => {
      const repository = await fixture();
      const { statements } = await captureSql(context, () =>
        repository.updateOne({
          filter: (f) =>
            f.and([
              f.string('id').eq('A'),
              f.or([f.string('name').eq('First'), f.number('amount').gt(100)]),
            ]),
          ifVersion: 1,
          values: { name: 'Changed' },
        }),
      );
      expect(businessStatements(statements)).toHaveLength(2);
      await expect(
        repository.updateOne({
          filter: (f) =>
            f.and([
              f.string('id').eq('A'),
              f.or([f.string('name').eq('First'), f.number('amount').gt(100)]),
            ]),
          ifVersion: 2,
          values: { name: 'Wrong' },
        }),
      ).rejects.toMatchObject({ code: 'RECORD_NOT_FOUND' });
    });

    it('keeps the original path when the locating unique key changes', async () => {
      const repository = await fixture();
      const result = await repository.updateOne({
        filter: { tenantId: 'T1', code: 'one' },
        ifVersion: 1,
        values: { code: 'new' },
      });
      expect(result).toMatchObject({
        record: { id: 'A', code: 'new' },
        version: 2,
      });
    });

    it('preserves observed updates and rolls back listener failures', async () => {
      const repository = await fixture();
      const seen = collectEvents();
      let reject = false;
      const off = context.connection.onRepositoryMutation(
        { collections: ['optimisticItems'] },
        {
          inTransaction: async (event, connection) => {
            if (reject) throw new Error('Rejected by listener');
            await seen.listeners.inTransaction?.(event, connection);
          },
          afterCommit: seen.listeners.afterCommit,
        },
      );
      try {
        await repository.updateOne({
          filter: { id: 'A' },
          ifVersion: 1,
          values: { name: 'Observed' },
        });
        expect(seen.batches).toHaveLength(1);
        expect(seen.batches[0]).toMatchObject([
          {
            operation: 'updateOne',
            changes: [
              { key: { id: 'A' }, fields: ['name', 'revisionCounter'] },
            ],
          },
        ]);
        reject = true;
        await expect(
          repository.updateOne({
            filter: { id: 'A' },
            ifVersion: 2,
            values: { name: 'Rejected' },
          }),
        ).rejects.toThrow('Rejected by listener');
        expect(await repository.findOne({ filter: { id: 'A' } })).toMatchObject(
          { name: 'Observed', revisionCounter: 2 },
        );
        expect(seen.batches).toHaveLength(1);
      } finally {
        off();
      }
    });

    it('keeps out-of-scope and missing records indistinguishable', async () => {
      await createTenantFixture(context);
      const repository = context.database
        .repository('policyProjects')
        .withPolicy({
          read: { scope: { tenantId: 'T1' }, fields: ['id', 'name'] },
          create: false,
          delete: false,
          update: { scope: { tenantId: 'T1' }, fields: ['name'] },
        });
      for (const id of ['p3', 'missing']) {
        await expect(
          repository.updateOne({
            filter: { id },
            ifVersion: 999,
            values: { name: 'Hidden' },
          }),
        ).rejects.toMatchObject({ code: 'RECORD_NOT_FOUND' });
      }
      await expect(
        repository.updateOne({
          filter: { id: 'p1' },
          ifVersion: 999,
          values: { name: 'Stale' },
        }),
      ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
      const result = await repository.updateOne({
        filter: { id: 'p1' },
        ifVersion: 1,
        values: { name: 'Allowed' },
        select: (s) => s.fields('name'),
      });
      expect(result).toMatchObject({ record: { name: 'Allowed' }, version: 2 });
    });

    it('rolls back an update that would move the record outside its write scope', async () => {
      await createTenantFixture(context);
      const repository = context.database
        .repository('policyProjects')
        .withPolicy({
          read: { scope: true, fields: ['id', 'name'] },
          create: false,
          delete: false,
          update: { scope: { tenantId: 'T1' }, fields: ['tenantId', 'name'] },
        });
      await expect(
        repository.updateOne({
          filter: { id: 'p1' },
          ifVersion: 1,
          values: { tenantId: 'T2', name: 'Moved' },
        }),
      ).rejects.toMatchObject({ code: 'SCOPE_VIOLATION' });
      expect(
        await context.database
          .repository('policyProjects')
          .findOne({ filter: { id: 'p1' } }),
      ).toMatchObject({ tenantId: 'T1', name: 'Mine one', version: 1 });
    });
  },
);
