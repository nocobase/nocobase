import { rawRows } from '@nocobase/db';
import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import { expect, it } from 'vitest';

const kinds = ['ordinary', 'local', 'global', 'subpartitioned'] as const;
type IndexKind = (typeof kinds)[number];

describeIntegrationDatabases(
  'Oracle partitioned index identities',
  (context) => {
    async function fixture(kind: IndexKind) {
      const table = context.table('indexItems');
      const index = context.identifier('itemIdentity');
      const bounds =
        '(partition p1 values less than (100), partition p2 values less than (maxvalue))';
      const partitioning =
        kind === 'local' || kind === 'subpartitioned'
          ? ` partition by range ("id")${kind === 'subpartitioned' ? ' subpartition by hash ("id") subpartitions 2' : ''} ${bounds}`
          : '';
      await context.db.raw(
        `create table ?? ("id" number(10) not null, "name" varchar2(64) not null)${partitioning}`,
        [table],
      );
      await context.builder.alterCollection('indexItems', (c) =>
        c.integer('version').notNull(),
      );
      const indexPartitioning =
        kind === 'global'
          ? ` global partition by range ("id") ${bounds}`
          : kind === 'ordinary'
            ? ''
            : ' local';
      await context.db.raw(
        `create unique index ?? on ?? ("id")${indexPartitioning}`,
        [index, table],
      );
      await context.db(table).insert({ id: 1, name: 'before', version: 1 });
      context.connection.collections.invalidate();
      return {
        table,
        index,
        repository: context.database.repository('indexItems'),
      };
    }

    it.each(kinds)(
      'preserves a usable %s index for ordinary and optimistic updates',
      async (kind) => {
        const { table, index, repository } = await fixture(kind);
        expect(
          rawRows(
            await context.db.raw(
              'select status as "status" from user_indexes where index_name = ?',
              [index],
            ),
          ),
        ).toEqual([{ status: kind === 'ordinary' ? 'VALID' : 'N/A' }]);
        const collection =
          await context.connection.collections.get('indexItems');
        expect(collection?.constraints).toContainEqual(
          expect.objectContaining({
            type: 'unique',
            fields: ['id'],
            name: index,
          }),
        );
        expect(collection?.indexes).toContainEqual(
          expect.objectContaining({
            name: index,
            db: expect.objectContaining({ valid: true }),
          }),
        );
        await expect(
          repository.updateOne({
            filter: { id: 1 },
            values: { name: 'ordinary' },
          }),
        ).resolves.toMatchObject({
          record: { id: '1', name: 'ordinary', version: 1 },
        });
        await context.builder.alterCollection('indexItems', (c) =>
          c.optimisticLock('version'),
        );
        await context.connection.collections.get('indexItems');
        const statements: string[] = [];
        const listener = ({ sql }: { sql: string }) => {
          if (/^(select|update)\b/i.test(sql) && sql.includes(table))
            statements.push(sql);
        };
        context.db.on('query', listener);
        try {
          await expect(
            repository.updateOne({
              filter: { id: 1 },
              ifVersion: 1,
              values: { name: 'optimistic' },
            }),
          ).resolves.toMatchObject({
            record: { id: '1', name: 'optimistic', version: 2 },
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

    it.each(kinds)(
      'excludes an unusable %s index and restores its identity after rebuilding',
      async (kind) => {
        const { index, repository } = await fixture(kind);
        let part: string | undefined;
        const level = kind === 'subpartitioned' ? 'subpartition' : 'partition';
        if (kind !== 'ordinary') {
          const parts = rawRows<{ name: string }>(
            await context.db.raw(
              `select ${level}_name as "name" from user_ind_${level}s where index_name = ? order by ${level}_name`,
              [index],
            ),
          );
          expect(parts.length).toBeGreaterThan(1);
          part = parts[0].name;
        }
        await context.db.raw(
          part
            ? `alter index ?? modify ${level} ?? unusable`
            : 'alter index ?? unusable',
          part ? [index, part] : [index],
        );
        context.connection.collections.invalidate();
        const collection =
          await context.connection.collections.get('indexItems');
        expect(collection?.indexes).toContainEqual(
          expect.objectContaining({
            name: index,
            db: expect.objectContaining({ valid: false }),
          }),
        );
        expect(collection?.constraints).not.toContainEqual(
          expect.objectContaining({ type: 'unique', fields: ['id'] }),
        );
        await expect(
          repository.updateOne({
            filter: { id: 1 },
            values: { name: 'must not change' },
          }),
        ).rejects.toMatchObject({ code: 'INVALID_UNIQUE_SELECTOR' });
        expect(await repository.findOne({ filter: { id: 1 } })).toMatchObject({
          name: 'before',
          version: 1,
        });
        await context.db.raw(
          part
            ? `alter index ?? rebuild ${level} ??`
            : 'alter index ?? rebuild',
          part ? [index, part] : [index],
        );
        context.connection.collections.invalidate();
        await expect(
          repository.updateOne({
            filter: { id: 1 },
            values: { name: 'rebuilt' },
          }),
        ).resolves.toMatchObject({ record: { id: '1', name: 'rebuilt' } });
      },
    );
  },
);
