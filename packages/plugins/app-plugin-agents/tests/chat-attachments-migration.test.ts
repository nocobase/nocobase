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

describeMigration('202610070001_ag_create_chat_attachments', {
  sources,
  up: async ({ expectCollection }) => {
    const files = expectCollection('agChatAttachments');
    await files.toExist();
    for (const field of [
      'id',
      'disk',
      'key',
      'filename',
      'ext',
      'mimeType',
      'size',
      'uploaderId',
      'createdAt',
      'updatedAt',
    ])
      await files.toHaveField(field, { nullable: false });
    await files.toHaveField('conversationId', { nullable: true });
    await files.toHaveField('messageId', { nullable: true });
    await files.toHaveIndex(['conversationId', 'messageId']);
    await files.toHaveIndex(['uploaderId', 'createdAt']);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agChatAttachments').not.toExist();
  },
});
