// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';

const require = createRequire(import.meta.url);
const sources: MigrationSource[] = [
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
    directory: path.resolve(import.meta.dirname, '../../database/migrations'),
  },
];

describeMigration('202610090001_pm_add_executor_tool', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('pmIssues').toHaveField('executorTool', {
      nullable: true,
    });
    await expectCollection('pmIssues').toHaveField('executorToolSource', {
      nullable: true,
    });
    await expectCollection('pmIssues').toHaveField('executorId');
  },
  down: async ({ expectCollection }) => {
    await expectCollection('pmIssues').not.toHaveField('executorTool');
    await expectCollection('pmIssues').not.toHaveField('executorToolSource');
    await expectCollection('pmIssues').toHaveField('executorId');
  },
});
