import type { DatabaseManager } from '@nocobase/db';
import { createLogger } from '@nocobase/logging';
import { describe, expect, it, vi } from 'vitest';

import type {
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  NotificationContent,
} from '../server/channel-type.js';
import {
  createNotificationManager,
  NotificationKindNotFoundError,
  NotificationPreferenceError,
} from '../server/manager.js';
import type {
  NotificationPreferenceRecord,
  NotificationPreferenceStore,
} from '../server/preferences.js';
import { createNotificationRegistry } from '../server/registry.js';
import { NotificationTemplateRegistry } from '../server/templates.js';
import type { ProviderSendResult } from '../server/types.js';
import { FakeNotificationStore } from './helpers/fake-notification-store.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';

/** Addresses the fake email channel knows; `bob` has none. */
const ADDRESSES: Readonly<Record<string, string>> = {
  alice: 'alice@example.com',
  carol: 'carol@example.com',
};

class MemoryPreferenceStore implements NotificationPreferenceStore {
  readonly records: NotificationPreferenceRecord[] = [];
  readonly listForKind = vi.fn(
    async (kind: string, userIds: readonly string[]) =>
      this.records.filter(
        (record) => record.kind === kind && userIds.includes(record.userId),
      ),
  );
  async listForUser(userId: string) {
    return this.records.filter((record) => record.userId === userId);
  }
  async save(
    userId: string,
    items: readonly Omit<NotificationPreferenceRecord, 'userId'>[],
  ) {
    for (const item of items) {
      const index = this.records.findIndex(
        (record) =>
          record.userId === userId &&
          record.kind === item.kind &&
          record.channelType === item.channelType,
      );
      if (index >= 0) this.records.splice(index, 1);
      this.records.push({ userId, ...item });
    }
  }
}

function harness() {
  const sent = vi.fn(
    async (_type: string, _message: object): Promise<ProviderSendResult> => ({
      status: 'accepted',
    }),
  );
  const composed: { type: string; content: NotificationContent }[] = [];
  const registry = createNotificationRegistry();
  const reach = (
    type: string,
    find: (userId: string) => object | undefined,
  ) => {
    class UserChannel implements ChannelInstance {
      static readonly type = type;
      validateMessage(value: unknown) {
        const message = value as { to: object[]; title: string };
        return { message, recipients: message.to };
      }
      async prepare({ recipient, message }: ChannelPreparationInput) {
        return { ...message, recipient };
      }
      send({ message }: ChannelSendInput): Promise<ProviderSendResult> {
        return sent(type, message);
      }
      async resolveUsers(userIds: readonly string[]) {
        return new Map(
          userIds.flatMap((userId) => {
            const recipient = find(userId);
            return recipient ? [[userId, [recipient]] as const] : [];
          }),
        );
      }
      compose(content: NotificationContent, recipients: readonly object[]) {
        composed.push({ type, content });
        return { to: recipients, title: content.title };
      }
    }
    registry.registerChannelType(UserChannel);
  };
  reach('in-app', (userId) => ({ userId }));
  reach('email', (userId) =>
    ADDRESSES[userId] ? { address: ADDRESSES[userId] } : undefined,
  );
  reach('web-push', () => undefined);
  const kinds = new NotificationTemplateRegistry();
  kinds.register({
    id: 'approval.requested',
    contributor: '@example/approvals',
    category: 'Approvals',
    name: 'Approval requested',
    trigger: 'Someone asks for approval',
    recipients: 'Approvers',
    businessRule: 'Every request',
    locales: ['en-US', 'zh-CN'],
    languagePolicy: 'The application language',
    variables: [{ name: 'title', description: 'Request title' }],
    channels: { 'in-app': 'required', email: 'on', 'web-push': 'off' },
    content: ({ locale, data }) => ({
      title: `${locale}: ${String(data.title)}`,
      body: 'Please review.',
    }),
    sample: { title: 'Sample' },
  });
  const preferences = new MemoryPreferenceStore();
  const store = new FakeNotificationStore();
  const manager = createNotificationManager({
    database: {} as DatabaseManager,
    executor: new InlineJobExecutor(),
    store,
    registry,
    kinds,
    preferences,
    defaultLocale: () => 'zh-CN',
    logger: createLogger({ level: 'silent' }),
    config: {
      channels: {
        inbox: { type: 'in-app' },
        mail: { type: 'email' },
        push: { type: 'web-push' },
      },
    },
  });
  return { manager, sent, composed, preferences, store };
}

describe('notify()', () => {
  it('sends each person on the channels the kind and their preferences select, as one send', async () => {
    const h = harness();
    try {
      const result = await h.manager.notify('approval.requested', {
        to: ['alice', 'bob', 'alice'],
        data: { title: 'Budget' },
        target: { type: 'url', url: '/approvals/1' } as never,
        idempotencyKey: 'approval-1',
      });

      expect(result.send?.deliveries.map((d) => d.channelName).sort()).toEqual([
        'inbox',
        'inbox',
        'mail',
      ]);
      expect(result.skipped).toEqual(
        expect.arrayContaining([
          { userId: 'bob', channelType: 'email', reason: 'no_recipient' },
          { userId: 'alice', channelType: 'web-push', reason: 'preference' },
          { userId: 'bob', channelType: 'web-push', reason: 'preference' },
        ]),
      );
      // Rendered once in the application's default language, with the kind and its category.
      expect(h.composed[0]?.content).toMatchObject({
        kind: 'approval.requested',
        category: 'approvals',
        title: 'zh-CN: Budget',
        source: { type: '@example/approvals' },
      });
      const log = await h.store.getLog(result.send!.notificationId);
      expect(log?.kind).toBe('approval.requested');
      expect(
        (await h.store.listDeliveries(result.send!.notificationId))
          .map((delivery) => delivery.recipientKey)
          .sort(),
      ).toEqual(['alice', 'alice@example.com', 'bob']);
      // Preferences are read once for every recipient.
      expect(h.preferences.listForKind).toHaveBeenCalledTimes(1);
    } finally {
      await h.manager.close();
    }
  });

  it('honours a turned-off adjustable channel and never drops a required one', async () => {
    const h = harness();
    try {
      await h.manager.savePreferences('alice', [
        { kind: 'approval.requested', channelType: 'email', enabled: false },
      ]);
      await expect(
        h.manager.savePreferences('alice', [
          { kind: 'approval.requested', channelType: 'in-app', enabled: false },
        ]),
      ).rejects.toMatchObject({
        code: 'NOTIFICATION_PREFERENCE_REQUIRED',
        index: 0,
      });
      await expect(
        h.manager.savePreferences('alice', [
          { kind: 'approval.requested', channelType: 'sms', enabled: true },
        ]),
      ).rejects.toBeInstanceOf(NotificationPreferenceError);

      const result = await h.manager.notify('approval.requested', {
        to: ['alice'],
      });

      expect(result.send?.deliveries.map((d) => d.channelName)).toEqual([
        'inbox',
      ]);
      expect(result.skipped).toContainEqual({
        userId: 'alice',
        channelType: 'email',
        reason: 'preference',
      });
    } finally {
      await h.manager.close();
    }
  });

  it('returns the first send for a repeated idempotency key', async () => {
    const h = harness();
    try {
      const first = await h.manager.notify('approval.requested', {
        to: ['carol'],
        idempotencyKey: 'approval-2',
      });
      const second = await h.manager.notify('approval.requested', {
        to: ['carol'],
        idempotencyKey: 'approval-2',
      });
      expect(second.send).toMatchObject({
        notificationId: first.send!.notificationId,
        deduplicated: true,
      });
      expect(h.sent).toHaveBeenCalledTimes(2);
    } finally {
      await h.manager.close();
    }
  });

  it('refuses an unknown kind and lists preferences with defaults', async () => {
    const h = harness();
    try {
      await expect(
        h.manager.notify('missing.kind', { to: ['alice'] }),
      ).rejects.toBeInstanceOf(NotificationKindNotFoundError);
      await h.manager.savePreferences('alice', [
        { kind: 'approval.requested', channelType: 'web-push', enabled: true },
      ]);
      await expect(h.manager.preferencesFor('alice')).resolves.toEqual({
        channelTypes: ['in-app', 'email', 'web-push'],
        kinds: [
          expect.objectContaining({
            id: 'approval.requested',
            categoryKey: 'approvals',
            channels: [
              {
                type: 'in-app',
                policy: 'required',
                adjustable: false,
                enabled: true,
              },
              { type: 'email', policy: 'on', adjustable: true, enabled: true },
              {
                type: 'web-push',
                policy: 'off',
                adjustable: true,
                enabled: true,
              },
            ],
          }),
        ],
      });
    } finally {
      await h.manager.close();
    }
  });
});
