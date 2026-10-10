// @vitest-environment node
/** A build is of one App at one commit: `studioBuilds` drops `purpose`. */
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'studio-builds-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

const build = (id: string) => ({
  id,
  appId: 'shop',
  resourceId: 'r1',
  sha: 'a'.repeat(40),
  state: 'queued',
  superseded: false,
  verifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

describeMigration('202610140010_studio_builds_per_app_and_commit', {
  sources,
  up: async ({ connection, expectCollection }) => {
    await expectCollection('studioBuilds').not.toHaveField('purpose');
    await connection.query
      .insertInto('studioBuilds')
      .values(build('a'))
      .execute();
    // One build per App and commit.
    await expect(
      connection.query.insertInto('studioBuilds').values(build('b')).execute(),
    ).rejects.toThrow();
    await connection.query
      .deleteFrom('studioBuilds')
      .where('resourceId', '=', 'r1')
      .execute();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioBuilds').toHaveField('purpose');
  },
});
