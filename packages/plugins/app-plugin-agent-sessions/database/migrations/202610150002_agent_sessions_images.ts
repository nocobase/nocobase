import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * The images people send in messages, stored through the file plugin's repository as the projects plugin stores
 * attachments: its fixed file columns, and the session the image was sent in with the session's owner, who alone
 * reads it. The transcript names each image by its id.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610150002_agent_sessions_images',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.createCollection('agentSessionImages', (collection) => {
      collection.uuid('id').primary().notNull();
      collection.string('disk', { length: 255 }).notNull();
      collection.text('key').notNull();
      collection.text('filename').notNull();
      collection.string('ext', { length: 32 }).notNull();
      collection.string('mimeType', { length: 255 }).notNull();
      collection.bigInt('size').notNull();
      collection.string('sessionId', { length: 36 }).notNull();
      collection.string('userId', { length: 64 }).notNull();
      collection.datetimeTz('createdAt').notNull();
      collection.datetimeTz('updatedAt').notNull();
      collection.index(['sessionId'], {
        name: 'agent_session_images_session_idx',
      });
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.dropCollection('agentSessionImages');
  },
});

export default migration;
