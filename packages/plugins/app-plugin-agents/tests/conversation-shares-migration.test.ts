import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202611080001_ag_conversation_shares', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    const shares = expectCollection('agConversationShares');
    await shares.toExist();
    for (const field of [
      'id',
      'conversationId',
      'userId',
      'cutoffSeq',
      'snapshotAt',
      'createdAt',
      'updatedAt',
    ])
      await shares.toHaveField(field, { nullable: false });
    await shares.toHaveField('title', { nullable: true });
    await shares.toHaveIndex(['conversationId', 'userId'], { unique: true });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agConversationShares').not.toExist();
  },
});
