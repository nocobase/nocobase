// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'studio-previews-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

// A repository's preview variables are gone, values and all; down brings the empty table back.
describeMigration('202610170050_studio_drop_repo_preview_variables', {
  sources,
  before: async ({ connection }) => {
    await connection.query
      .insertInto('studioRepoPreviewVariables')
      .values({
        id: 'v1',
        resourceId: 'r1',
        name: 'SMTP_HOST',
        value: 'sealed',
        secret: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
  },
  up: async ({ expectCollection }) => {
    await expectCollection('studioRepoPreviewVariables').not.toExist();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioRepoPreviewVariables').toHaveField('value');
    await expectCollection('studioRepoPreviewVariables').toHaveField('secret');
  },
});
