// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-projects',
    directory: path.resolve(import.meta.dirname, '../fixtures/projects-issues'),
  },
  {
    packageName: '@nocobase/studio',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

const notice = (id: string, source: string, type: string) => ({
  id,
  notificationId: id,
  userId: 'u1',
  source,
  kind: 'decision',
  type,
  createdAt: new Date(),
});

type Connection = Parameters<
  NonNullable<Parameters<typeof describeMigration>[1]['up']>
>[0]['connection'];

async function ids(connection: Connection, table: string): Promise<string[]> {
  const rows = await connection.query.selectFrom(table).select('id').execute();
  return rows.map((row) => String(row.id)).sort();
}

describeMigration('202610240030_studio_project_manager', {
  sources,
  before: async ({ connection }) => {
    await connection.query
      .insertInto('pmIssues')
      .values([
        { id: 'by-agent', executorType: 'agent', executorId: 'studio-dev' },
        { id: 'by-person', executorType: 'user', executorId: 'u1' },
        { id: 'nobody', executorType: null, executorId: null },
      ])
      .execute();
    await connection.query
      .insertInto('studioStageRunGuards')
      .values([
        { id: 'i1:in_review', issueId: 'i1', statusKey: 'in_review' },
        { id: 'i1:@comments', issueId: 'i1', statusKey: '@comments' },
      ])
      .execute();
    await connection.query
      .insertInto('studioInboxNotices')
      .values([
        notice('approval', 'projects', 'approval_requested'),
        notice('design', 'projects', 'design_review'),
        notice('stage', 'projects', 'stage_action_problem'),
        notice('failed', 'projects', 'run_failed_final'),
        notice('merge', 'git', 'design_review'),
      ])
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('studioGitRepos').toHaveField('wakeOnChecksPassed');
    const issues = await connection.query
      .selectFrom('pmIssues')
      .select(['id', 'executorType', 'executorId'])
      .execute();
    expect(
      Object.fromEntries(issues.map((row) => [row.id, row.executorId])),
    ).toEqual({
      'by-agent': 'studio-project-manager',
      'by-person': 'u1',
      nobody: null,
    });
    expect(await ids(connection, 'studioStageRunGuards')).toEqual([
      'i1:@comments',
    ]);
    const notices = await connection.query
      .selectFrom('studioInboxNotices')
      .select(['id', 'outcome'])
      .execute();
    expect(
      Object.fromEntries(notices.map((row) => [row.id, row.outcome])),
    ).toEqual({
      approval: 'withdrawn',
      design: 'withdrawn',
      stage: 'withdrawn',
      failed: null,
      merge: null,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioGitRepos').not.toHaveField(
      'wakeOnChecksPassed',
    );
  },
});
