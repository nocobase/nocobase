import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610110002_ag_add_work_controls', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agSubjectControls').toHaveField('lockAt', {
      type: 'datetimeTz',
      nullable: false,
    });
    await expectCollection('agSubjectControls').toHaveIndex(
      ['subjectKind', 'subjectId'],
      { unique: true },
    );
    await expectCollection('agRuns').toHaveField('gitCredentialUrls', {
      type: 'json',
      nullable: true,
    });
    // Applies after the fresh-session columns of the same day and leaves them in place.
    await expectCollection('agRuns').toHaveField('freshSession', {
      type: 'boolean',
      nullable: false,
    });
    await expectCollection('agRuns').toHaveField('requestedTool', {
      type: 'string',
      nullable: true,
    });
    await expectCollection('agRuns').toHaveField('executionHistory', {
      type: 'json',
      nullable: true,
    });
    await expectCollection('agRunRequests').toHaveField('tool', {
      type: 'string',
      nullable: true,
    });
    await expectCollection('agSubjectControls').toHaveField('pausedByUserId', {
      type: 'string',
      nullable: true,
    });
    await expectCollection('agSubjectControls').toHaveField('pausedAt', {
      type: 'datetimeTz',
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRuns').not.toHaveField('requestedTool');
    await expectCollection('agRuns').toHaveField('executionHistory', {
      type: 'json',
      nullable: true,
    });
    await expectCollection('agRunRequests').not.toHaveField('tool');
    await expectCollection('agSubjectControls').not.toExist();
  },
});
