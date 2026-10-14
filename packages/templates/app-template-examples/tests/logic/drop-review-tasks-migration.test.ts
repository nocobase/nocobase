// @vitest-environment node
import path from 'node:path';
import type { MigrationSource } from '@nocobase/db';
import { describeMigration } from '@nocobase/app-testing/server';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'drop-review-tasks-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

// Both tables are created by earlier migrations of this application and are now unused.
describeMigration('202610100001_drop_review_tasks_and_daily_reports', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('quotationReviewTasks').not.toExist();
    await expectCollection('exampleDailyReports').not.toExist();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('exampleDailyReports').toHaveField('profitCents', {
      nullable: false,
    });
    await expectCollection('quotationReviewTasks').toHaveField(
      'resumeRequestId',
      { nullable: true },
    );
    await expectCollection('quotationReviewTasks').toHaveIndex(['runId'], {
      unique: true,
    });
  },
});
