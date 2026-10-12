import { resolve } from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { describe, expect } from 'vitest';

// Keep structural portability separate from source JSON size limits in historical-data fixtures.
describe('participant portable structure', () => {
  describeMigration('202610090001_mail_create_message_participants', {
    sources: [
      {
        directory: resolve(import.meta.dirname, '../../database/migrations'),
        packageName: '@nocobase/app-plugin-mail',
      },
    ],
    up: async ({ expectCollection }) => {
      const collection = expectCollection('mailMessageParticipants');
      const schema = await collection.toExist();
      expect(schema.primaryKey).toEqual(['messageId', 'role', 'address']);
      await collection.toHaveField('messageId', {
        type: 'uuid',
        nullable: false,
      });
      await collection.toHaveField('accountId', {
        type: 'uuid',
        nullable: false,
      });
      await collection.toHaveField('role', {
        type: 'string',
        length: 4,
        nullable: false,
      });
      await collection.toHaveField('address', {
        type: 'string',
        length: 320,
        nullable: false,
      });
      await collection.toHaveField('domain', {
        type: 'string',
        length: 253,
        nullable: false,
      });
      await collection.toHaveIndex(['accountId', 'address', 'messageId']);
      await collection.toHaveIndex(['accountId', 'domain', 'messageId']);
      await collection.toHaveForeignKey(['messageId'], 'mailMessages', {
        referencedFields: ['id'],
        onDelete: 'cascade',
      });
      expect(schema.foreignKeys).toHaveLength(1);
    },
  });
});
