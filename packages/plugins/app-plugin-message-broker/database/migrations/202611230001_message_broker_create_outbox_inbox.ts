import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * The message broker's outbox and inbox.
 *
 * - `messageBrokerOutbox`: one row per message published inside a business transaction, written in that
 *   transaction and sent by the relay after it commits. Times are epoch milliseconds so that the relay compares
 *   plain integers on every dialect. `sentAt` stays null until the middleware confirmed the message; sent rows are
 *   kept for the configured retention so that an operator can check what went out.
 * - `messageBrokerInbox`: one row per message a subscription with the inbox processed, keyed by
 *   `(subscription, messageId)`, written in the handler's transaction; the key is the deduplication.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611230001_message_broker_create_outbox_inbox',

  async up({ builder }) {
    await builder.createCollection('messageBrokerOutbox', (collection) => {
      collection.bigInt('id').notNull();
      collection.string('publisher', { length: 255 }).notNull();
      collection.string('messageId', { length: 255 }).notNull();
      collection.blob('body').notNull();
      collection.string('contentType', { length: 255 }).nullable();
      collection.json('headers').notNull();
      collection.string('key', { length: 255 }).nullable();
      collection.string('correlationId', { length: 255 }).nullable();
      collection.string('replyTo', { length: 255 }).nullable();
      collection.string('type', { length: 255 }).nullable();
      collection.bigInt('timestamp').notNull();
      collection.integer('attempts').notNull().defaultTo(0);
      collection.bigInt('nextAttemptAt').notNull();
      collection.text('lastError').nullable();
      collection.bigInt('sentAt').nullable();
      collection.primary('id', { name: 'pk_message_broker_outbox' });
      // The relay reads `sentAt IS NULL AND nextAttemptAt <= now`, the cleanup `sentAt < cutoff`.
      collection.index(['sentAt', 'nextAttemptAt'], {
        name: 'idx_message_broker_outbox_pending',
      });
    });
    await builder.createCollection('messageBrokerInbox', (collection) => {
      collection.string('subscription', { length: 255 }).notNull();
      collection.string('messageId', { length: 255 }).notNull();
      collection.bigInt('processedAt').notNull();
      collection.primary(['subscription', 'messageId'], {
        name: 'pk_message_broker_inbox',
      });
      collection.index(['processedAt'], {
        name: 'idx_message_broker_inbox_processed',
      });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('messageBrokerInbox');
    await builder.dropCollection('messageBrokerOutbox');
  },
});

export default migration;
