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

describeMigration('202610100001_ag_index_run_event_types', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('agRunEvents').toHaveIndex(['runId', 'type', 'seq']);
    await expectCollection('agRunEvents').toHaveIndex(['runId', 'seq'], {
      unique: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRunEvents').not.toHaveIndex([
      'runId',
      'type',
      'seq',
    ]);
    await expectCollection('agRunEvents').toHaveIndex(['runId', 'seq'], {
      unique: true,
    });
  },
});
