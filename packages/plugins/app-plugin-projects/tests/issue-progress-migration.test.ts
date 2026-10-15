// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const require = createRequire(import.meta.url);
describeMigration('202610240011_pm_issue_progress', {
  sources: [
    ...[
      '@nocobase/app-plugin-authentication',
      '@nocobase/app-plugin-authorization',
    ].map((packageName) => ({
      packageName,
      directory: path.join(
        path.dirname(require.resolve(`${packageName}/package.json`)),
        'database/migrations',
      ),
    })),
    {
      packageName: '@nocobase/app-plugin-projects',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    const now = new Date().toISOString();
    await connection.repository('pmIssues').createOne({
      values: {
        id: 'historical',
        number: 1,
        identifier: 'PM-1',
        title: 'Historical decision',
        description: '',
        statusKey: 'blocked',
        ownerUserId: 'alice',
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('pmIssues').toHaveField('needsYou', {
      nullable: true,
    });
    await expectCollection('pmIssues').toHaveField('next', { nullable: true });
    expect(
      await connection
        .repository('pmIssues')
        .findOne({ filter: { id: 'historical' } }),
    ).toMatchObject({ statusKey: 'blocked', needsYou: null, next: null });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('pmIssues').not.toHaveField('needsYou');
    await expectCollection('pmIssues').not.toHaveField('next');
  },
});
