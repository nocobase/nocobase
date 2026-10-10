// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610210010_studio_stage_run_guards', {
  sources: [
    {
      packageName: 'studio-stage-run-guard-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    const collection = await expectCollection('studioStageRunGuards').toExist();
    expect(collection.primaryKey).toEqual(['id']);
    const row = {
      id: 'i1:in_review',
      issueId: 'i1',
      statusKey: 'in_review',
      resetAt: new Date(),
      pendingToken: 'token',
      agentId: 'reviewer',
      fromStatus: 'in_progress',
      ruleConfig: { maxRuns: 5 },
    };
    await connection
      .repository('studioStageRunGuards')
      .createOne({ values: row });
    expect(
      await connection
        .repository('studioStageRunGuards')
        .findOne({ filter: { id: row.id } }),
    ).toMatchObject({ pendingToken: 'token', ruleConfig: { maxRuns: 5 } });
    await expect(
      connection.repository('studioStageRunGuards').createOne({ values: row }),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioStageRunGuards').not.toExist();
  },
});
