import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610090005_ag_add_run_git_credentials', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agRunners').toHaveField('workspaceUsage', {
      type: 'json',
      nullable: true,
    });
    await expectCollection('agRuns').toHaveField('executionHistory', {
      type: 'json',
      nullable: true,
    });
    await expectCollection('agRuns').toHaveField('gitCredentialUrls', {
      type: 'json',
      nullable: true,
    });
    await expectCollection('agRunRepos').toHaveField('failureReason', {
      type: 'string',
      nullable: true,
    });
    await expectCollection('agRunRepos').toHaveField('failureDetail', {
      type: 'text',
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRuns').not.toHaveField('gitCredentialUrls');
    await expectCollection('agRunRepos').not.toHaveField('failureReason');
    await expectCollection('agRunRepos').not.toHaveField('failureDetail');
    await expectCollection('agRunners').toHaveField('workspaceUsage', {
      type: 'json',
      nullable: true,
    });
    await expectCollection('agRuns').toHaveField('executionHistory', {
      type: 'json',
      nullable: true,
    });
    await expectCollection('agRunners').toHaveField('toolSlots', {
      type: 'json',
      nullable: true,
    });
  },
});
