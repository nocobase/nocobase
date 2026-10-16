// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const require = createRequire(import.meta.url);
describeMigration('202610240012_pm_issue_acceptance', {
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
        id: 'in-review',
        number: 1,
        identifier: 'PM-1',
        title: 'Delivered before acceptance lists',
        description: '',
        statusKey: 'in_review',
        ownerUserId: 'alice',
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('pmIssues').toHaveField('acceptance', {
      nullable: true,
    });
    expect(
      await connection
        .repository('pmIssues')
        .findOne({ filter: { id: 'in-review' } }),
    ).toMatchObject({ statusKey: 'in_review', acceptance: null });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('pmIssues').not.toHaveField('acceptance');
  },
});
