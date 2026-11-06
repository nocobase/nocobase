import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202611020002_create_mutation_receipts', {
  sources: [
    {
      packageName: 'operation-receipts-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    const receipts = await expectCollection('mutationReceipts').toExist();
    expect(receipts.primaryKey).toEqual(['id']);
    await expectCollection('mutationReceipts').toHaveField('expiresAt', {
      nullable: false,
    });
    await connection.query
      .insertInto('mutationReceipts')
      .values({
        id: 'sample',
        digest: 'digest',
        result: '{}',
        expiresAt: new Date(),
      })
      .execute();
    await expect(
      connection.query
        .insertInto('mutationReceipts')
        .values({
          id: 'sample',
          digest: 'other',
          result: '{}',
          expiresAt: new Date(),
        })
        .execute(),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('mutationReceipts').not.toExist();
  },
});
