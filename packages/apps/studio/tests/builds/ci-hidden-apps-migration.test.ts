// @vitest-environment node
/** The Apps taken off a repository's "Deployment" list, one row per repository, environment and App. */
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'studio-ci-hidden-apps-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

const row = (id: string, pullRequests: boolean) => ({
  id,
  resourceId: 'r1',
  environmentId: 'preview',
  appId: 'crm',
  pullRequests,
  hiddenBy: 'alice',
  hiddenAt: new Date(),
});

describeMigration('202610170030_studio_create_repo_ci_hidden_apps', {
  sources,
  up: async ({ connection, expectCollection }) => {
    await expectCollection('studioRepoCiHiddenApps').toHaveField('hiddenAt');
    // The App and the pull requests' Apps of the same application are two rows; each one once.
    await connection.query
      .insertInto('studioRepoCiHiddenApps')
      .values([row('a', true), row('b', false)])
      .execute();
    await expect(
      connection.query
        .insertInto('studioRepoCiHiddenApps')
        .values(row('c', true))
        .execute(),
    ).rejects.toThrow();
    await connection.query
      .deleteFrom('studioRepoCiHiddenApps')
      .where('resourceId', '=', 'r1')
      .execute();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioRepoCiHiddenApps').not.toExist();
  },
});
