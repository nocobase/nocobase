// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610240050_studio_manager_idle', {
  sources: [
    {
      packageName: 'studio-idle-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    const collection = await expectCollection('studioManagerIdle').toExist();
    expect(collection.primaryKey).toEqual(['id']);
    const row = {
      id: 'issue',
      epoch: 'epoch',
      lastAt: new Date(),
      wokenEpoch: null,
    };
    await connection.repository('studioManagerIdle').createOne({ values: row });
    await expect(
      connection.repository('studioManagerIdle').createOne({ values: row }),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioManagerIdle').not.toExist();
  },
});
