import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const legacy = {
  id: 'legacy-chat',
  userId: 'alice',
  agentId: '0',
  mode: 'online',
  titleSource: 'auto',
  category: 'chat',
  source: 'panel',
  lastMessageAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};
describeMigration('202610270002_ag_chat_list_visibility', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  before: async ({ connection }) => {
    await connection
      .repository('agConversations')
      .createOne({ values: legacy });
  },
  up: async ({ connection, expectCollection }) => {
    const field = (
      await connection.collections.get('agConversations')
    )?.fields.find((item) => item.name === 'showInChatList');
    expect(field).toMatchObject({ type: 'boolean', nullable: false });
    // Metadata preserves the dialect's SQL default literal (for example 1 or true).
    expect(['1', 'true']).toContain(
      String(field?.defaultValue).replace(/[()']/gu, '').toLowerCase(),
    );
    await expectCollection('agConversations').toHaveField('showInChatList', {
      type: 'boolean',
      nullable: false,
    });
    expect(
      await connection
        .repository('agConversations')
        .findOne({ filter: { id: legacy.id } }),
    ).toMatchObject({ showInChatList: true, category: 'chat' });
    // Query verifies the physical default independently from Repository defaults.
    await connection.query
      .insertInto('agConversations')
      .values({ ...legacy, id: 'default-visible' })
      .execute();
    expect(
      await connection
        .repository('agConversations')
        .findOne({ filter: { id: 'default-visible' } }),
    ).toMatchObject({ showInChatList: true });
    await connection.repository('agConversations').updateMany({
      filter: { id: 'default-visible' },
      values: { showInChatList: false },
    });
    expect(
      await connection
        .repository('agConversations')
        .findOne({ filter: { id: 'default-visible' } }),
    ).toMatchObject({ showInChatList: false });
    await connection.query
      .deleteFrom('agConversations')
      .where('id', '=', 'default-visible')
      .execute();
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('agConversations').not.toHaveField('showInChatList');
    expect(
      await connection
        .repository('agConversations')
        .findOne({ filter: { id: legacy.id } }),
    ).toMatchObject({ category: 'chat', userId: 'alice' });
  },
});
