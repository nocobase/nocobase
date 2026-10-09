import { type DatabaseManager } from '@nocobase/db';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { createDatabaseMailStore } from '../../server/store.js';
import { DefaultMailService } from '../../server/service.js';
import type {
  MailStore,
  MailAccount,
  MailProviderAdapter,
  MailProviderAdapterResolver,
} from '../../server/types.js';
import {
  buildComposerInput,
  EMPTY_COMPOSER,
  replaceComposerSignature,
} from '../../client/lib/mail-composer-state.js';
import { htmlToPlainText } from '../../client/lib/mail-template.js';

describe('composer signature submission', () => {
  let database: DatabaseManager;
  let store: MailStore;
  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    await store.saveAccount(account());
    await store.replaceIdentities('account-1', [
      {
        id: 'identity-1',
        accountId: 'account-1',
        address: 'sender@example.com',
        isPrimary: true,
        canSend: true,
      },
    ]);
  });
  afterEach(async () => {
    await destroyMailTestDatabase(database);
  });
  it.each([false, true])(
    'sends the visible default signature exactly once after editing=%s',
    async (edited) => {
      const sendMessage = vi.fn<
        NonNullable<MailProviderAdapter['sendMessage']>
      >(async () => ({ status: 'accepted' }));
      const service = new DefaultMailService({
        store,
        adapters: resolver({ ...baseAdapter(), sendMessage }),
        outbox: { kick: vi.fn() },
      });
      const signature = await service.saveSignature(
        { actorId: 'user-1' },
        {
          accountId: 'account-1',
          name: 'Provider signature',
          isDefault: true,
          text: 'hello from gmail',
          html: '<div dir="ltr">hello from gmail</div>',
        },
      );
      const composer = replaceComposerSignature(
        {
          ...EMPTY_COMPOSER,
          to: 'reader@example.com',
          subject: 'Test',
        },
        [signature],
        signature.id,
      );
      const visible = edited
        ? { ...composer, text: htmlToPlainText(composer.html) }
        : composer;
      await service.sendMessage(
        { actorId: 'user-1' },
        {
          ...buildComposerInput(
            'account-1',
            'identity-1',
            signature.id,
            visible,
            [],
            [],
          ),
          idempotencyKey: 'visible-signature',
        },
      );
      const sent = sendMessage.mock.calls[0]![0].message;
      expect(sent.html).toBe(visible.html);
      expect(sent.text).toBe(visible.text);
      expect(sent.html?.match(/hello from gmail/gu)).toHaveLength(1);
      expect(sent.text.match(/hello from gmail/gu)).toHaveLength(1);
    },
  );
});

function account(): MailAccount {
  return {
    id: 'account-1',
    userId: 'user-1',
    provider: { type: 'test', name: 'test' },
    address: 'sender@example.com',
    credentialReference: 'secret:test',
    scopes: [],
    status: 'active',
    initialSyncReceivedAfter: '2026-09-01T00:00:00.000Z',
  };
}

function resolver(adapter: MailProviderAdapter): MailProviderAdapterResolver {
  return { resolve: async () => adapter };
}

function baseAdapter(): MailProviderAdapter {
  return {
    identity: { type: 'test', name: 'test' },
    capabilities: {
      receive: true,
      send: true,
      incrementalSync: true,
      pushNotifications: false,
      folders: false,
      labels: false,
      drafts: false,
      moveMessage: false,
      aliases: false,
    },
  };
}
