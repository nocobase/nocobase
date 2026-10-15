import { rawRows } from '@nocobase/db';
import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import type { Knex } from 'knex';
import { expect, it } from 'vitest';

describeIntegrationDatabases(
  'PostgreSQL conditional update identities',
  (context) => {
    it.each([1, 2])(
      'rejects different operator-class equality with second row version %s',
      async (secondVersion) => {
        await context.db.raw('create extension if not exists citext');
        const table = context.table('opclassItems');
        const index = context.table('opclassUnique');
        await context.db.raw(
          'create table ?? (id varchar(64) not null, code citext not null, name varchar(64) not null, version integer not null)',
          [table],
        );
        await context.db.raw('create unique index ?? on ?? (code text_ops)', [
          index,
          table,
        ]);
        await context.builder.alterCollection('opclassItems', (c) =>
          c.optimisticLock('version'),
        );
        const repository = context.database.repository('opclassItems');
        await repository.createMany({
          values: [
            { id: 'A', code: 'key', name: 'first' },
            { id: 'B', code: 'KEY', name: 'second' },
          ],
        });
        await context
          .db(table)
          .where({ id: 'B' })
          .update({ version: secondVersion });
        const collection =
          await context.connection.collections.get('opclassItems');
        expect(collection?.constraints).toContainEqual(
          expect.objectContaining({
            type: 'unique',
            fields: ['code'],
            db: { columnEquality: false },
          }),
        );
        await expect(
          repository.updateOne({
            filter: { code: 'key' },
            ifVersion: 1,
            values: { name: 'changed' },
          }),
        ).rejects.toMatchObject({ code: 'MULTIPLE_RECORDS_MATCHED' });
        expect(
          await repository.findMany({ sort: (s) => s.field('id').asc() }),
        ).toEqual([
          { id: 'A', code: 'key', name: 'first', version: 1 },
          { id: 'B', code: 'KEY', name: 'second', version: secondVersion },
        ]);
      },
    );

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
    it('rejects multiple matches when an index overrides a nondeterministic column collation', async () => {
      const collation = context.identifier('caseInsensitive');
      const table = context.table('collationItems');
      await context.db.raw(
        "create collation ?? (provider = icu, locale = 'und-u-ks-level2', deterministic = false)",
        [collation],
      );
      try {
        await context.db.raw(
          'create table ?? (id varchar(255) primary key, code varchar(255) collate ?? not null, name varchar(255) not null, version integer not null)',
          [table, collation],
        );
        await context.db.raw(
          'create unique index ?? on ?? (code collate "C")',
          [context.table('codeUnique'), table],
        );
        await context.builder.alterCollection('collationItems', (c) =>
          c.optimisticLock('version'),
        );
        const repository = context.database.repository('collationItems');
        await repository.createMany({
          values: [
            { id: 'A', code: 'key', name: 'first' },
            { id: 'B', code: 'KEY', name: 'second' },
          ],
        });
        await expect(
          repository.updateOne({
            filter: { code: 'key' },
            ifVersion: 1,
            values: { name: 'changed' },
          }),
        ).rejects.toMatchObject({ code: 'MULTIPLE_RECORDS_MATCHED' });
        expect(
          await repository.findMany({ sort: (s) => s.field('id').asc() }),
        ).toEqual([
          { id: 'A', code: 'key', name: 'first', version: 1 },
          { id: 'B', code: 'KEY', name: 'second', version: 1 },
        ]);
      } finally {
        await context.db.schema.dropTableIfExists(table);
        await context.db.raw('drop collation ??', [collation]);
      }
    });

    it.each(['immediate', 'deferred'] as const)(
      'preserves a %s primary key and rejects temporarily duplicate identities',
      async (deferrable) => {
        await context.builder.createCollection('deferredItems', (c) => {
          c.string('id').notNull();
          c.primary(['id'], { deferrable });
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
            deferrable,
          }),
        );
        await context.database.transaction(async (connection) => {
          await (
            await connection.client<Knex>()
          ).raw('set constraints all deferred');
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
          // Restore uniqueness so a successful commit cannot hide an accidental write.
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
      },
    );
  },
);
