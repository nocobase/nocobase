import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610250001_ag_comment_runner_consent', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    for (const name of ['agRuns', 'agRunRequests']) {
      await expectCollection(name).toHaveIndex(['commentRootRunId', 'status']);
      await expectCollection(name).toHaveField('commentRootRunId', {
        nullable: true,
      });
      await expectCollection(name).toHaveField('commentOwnerKey', {
        nullable: true,
      });
    }
    await expectCollection('agRuns').toHaveField('commentExecution', {
      nullable: true,
    });
    await expectCollection('agRunRequests').toHaveField('purpose', {
      nullable: true,
    });
    await expectCollection('agRunRequests').toHaveField('commentRunId', {
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRuns').not.toHaveField('commentRootRunId');
    await expectCollection('agRunRequests').not.toHaveField('commentRootRunId');
  },
});
