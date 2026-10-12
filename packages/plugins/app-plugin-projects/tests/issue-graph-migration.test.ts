// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const require = createRequire(import.meta.url);

describeMigration('202610110001_pm_issue_graph_revision', {
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
    await connection.repository('pmSettings').createOne({
      values: {
        id: 'default',
        issuePrefix: 'PM',
        issueCounter: 42,
        values: { retained: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('pmIssueGraph').toHaveField('revision', {
      nullable: false,
    });
    expect(
      await connection
        .repository('pmSettings')
        .findOne({ filter: { id: 'default' } }),
    ).toMatchObject({
      issueCounter: 42,
      values: { retained: true },
    });
    expect(await connection.repository('pmIssueGraph').findMany()).toEqual([
      { id: 'default', revision: 0 },
    ]);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('pmIssueGraph').not.toExist();
  },
});
