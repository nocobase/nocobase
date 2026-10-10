// @vitest-environment node
/** Each application of a repository's CI choice carries its own mode. */
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { DatabaseConnection, MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'studio-ci-app-modes-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

async function setupsOf(connection: DatabaseConnection): Promise<unknown> {
  const row = await connection.query
    .selectFrom('studioRepoCi')
    .select(['setups'])
    .where('resourceId', '=', 'r1')
    .executeTakeFirstOrThrow();
  return typeof row.setups === 'string'
    ? (JSON.parse(row.setups) as unknown)
    : row.setups;
}

describeMigration('202610160010_studio_repo_ci_app_modes', {
  sources,
  before: async ({ connection }) => {
    await connection.query
      .insertInto('studioRepoCi')
      .values({
        resourceId: 'r1',
        auto: true,
        state: 'manual',
        setups: JSON.stringify({
          preview: {
            mode: 'template',
            apps: [
              { directory: '.', appId: 'shop' },
              { directory: 'apps/admin', appId: 'admin' },
            ],
          },
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
  },
  up: async ({ connection }) => {
    expect(await setupsOf(connection)).toEqual({
      preview: {
        mode: 'template',
        apps: [
          { directory: '.', appId: 'shop', mode: 'template' },
          { directory: 'apps/admin', appId: 'admin', mode: 'template' },
        ],
      },
    });
  },
  down: async ({ connection }) => {
    expect(await setupsOf(connection)).toEqual({
      preview: {
        mode: 'template',
        apps: [
          { directory: '.', appId: 'shop' },
          { directory: 'apps/admin', appId: 'admin' },
        ],
      },
    });
  },
});
