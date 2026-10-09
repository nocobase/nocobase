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

describeMigration('202610080001_ag_add_runner_tool_slots', {
  sources,
  up: async ({ expectCollection }) => {
    const runners = expectCollection('agRunners');
    await runners.toHaveField('toolSlots', { nullable: true });
    await runners.toHaveField('load', { nullable: true });
    await expectCollection('agRegistrationTokens').toHaveField('toolSlots', {
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agRunners').not.toHaveField('toolSlots');
    await expectCollection('agRunners').not.toHaveField('load');
    await expectCollection('agRegistrationTokens').not.toHaveField('toolSlots');
  },
});
