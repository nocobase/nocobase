import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610260001_ag_run_revision', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    await connection.repository('agRuns').createOne({
      values: {
        id: 'existing',
        agentId: 'manager',
        subjectKind: 'sample',
        subjectId: '1',
        threadScope: 'main',
        actorUserId: 'owner',
        status: 'running',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('agRuns').toHaveField('revision', {
      type: 'integer',
      nullable: false,
    });
    expect(
      (await connection.collections.get('agRuns'))?.optimisticLock?.field,
    ).toBe('revision');
    await connection.query
      .insertInto('agRuns')
      .values({
        id: 'defaulted',
        agentId: 'manager',
        subjectKind: 'sample',
        subjectId: '2',
        threadScope: 'main',
        actorUserId: 'owner',
        status: 'running',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .execute();
    expect(
      (
        await connection
          .repository('agRuns')
          .findOne({ filter: { id: 'defaulted' } })
      )?.revision,
    ).toBe(1);
    await connection.query
      .deleteFrom('agRuns')
      .where('id', '=', 'defaulted')
      .execute();
    const repo = connection.repository('agRuns');
    expect((await repo.findOne({ filter: { id: 'existing' } }))?.revision).toBe(
      1,
    );
    expect(
      await repo.updateMany({
        filter: { id: 'existing', revision: 1 },
        values: { summary: 'updated' },
      }),
    ).toMatchObject({ updatedCount: 1 });
    expect((await repo.findOne({ filter: { id: 'existing' } }))?.revision).toBe(
      2,
    );
    expect(
      await repo.updateMany({
        filter: { id: 'existing', revision: 1 },
        values: { summary: 'stale' },
      }),
    ).toMatchObject({ updatedCount: 0 });
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('agRuns').not.toHaveField('revision');
    expect(
      (await connection.collections.get('agRuns'))?.optimisticLock,
    ).toBeUndefined();
  },
});
