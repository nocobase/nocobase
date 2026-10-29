import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202611070001_ag_conversation_project', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    await connection.repository('agConversations').createOne({
      values: {
        id: 'old',
        userId: 'alice',
        agentId: 'agent',
        mode: 'runner',
        titleSource: 'auto',
        category: 'chat',
        source: 'panel',
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('agConversations').toHaveField('projectId', {
      type: 'string',
      nullable: true,
    });
    expect(
      await connection
        .repository('agConversations')
        .findOne({ filter: { id: 'old' } }),
    ).toMatchObject({ projectId: null });
    await connection
      .repository('agConversations')
      .updateMany({ filter: { id: 'old' }, values: { projectId: 'project' } });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agConversations').not.toHaveField('projectId');
  },
});
