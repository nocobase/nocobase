// @vitest-environment node
/** Why a repository's CI setup last failed, kept by reason beside its words. */
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'studio-ci-last-failure-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

describeMigration('202610180010_studio_repo_ci_last_failure', {
  sources,
  up: async ({ connection, expectCollection }) => {
    await expectCollection('studioRepoCi').toHaveField('lastFailure');
    await connection.query
      .insertInto('studioRepoCi')
      .values({
        resourceId: 'r1',
        auto: true,
        state: 'manual',
        lastError: 'Acme demo is a demo connection.',
        lastFailure: JSON.stringify({ reason: 'demoConnection', params: {} }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
    const row = await connection.query
      .selectFrom('studioRepoCi')
      .select(['lastFailure'])
      .where('resourceId', '=', 'r1')
      .executeTakeFirstOrThrow();
    const failure: unknown =
      typeof row.lastFailure === 'string'
        ? JSON.parse(row.lastFailure)
        : row.lastFailure;
    expect(failure).toEqual({ reason: 'demoConnection', params: {} });
    await connection.query
      .deleteFrom('studioRepoCi')
      .where('resourceId', '=', 'r1')
      .execute();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioRepoCi').not.toHaveField('lastFailure');
  },
});
