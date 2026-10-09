import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610090002_ag_add_runner_variables', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agRunnerVariables').toExist();
    await expectCollection('agRunnerVariables').toHaveField('name', {
      nullable: false,
    });
    await expectCollection('agRunnerVariables').toHaveIndex(
      ['scope', 'scopeId', 'name'],
      { unique: true },
    );
    await expectCollection('agRunners').toHaveField('variables', {
      type: 'json',
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRunnerVariables').not.toExist();
    await expectCollection('agRunners').not.toHaveField('variables');
  },
});
