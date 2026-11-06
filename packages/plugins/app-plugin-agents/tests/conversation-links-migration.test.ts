import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202611010002_ag_create_conversation_links', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    const links = expectCollection('agConversationLinks');
    await links.toExist();
    for (const field of [
      'id',
      'conversationId',
      'kind',
      'targetId',
      'origin',
      'createdAt',
    ])
      await links.toHaveField(field, { nullable: false });
    await links.toHaveField('createdById', { nullable: true });
    await links.toHaveIndex(['conversationId', 'kind', 'targetId'], {
      unique: true,
    });
    await links.toHaveIndex(['kind', 'targetId']);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agConversationLinks').not.toExist();
  },
});
