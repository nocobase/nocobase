// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610260010_studio_pull_request_link_choices', {
  sources: [
    {
      packageName: 'studio-link-choice-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection, connection }) => {
    await expectCollection('studioPullRequestLinkChoices').toHaveField(
      'suppressed',
    );
    await connection.query
      .insertInto('studioPullRequestLinkChoices')
      .values({
        id: 'choice',
        issueId: 'issue',
        pullRequestId: 'pr',
        suppressed: true,
        updatedAt: new Date(),
      })
      .execute();
    expect(
      await connection.query
        .selectFrom('studioPullRequestLinkChoices')
        .select(['issueId', 'pullRequestId'])
        .executeTakeFirst(),
    ).toEqual({ issueId: 'issue', pullRequestId: 'pr' });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioPullRequestLinkChoices').not.toExist();
  },
});
