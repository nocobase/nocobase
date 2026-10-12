// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610250010_studio_pull_request_head_repo', {
  sources: [
    {
      packageName: 'studio-head-repo-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  before: async ({ connection }) => {
    await connection.query
      .insertInto('studioPullRequests')
      .values({
        id: 'legacy',
        repoId: 'repo',
        number: 1,
        url: 'https://example.test/pull/1',
        title: 'Legacy PR',
        state: 'open',
        headRef: 'fix/human',
        baseRef: 'main',
        headSha: 'a',
        authorLogin: 'alice',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
  },
  up: async ({ expectCollection, connection }) => {
    await expectCollection('studioPullRequests').toHaveField('headRepo');
    expect(
      await connection.query
        .selectFrom('studioPullRequests')
        .select(['title', 'headRepo'])
        .where('id', '=', 'legacy')
        .executeTakeFirst(),
    ).toEqual({ title: 'Legacy PR', headRepo: null });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioPullRequests').not.toHaveField('headRepo');
  },
});
