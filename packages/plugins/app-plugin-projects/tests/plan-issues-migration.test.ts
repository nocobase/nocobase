// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';

const require = createRequire(import.meta.url);
const migrationsOf = (name: string): MigrationSource => ({
  packageName: name,
  directory: path.join(
    path.dirname(require.resolve(`${name}/package.json`)),
    'database/migrations',
  ),
});

/** The plugin's migrations after those of the plugins it builds on, as an application loads them. */
const sources: readonly MigrationSource[] = [
  migrationsOf('@nocobase/app-plugin-authentication'),
  migrationsOf('@nocobase/app-plugin-authorization'),
  {
    packageName: '@nocobase/app-plugin-projects',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];

describeMigration('202610060001_pm_create_plan_issues', {
  sources,
  up: async ({ expectCollection }) => {
    const planIssues = expectCollection('pmPlanIssues');
    await planIssues.toHaveField('planId', { nullable: false });
    await planIssues.toHaveField('issueId', { nullable: false });
    await planIssues.toHaveIndex(['planId', 'issueId'], { unique: true });
    await planIssues.toHaveIndex(['issueId']);
    await planIssues.toHaveForeignKey(['planId'], 'pmPlans');
    await planIssues.toHaveForeignKey(['issueId'], 'pmIssues');
  },
  down: async ({ expectCollection }) => {
    await expectCollection('pmPlanIssues').not.toExist();
  },
});
