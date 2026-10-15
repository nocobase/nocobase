import { describeIntegrationDatabases } from '@nocobase/db-testkit';
import { expect, it } from 'vitest';

describeIntegrationDatabases(
  'SQLite conditional update identities',
  (context) => {
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
