// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'studio-previews-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

const preview = (id: string, targetAppId: string | null) => ({
  id,
  resourceId: 'r1',
  pullRequestId: 'pr1',
  repo: 'acme/shop',
  number: 12,
  targetAppId,
  appId: `${targetAppId ?? 'shop'}-pr-12`,
  environmentId: 'preview',
  status: 'waiting',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Previews keyed by pull request and the App previewed; a repository's preview variables; its CI's workflow files.
describeMigration('202610120020_studio_previews_per_pull_request', {
  sources,
  up: async ({ connection, expectCollection }) => {
    await expectCollection('studioPreviews').toHaveField('pullRequestId');
    await expectCollection('studioPreviews').not.toHaveField('issueId');
    await expectCollection('studioRepoPreviewVariables').toExist();
    await expectCollection('studioRepoCi').toHaveField('workflowPaths');
    await expectCollection('studioRepoRemovedApps').not.toExist();
    // A pull request has a preview per App, and one of the repository itself.
    await connection.query
      .insertInto('studioPreviews')
      .values([preview('a', 'web'), preview('b', null)])
      .execute();
    // A preview App belongs to one preview.
    await expect(
      connection.query
        .insertInto('studioPreviews')
        .values({ ...preview('c', 'web'), appId: 'shop-pr-12' })
        .execute(),
    ).rejects.toThrow();
    await connection.query
      .deleteFrom('studioPreviews')
      .where('resourceId', '=', 'r1')
      .execute();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioPreviews').toHaveField('issueId');
    await expectCollection('studioRepoPreviewVariables').not.toExist();
    await expectCollection('studioRepoCi').not.toHaveField('workflowPaths');
    await expectCollection('studioRepoRemovedApps').toExist();
  },
});
