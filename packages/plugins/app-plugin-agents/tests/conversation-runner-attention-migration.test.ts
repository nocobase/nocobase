import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const legacy = {
  id: 'legacy-chat',
  userId: 'alice',
  agentId: 'agent-1',
  mode: 'runner',
  titleSource: 'auto',
  category: 'chat',
  source: 'panel',
  lastSeq: 3,
  lastMessageAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};
const added = [
  'runnerId',
  'needsYou',
  'needsYouSeq',
  'needsYouText',
  'noticedSeq',
] as const;

describeMigration('202611010001_ag_conversation_runner_attention', {
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
    const conversations = expectCollection('agConversations');
    await conversations.toHaveField('seenSeq', {
      type: 'integer',
      nullable: false,
    });
    for (const field of added)
      await conversations.toHaveField(field, { nullable: true });
    // Existing conversations are bound to no runner and wait for nobody.
    expect(
      await connection
        .repository('agConversations')
        .findOne({ filter: { id: legacy.id } }),
    ).toMatchObject({
      seenSeq: 0,
      runnerId: null,
      needsYou: null,
      lastSeq: 3,
    });
  },
  down: async ({ connection, expectCollection }) => {
    const conversations = expectCollection('agConversations');
    for (const field of [...added, 'seenSeq'])
      await conversations.not.toHaveField(field);
    expect(
      await connection
        .repository('agConversations')
        .findOne({ filter: { id: legacy.id } }),
    ).toMatchObject({ userId: 'alice', lastSeq: 3 });
  },
});
