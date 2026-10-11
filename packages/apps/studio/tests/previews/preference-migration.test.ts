// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610210010_issue_preview_preferences', {
  sources: [
    {
      packageName: 'studio-previews-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    await expectCollection('studioIssuePreviewPreferences').toHaveField(
      'notRequired',
    );
    await expectCollection('studioPreviewLabels').toHaveField('managed');
    await connection.query
      .insertInto('studioIssuePreviewPreferences')
      .values({ issueId: 'one' })
      .execute();
    const row = await connection
      .repository('studioIssuePreviewPreferences')
      .findOne({ filter: { issueId: 'one' } });
    expect(row?.notRequired).toBe(false);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioIssuePreviewPreferences').not.toExist();
    await expectCollection('studioPreviewLabels').not.toExist();
  },
});
