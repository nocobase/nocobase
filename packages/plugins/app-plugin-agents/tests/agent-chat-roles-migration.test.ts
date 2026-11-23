import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202611210002_ag_agent_chat_roles', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('agAgents').toHaveField('chatRoles', {
      type: 'json',
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agAgents').not.toHaveField('chatRoles');
  },
});
