import {
  userAdministrationServiceToken,
  type UserAdministrationService,
} from '@nocobase/app-plugin-authentication';
import type {
  NotificationChannelContext,
  NotificationProviderContext,
} from '@nocobase/app-plugin-notification';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';
import { inAppNotificationStoreToken } from '../server/tokens.js';

import {
  InAppChannel,
  createDatabaseProviderDefinition,
  createInAppChannelDefinition,
} from '../server/definition.js';
import { MemoryInAppStore } from '../server/store.js';

describe('In-app Channel common input', () => {
  it('checks recipients at final delivery and does not store or publish for missing users', async () => {
    const store = new MemoryInAppStore();
    const deliver = vi.spyOn(store, 'deliver');
    const recipientExists = vi.fn().mockResolvedValue(false);
    const provider = await createDatabaseProviderDefinition({
      store,
      recipientExists,
    }).createProvider(
      {
        logger: {} as NotificationProviderContext['logger'],
        now: async () => '2026-09-18T00:00:00.000Z',
      },
      { provider: 'in-app' },
    );
    const input = {
      notificationId: 'notification-1',
      deliveryId: 'delivery-1',
      attemptId: 'attempt-1',
      deadline: '2026-09-18T00:01:00.000Z',
      signal: new AbortController().signal,
      message: {
        deliveryId: 'delivery-1',
        notificationId: 'notification-1',
        recipient: { userId: 'missing' },
        content: { body: 'Test' },
      },
    };
    await expect(provider.send(input)).resolves.toMatchObject({
      status: 'failed',
      disposition: 'never',
      error: {
        code: 'IN_APP_NOTIFICATION_RECIPIENT_NOT_FOUND',
        category: 'recipient',
        message: 'In-app notification recipient does not exist.',
      },
    });
    expect(recipientExists).toHaveBeenCalledWith('missing');
    expect(deliver).not.toHaveBeenCalled();
    recipientExists.mockRejectedValueOnce(new Error('Database unavailable'));
    await expect(provider.send(input)).resolves.toMatchObject({
      status: 'failed',
      disposition: 'same_provider',
      error: { category: 'storage' },
    });
    expect(deliver).not.toHaveBeenCalled();
    recipientExists.mockResolvedValue(true);
    await expect(provider.send(input)).resolves.toEqual({ status: 'accepted' });
    expect(deliver).toHaveBeenCalledOnce();
    recipientExists.mockResolvedValue(false);
    await expect(
      provider.send({
        ...input,
        deliveryId: 'delivery-2',
        message: { ...input.message, deliveryId: 'delivery-2' },
      }),
    ).resolves.toMatchObject({ status: 'failed', disposition: 'never' });
    expect(deliver).toHaveBeenCalledOnce();
  });

  it('validates native IDs, complete content and targets before enqueueing', async () => {
    const channel = await createInAppChannelDefinition().createChannel(
      { logger: {} } as NotificationChannelContext,
      { provider: 'in-app' },
    );
    const message = {
      to: ['u1', 'u2'] as const,
      title: 'Approved',
      body: 'Review',
      target: { type: 'route', path: '/approvals/1' } as const,
    };
    expect(channel.validateMessage(message)).toMatchObject({
      message,
      recipients: [{ userId: 'u1' }, { userId: 'u2' }],
    });
    for (const to of [
      undefined,
      '',
      [],
      ['u1', ''],
      { type: 'user', id: 'u1' },
    ])
      expect(() => channel.validateMessage({ ...message, to })).toThrow();
    expect(() => channel.validateMessage({ ...message, title: '' })).toThrow();
    expect(
      channel.validateMessage({ ...message, actionUrl: '/ignored' }).message,
    ).not.toHaveProperty('actionUrl');
  });

  it('delivers through an explicitly injected store with the minimal Provider context', async () => {
    const store = new MemoryInAppStore();
    const provider = await createDatabaseProviderDefinition({
      store,
      recipientExists: async () => true,
    }).createProvider(
      {
        logger: {} as NotificationProviderContext['logger'],
        async now(): Promise<string> {
          return '2026-08-27T00:00:00.000Z';
        },
      },
      { provider: 'in-app' },
    );

    expect(provider.capabilities).toEqual({
      idempotency: { supported: true },
    });
    await expect(
      provider.send({
        notificationId: 'notification-1',
        deliveryId: 'delivery-1',
        attemptId: 'attempt-1',
        deadline: '2026-08-27T00:01:00.000Z',
        signal: new AbortController().signal,
        message: {
          deliveryId: 'delivery-1',
          notificationId: 'notification-1',
          recipient: { userId: 'user-1' },
          content: { body: 'Review it.' },
        },
      }),
    ).resolves.toEqual({ status: 'accepted' });
    await expect(store.list({ userId: 'user-1' })).resolves.toEqual([
      expect.objectContaining({
        deliveryId: 'delivery-1',
        createdAt: '2026-08-27T00:00:00.000Z',
      }),
    ]);
  });
});

it('resolves class dependencies through the container and stores one item per delivery', async () => {
  const store = new MemoryInAppStore();
  const users = { get: vi.fn().mockResolvedValue({ id: 'user' }) };
  const container = new ServiceContainer();
  container.instance(inAppNotificationStoreToken, store);
  container.instance(
    userAdministrationServiceToken,
    users as unknown as UserAdministrationService,
  );
  const channel = new InAppChannel({ channelName: 'inbox', container });
  const validated = channel.validateMessage({
    to: 'user',
    title: 'Notice',
    body: 'Hello',
  });
  const identity = {
    deliveryId: 'delivery',
    notificationId: 'notification',
    signal: new AbortController().signal,
  };
  const message = await channel.prepare({
    ...identity,
    message: validated.message,
    recipient: validated.recipients[0],
  });
  expect(await store.countUnread('user')).toBe(0);
  const input = {
    ...identity,
    message,
    attemptId: 'attempt',
    deadline: new Date(Date.now() + 10000).toISOString(),
  };
  expect(await channel.send(input)).toEqual({ status: 'accepted' });
  expect(await channel.send(input)).toEqual({ status: 'accepted' });
  expect(await store.countUnread('user')).toBe(1);
  expect(users.get).toHaveBeenCalledWith('user');
});
