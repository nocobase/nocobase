import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610090001_ag_add_team_runner_variables', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agSecrets').toHaveField('teamRunnersOnly', {
      type: 'boolean',
      nullable: false,
    });
    await expectCollection('agRuns').toHaveField('teamOnlyVariables', {
      type: 'json',
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agSecrets').not.toHaveField('teamRunnersOnly');
    await expectCollection('agRuns').not.toHaveField('teamOnlyVariables');
  },
});
