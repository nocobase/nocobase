// @vitest-environment node
/** A demo connection is marked, so Studio never calls its code host. */
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'studio-git-connection-demo-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

describeMigration('202610150010_studio_git_connection_demo', {
  sources,
  up: async ({ connection, expectCollection }) => {
    await expectCollection('studioGitConnections').toHaveField('demo');
    const at = new Date();
    await connection.query
      .insertInto('studioGitConnections')
      .values({
        id: 'c1',
        provider: 'github',
        kind: 'token',
        name: 'Existing',
        webUrl: 'https://github.com',
        apiBaseUrl: 'https://api.github.com',
        allowPersonalTokens: true,
        createdAt: at,
        updatedAt: at,
      })
      .execute();
    const row = await connection.query
      .selectFrom('studioGitConnections')
      .select(['demo'])
      .where('id', '=', 'c1')
      .executeTakeFirstOrThrow();
    // An existing connection is a real one.
    expect(Boolean(row.demo)).toBe(false);
    await connection.query
      .deleteFrom('studioGitConnections')
      .where('id', '=', 'c1')
      .execute();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioGitConnections').not.toHaveField('demo');
  },
});
