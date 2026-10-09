// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-agents',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];

describeMigration('202610090003_ag_add_runner_workspace_usage', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('agRunners').toHaveField('workspaceUsage', {
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRunners').not.toHaveField('workspaceUsage');
  },
});
