// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const FIELDS = [
  'mergedHeadSha',
  'mergedHeadSource',
  'mergedHeadAt',
  'mergedHeadCheckedAt',
] as const;

describeMigration('202610230010_studio_pull_request_merged_heads', {
  sources: [
    {
      packageName: 'studio-merged-heads-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  before: async ({ connection }) => {
    // A pull request recorded merged before the migration: its head is not taken as confirmed.
    const now = new Date();
    await connection.query
      .insertInto('studioGitRepos')
      .values({
        id: 'r1',
        provider: 'github',
        apiBaseUrl: 'https://api.github.com',
        repo: 'acme/app',
        branchRules: '[]',
        wakeOnChecks: false,
        wakeOnConflict: false,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await connection.query
      .insertInto('studioPullRequests')
      .values({
        id: 'p1',
        repoId: 'r1',
        number: 1,
        url: 'https://github.com/acme/app/pull/1',
        title: 'Old',
        state: 'merged',
        draft: false,
        headRef: 'agent/PM-1',
        baseRef: 'main',
        headSha: 'a'.repeat(40),
        authorLogin: 'agent',
        mergedManually: false,
        mergeCheckAttempts: 0,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    for (const field of FIELDS)
      await expectCollection('studioPullRequests').toHaveField(field);
    const row = await connection.query
      .selectFrom('studioPullRequests')
      .selectAll()
      .where('id', '=', 'p1')
      .executeTakeFirst();
    expect(row?.headSha).toBe('a'.repeat(40));
    expect(row?.mergedHeadSha ?? null).toBeNull();
    expect(row?.mergedHeadSource ?? null).toBeNull();
  },
  down: async ({ connection, expectCollection }) => {
    for (const field of FIELDS)
      await expectCollection('studioPullRequests').not.toHaveField(field);
    const row = await connection.query
      .selectFrom('studioPullRequests')
      .select(['id', 'headSha'])
      .where('id', '=', 'p1')
      .executeTakeFirst();
    expect(row?.headSha).toBe('a'.repeat(40));
  },
});
