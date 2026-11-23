import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202611210003_ag_chat_preference_effort', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agChatPreferences').toHaveField('effort', {
      type: 'string',
      nullable: true,
    });
    await expectCollection('agChatPreferences').toHaveField('defaultAgentId');
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agChatPreferences').not.toHaveField('effort');
    await expectCollection('agChatPreferences').toHaveField('runnerPreference');
  },
});
