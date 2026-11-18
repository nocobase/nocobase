import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202611090001_ag_runner_preference', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    for (const name of ['agChatPreferences', 'agRuns'])
      await expectCollection(name).toHaveField('runnerPreference', {
        type: 'string',
        nullable: true,
      });
  },
  down: async ({ expectCollection }) => {
    for (const name of ['agChatPreferences', 'agRuns'])
      await expectCollection(name).not.toHaveField('runnerPreference');
  },
});
