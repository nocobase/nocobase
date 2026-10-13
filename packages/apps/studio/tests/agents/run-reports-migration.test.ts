// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610240040_studio_run_reports', {
  sources: [
    {
      packageName: 'studio-run-reports-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    const collection = await expectCollection('studioRunReports').toExist();
    expect(collection.primaryKey).toEqual(['id']);
    const row = {
      id: 'run-1',
      status: 'pending',
      payload: { failureReason: 'delegatedQueueTimeout' },
      attempts: 0,
      nextAt: new Date(),
      updatedAt: new Date(),
      lastError: null,
    };
    await connection.repository('studioRunReports').createOne({ values: row });
    expect(
      await connection
        .repository('studioRunReports')
        .findOne({ filter: { id: row.id } }),
    ).toMatchObject({ status: 'pending', payload: row.payload });
    await expect(
      connection.repository('studioRunReports').createOne({ values: row }),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioRunReports').not.toExist();
  },
});
