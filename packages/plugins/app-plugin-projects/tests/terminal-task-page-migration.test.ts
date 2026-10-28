// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

const require = createRequire(import.meta.url);
describeMigration('202610280001_pm_terminal_task_page', {
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
  up: async ({ expectCollection }) => {
    await expectCollection('pmIssues').toHaveIndex([
      'statusKey',
      'deletedAt',
      'updatedAt',
      'id',
    ]);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('pmIssues').not.toHaveIndex([
      'statusKey',
      'deletedAt',
      'updatedAt',
      'id',
    ]);
  },
});
