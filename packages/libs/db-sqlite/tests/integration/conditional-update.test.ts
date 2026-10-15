import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import { expect, it } from 'vitest';

describeIntegrationDatabases(
  'SQLite conditional update identities',
  (context) => {
    it.each([false, true])(
      'returns a cascaded locating key with caller transaction %s',
      async (transactional) => {
        await context.builder.createCollection('cascadeItems', (c) => {
          c.string('id').primary().notNull();
          c.string('code').notNull();
          c.unique(['code']);
          c.string('parentCode').notNull();
          c.unique(['parentCode']);
          c.foreignKey(['parentCode'], {
            references: { collection: 'cascadeItems', fields: ['code'] },
            onUpdate: 'cascade',
          });
          c.integer('version').notNull();
          c.optimisticLock('version');
        });
        const repository = context.database.repository('cascadeItems');
        await repository.createOne({
          values: { id: 'A', code: 'old', parentCode: 'old' },
        });
        const update = (connection: typeof context.connection) =>
          connection.repository('cascadeItems').updateOne({
            filter: { parentCode: 'old' },
            ifVersion: 1,
            values: { code: 'new' },
          });
        const result = transactional
          ? await context.database.transaction(update, context.spec.name)
          : await update(context.connection);
        expect(result).toMatchObject({
          record: { id: 'A', code: 'new', parentCode: 'new', version: 2 },
          version: 2,
        });
        expect(await repository.findOne({ filter: { id: 'A' } })).toEqual(
          result.record,
        );
      },
    );

    it.each([
      ['missing', false],
      ['missing', true],
      ['multiple', false],
      ['multiple', true],
    ] as const)(
      'rolls back a post-write %s invariant failure with caller transaction %s',
      async (failure, transactional) => {
        await context.builder.createCollection('changedIdentityItems', (c) => {
          c.string('id').primary().notNull();
          c.string('code').notNull();
          c.string('name').notNull();
          c.integer('version').notNull();
          c.optimisticLock('version');
        });
        const table = context.table('changedIdentityItems');
        const index = context.table('changedCodeUnique');
        await context.db.raw('create unique index ?? on ?? (code)', [
          index,
          table,
        ]);
        context.connection.collections.invalidate();
        const repository = context.database.repository('changedIdentityItems');
        await repository.createMany({
          values: [
            { id: 'A', code: 'old', name: 'first' },
            { id: 'B', code: 'other', name: 'second' },
          ],
        });
        if (failure === 'missing') {
          // A trigger is not represented in Collection metadata and can change the key.
          await context.db.raw(
            "create trigger ?? after update of name on ?? begin update ?? set code = 'moved' where id = new.id; end",
            [context.table('moveCode'), table, table],
          );
        } else {
          // Keep cached metadata to exercise the invariant after external schema drift.
          await context.db.raw('drop index ??', [index]);
          await context.db(table).where({ id: 'B' }).update({ code: 'old' });
        }
        const before = await repository.findMany({
          sort: (s) => s.field('id').asc(),
        });
        const update = async (connection: typeof context.connection) => {
          await expect(
            connection.repository('changedIdentityItems').updateOne({
              filter: { code: 'old' },
              ifVersion: 1,
              values: { name: 'changed' },
            }),
          ).rejects.toMatchObject({
            code:
              failure === 'missing'
                ? 'RECORD_NOT_FOUND'
                : 'MULTIPLE_RECORDS_MATCHED',
          });
        };
        if (transactional) {
          await context.database.transaction(async (connection) => {
            await connection.repository('changedIdentityItems').createOne({
              values: { id: 'C', code: 'control', name: 'caller write' },
            });
            await update(connection);
          }, context.spec.name);
          before.push({
            id: 'C',
            code: 'control',
            name: 'caller write',
            version: 1,
          });
        } else {
          await update(context.connection);
        }
        expect(
          await repository.findMany({ sort: (s) => s.field('id').asc() }),
        ).toEqual(before);
      },
    );

    it.each(['primary', 'unique', 'index'] as const)(
      'rejects multiple matches when a %s key uses different comparisons',
      async (kind) => {
        const table = context.table('collationItems');
        const constraint =
          kind === 'primary'
            ? 'primary key (code collate binary)'
            : kind === 'unique'
              ? 'primary key (id), unique (code collate binary)'
              : 'primary key (id)';
        await context.db.raw(
          `create table ?? (id varchar(255) not null, code varchar(255) collate nocase not null, name varchar(255) not null, version integer not null, ${constraint})`,
          [table],
        );
        if (kind === 'index') {
          await context.db.raw(
            'create unique index ?? on ?? (code collate binary)',
            [context.table('codeUnique'), table],
          );
        }
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
        for (const secondVersion of [1, 2]) {
          if (secondVersion === 2) {
            await repository.updateMany({
              filter: { id: 'B' },
              values: { name: 'second' },
            });
          }
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
        }
      },
    );
  },
);
