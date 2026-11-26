import { fileURLToPath } from 'node:url';

import { describeMigration } from '@nocobase/app-testing/server';

import packageMetadata from '../../package.json' with { type: 'json' };

describeMigration('202611230001_message_broker_create_outbox_inbox', {
  sources: [
    {
      packageName: packageMetadata.name,
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    const outbox = expectCollection('messageBrokerOutbox');
    await outbox.toHaveField('id', { type: 'bigInt', nullable: false });
    await outbox.toHaveField('publisher', {
      type: 'string',
      nullable: false,
      length: 255,
    });
    await outbox.toHaveField('body', { type: 'blob', nullable: false });
    await outbox.toHaveField('headers', { type: 'json', nullable: false });
    await outbox.toHaveField('attempts', { type: 'integer', nullable: false });
    await outbox.toHaveField('nextAttemptAt', {
      type: 'bigInt',
      nullable: false,
    });
    await outbox.toHaveField('sentAt', { type: 'bigInt', nullable: true });
    await outbox.toHaveField('lastError', { type: 'text', nullable: true });
    await outbox.toHaveIndex(['sentAt', 'nextAttemptAt']);
    const inbox = expectCollection('messageBrokerInbox');
    await inbox.toHaveField('subscription', {
      type: 'string',
      nullable: false,
      length: 255,
    });
    await inbox.toHaveField('processedAt', { type: 'bigInt', nullable: false });
    await inbox.toHaveIndex(['processedAt']);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('messageBrokerOutbox').not.toExist();
    await expectCollection('messageBrokerInbox').not.toExist();
  },
});
