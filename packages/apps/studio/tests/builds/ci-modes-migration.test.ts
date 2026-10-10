// @vitest-environment node
/** How a repository's CI is connected, one choice per kind of CI. */
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'studio-ci-modes-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

describeMigration('202610130010_studio_repo_ci_modes', {
  sources,
  up: async ({ connection, expectCollection }) => {
    await expectCollection('studioRepoCi').toHaveField('setups');
    await connection.query
      .insertInto('studioRepoCi')
      .values({
        resourceId: 'r1',
        auto: true,
        state: 'manual',
        setups: JSON.stringify({
          preview: {
            mode: 'direct',
            apps: [{ directory: '.', appId: 'shop' }],
          },
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
    const row = await connection.query
      .selectFrom('studioRepoCi')
      .select(['setups'])
      .where('resourceId', '=', 'r1')
      .executeTakeFirstOrThrow();
    const setups: unknown =
      typeof row.setups === 'string' ? JSON.parse(row.setups) : row.setups;
    expect(setups).toMatchObject({ preview: { mode: 'direct' } });
    await connection.query
      .deleteFrom('studioRepoCi')
      .where('resourceId', '=', 'r1')
      .execute();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioRepoCi').not.toHaveField('setups');
  },
});
