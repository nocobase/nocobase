import { defineCollection, CollectionOptions } from '@nocobase/database';

export default defineCollection({
  migrationRules: ['schema-only'],
  autoGenId: false,
  name: 'aiToolMessages',
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      primaryKey: true,
    },
    {
      name: 'sessionId',
      type: 'uuid',
    },
    {
      name: 'messageId',
      type: 'bigInt',
    },
    {
      name: 'toolCallId',
      type: 'string',
      index: { unique: true },
    },
    {
      name: 'toolName',
      type: 'string',
    },
    {
      name: 'status',
      type: 'string',
      allowNull: true,
    },
    {
      name: 'content',
      type: 'jsonb',
      allowNull: true,
    },
    {
      name: 'invokeStatus',
      type: 'string',
    },
    {
      name: 'invokeStartTime',
      type: 'unixTimestamp',
      accuracy: 'millisecond',
      allowNull: true,
    },
    {
      name: 'invokeEndTime',
      type: 'unixTimestamp',
      accuracy: 'millisecond',
      allowNull: true,
    },
    {
      name: 'auto',
      type: 'boolean',
    },
    {
      name: 'execution',
      type: 'string',
      allowNull: true,
    },
  ],
});
