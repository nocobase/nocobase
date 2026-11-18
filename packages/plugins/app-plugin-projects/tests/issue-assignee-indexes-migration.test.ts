// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';
import { expect } from 'vitest';
import { describeMigration } from '@nocobase/app-testing/server';

const require = createRequire(import.meta.url);
describeMigration('202611110001_pm_issue_assignee_indexes', {
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
  before: async ({ expectCollection }) => {
    await expectCollection('pmIssues').toHaveIndex(['ownerUserId']);
    await expectCollection('pmIssues').not.toHaveIndex([
      'executorType',
      'executorId',
    ]);
  },
  up: async ({ expectCollection }) => {
    await expectCollection('pmIssues').toHaveIndex(['ownerUserId']);
    await expectCollection('pmIssues').toHaveIndex([
      'executorType',
      'executorId',
    ]);
    const schema = await expectCollection('pmIssues').toExist();
    expect(
      schema.indexes.filter(
        (index) =>
          index.fields.length === 1 && index.fields[0] === 'ownerUserId',
      ),
    ).toHaveLength(1);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('pmIssues').toHaveIndex(['ownerUserId']);
    await expectCollection('pmIssues').not.toHaveIndex([
      'executorType',
      'executorId',
    ]);
  },
});
