import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610270001_ag_online_agent', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    await connection.repository('agConversations').createOne({
      values: {
        id: 'legacy-online',
        userId: 'alice',
        agentId: 'legacy-agent',
        mode: 'online',
        titleSource: 'auto',
        category: 'chat',
        source: 'chat',
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('agConversations').toHaveField('metadata', {
      type: 'json',
      nullable: true,
    });
    await expectCollection('agConversations').toHaveField('agentId', {
      type: 'string',
      nullable: false,
    });
    await expectCollection('agChatPreferences').toHaveField('onlineAgent', {
      type: 'json',
      nullable: true,
    });
    const values = {
      id: 'online-default',
      userId: 'alice',
      mode: 'online',
      titleSource: 'auto',
      category: 'chat',
      source: 'chat',
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Use Query so this verifies the database default, independently of Repository default insertion.
    await connection.query
      .insertInto('agConversations')
      .values(values)
      .execute();
    expect(
      await connection
        .repository('agConversations')
        .findOne({ filter: { id: values.id } }),
    ).toMatchObject({ agentId: '0' });
    await connection.query
      .deleteFrom('agConversations')
      .where('id', '=', values.id)
      .execute();
    const row = await connection
      .repository('agConversations')
      .findOne({ filter: { id: 'legacy-online' } });
    expect(row).toMatchObject({
      id: 'legacy-online',
      agentId: 'legacy-agent',
      metadata: null,
    });
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('agConversations').not.toHaveField('metadata');
    await expectCollection('agConversations').toHaveField('agentId', {
      type: 'string',
      nullable: false,
    });
    expect(
      (
        await connection
          .repository('agConversations')
          .findOne({ filter: { id: 'legacy-online' } })
      )?.agentId,
    ).toBe('legacy-agent');
  },
});
