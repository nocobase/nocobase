// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610230010_studio_preview_label_etag', {
  sources: [
    {
      packageName: 'studio-previews-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  before: async ({ connection }) => {
    await connection.query
      .insertInto('studioPreviewLabels')
      .values({
        pullRequestId: 'existing',
        managed: true,
        present: true,
        failed: false,
      })
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('studioPreviewLabels').toHaveField('etag');
    expect(
      await connection
        .repository('studioPreviewLabels')
        .findOne({ filter: { pullRequestId: 'existing' } }),
    ).toMatchObject({
      managed: true,
      present: true,
      failed: false,
      etag: null,
    });
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('studioPreviewLabels').not.toHaveField('etag');
    expect(
      await connection
        .repository('studioPreviewLabels')
        .findOne({ filter: { pullRequestId: 'existing' } }),
    ).toMatchObject({ managed: true, present: true, failed: false });
  },
});
