import type { DatabaseManager } from '@nocobase/db';
import { createLogger } from '@nocobase/logging';
import { describe, expect, it, vi } from 'vitest';

import { createNotificationManager } from '../server/manager.js';
import { createNotificationRegistry } from '../server/registry.js';
import {
  notificationI18nText,
  type NotificationConfig,
} from '../server/types.js';
import { FakeNotificationStore } from './helpers/fake-notification-store.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';

describe('notification test sending', () => {
  it('describes only registered definitions backed by enabled configuration', () => {
    const registry = createNotificationRegistry();
    registry
      .registerChannel({
        type: 'email',
        test: {
          label: notificationI18nText('test.channels.email', 'Email'),
          fields: [
            {
              name: 'recipient',
              label: notificationI18nText('test.fields.recipient', 'Recipient'),
              type: 'email',
            },
          ],
          toSendInput() {
            return {
              to: 'safe@example.com',
              text: 'test',
            };
          },
        },
        async createChannel() {
          throw new Error('not used');
        },
      })
      .registerProvider({
        messageType: 'email',
        type: 'smtp',
        label: notificationI18nText('test.providers.smtp', 'SMTP'),
        async createProvider() {
          throw new Error('not used');
        },
      });

    const config = {
      channels: {
        email: {
          provider: 'smtp',
          host: 'private.example.com',
          password: 'secret',
          enabled: true,
        },
        'email-1': { provider: 'missing', enabled: true },
        'email-2': { provider: 'smtp', enabled: false },
      },
    } as unknown as NotificationConfig;
    expect(registry.testTargets(config)).toEqual([
      {
        channel: {
          name: 'email',
          type: 'email',
          label: 'email',
        },
        provider: {
          type: 'smtp',
          label: notificationI18nText('test.providers.smtp', 'SMTP'),
        },
        fields: [
          {
            name: 'recipient',
            label: notificationI18nText('test.fields.recipient', 'Recipient'),
            type: 'email',
          },
        ],
      },
    ]);
  });

  it('converts adapter values into the normal send interface', async () => {
    const manager = createNotificationManager({
      database: {} as DatabaseManager,
      executor: new InlineJobExecutor(),
      logger: createLogger({ level: 'silent' }),
      config: {
        channels: { email: { provider: 'smtp', enabled: true } },
      },
      store: new FakeNotificationStore(),
    });
    manager.registry
      .registerChannel({
        type: 'email',
        test: {
          label: notificationI18nText('test.channels.email', 'Email'),
          fields: [
            {
              name: 'recipient',
              label: notificationI18nText('test.fields.recipient', 'Recipient'),
              type: 'email',
              required: true,
            },
          ],
          toSendInput({ values }) {
            return {
              to: values.recipient,
              subject: 'Test',
              text: 'Hello',
            };
          },
        },
        async createChannel() {
          throw new Error('not used');
        },
      })
      .registerProvider({
        messageType: 'email',
        type: 'smtp',
        async createProvider() {
          throw new Error('not used');
        },
      });
    const send = vi.spyOn(manager, 'send').mockResolvedValue({
      notificationId: 'test-1',
      idempotencyKey: 'notification-test:test-1',
      deduplicated: false,
      status: 'pending',
      deliveries: [],
    });

    await manager.sendTest(
      {
        channel: 'email',
        values: { recipient: 'safe@example.com' },
      },
      { userId: 'user-1' },
    );

    expect(send).toHaveBeenCalledWith({
      idempotencyKey: expect.stringMatching(/^notification-test:/),
      messages: {
        email: { to: 'safe@example.com', subject: 'Test', text: 'Hello' },
      },
      source: { type: 'notification-test', referenceId: 'user-1' },
    });
    await manager.close();
  });

  it('returns test status only to the actor that created it', async () => {
    const store = new FakeNotificationStore();
    await store.create({
      log: {
        id: 'test-1',
        sourceType: 'notification-test',
        sourceReferenceId: 'user-1',
        messageSnapshot: {},
        status: 'completed',
        createdAt: '2026-08-31T00:00:00.000Z',
        updatedAt: '2026-08-31T00:00:00.000Z',
      },
      deliveries: [],
    });
    const manager = createNotificationManager({
      database: {} as DatabaseManager,
      executor: new InlineJobExecutor(),
      logger: createLogger({ level: 'silent' }),
      config: { channels: {} },
      store,
    });

    await expect(
      manager.getTestStatus('test-1', { userId: 'user-1' }),
    ).resolves.toEqual(
      expect.objectContaining({
        log: expect.objectContaining({ id: 'test-1' }),
      }),
    );
    await expect(
      manager.getTestStatus('test-1', { userId: 'user-2' }),
    ).resolves.toBeUndefined();
  });
});
