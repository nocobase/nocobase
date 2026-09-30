import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { DatabaseManager } from '@nocobase/db';
import { createJobExecutorService } from '@nocobase/jobs';
import { createLogger } from '@nocobase/logging';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createNotificationManager } from '../server/manager.js';
import type {
  NotificationProviderSendInput,
  ProviderSendResult,
} from '../server/types.js';
import { FakeNotificationStore } from './helpers/fake-notification-store.js';

let storagePath: string;

beforeEach(async () => {
  storagePath = await mkdtemp(path.join(tmpdir(), 'notification-jobs-'));
});

afterEach(async () => {
  await rm(storagePath, { recursive: true, force: true });
});

function harness(
  send: (input: NotificationProviderSendInput) => Promise<ProviderSendResult>,
  close: () => Promise<void> = async () => undefined,
) {
  const service = createJobExecutorService(undefined, {
    appName: 'notification-test',
    storagePath,
  });
  const manager = createNotificationManager({
    database: {} as DatabaseManager,
    executor: service.getJobExecutor('@nocobase/app-plugin-notification'),
    logger: createLogger({ level: 'silent' }),
    config: { channels: { email: { provider: 'fake' } } },
    store: new FakeNotificationStore(),
  });
  manager.registry
    .registerChannel({
      type: 'email',
      async createChannel() {
        return {
          type: 'email',
          validateMessage(message: object) {
            return { message, recipients: [{ address: 'buyer@example.com' }] };
          },
          async prepare({ message }): Promise<object> {
            return message;
          },
        };
      },
    })
    .registerProvider({
      type: 'fake',
      messageType: 'email',
      async createProvider(_context, config) {
        return { type: config.provider, send, close };
      },
    });
  return {
    manager,
    async close(): Promise<void> {
      await manager.close();
      await service.shutdown();
    },
  };
}

it('delivers through the memory jobs backend after send() returns', async () => {
  const send = vi.fn(async () => ({ status: 'accepted' }) as const);
  const h = harness(send);
  try {
    const result = await h.manager.send({
      idempotencyKey: 'memory-jobs-1',
      messages: { email: { body: 'Hello' } },
    });

    await vi.waitFor(async () =>
      expect(
        await h.manager.getNotification(result.notificationId),
      ).toMatchObject({ status: 'completed', summary: { accepted: 1 } }),
    );
    expect(send).toHaveBeenCalledOnce();
  } finally {
    await h.close();
  }
});

it('lets a running Delivery finish before closing its Channel', async () => {
  let release!: () => void;
  const started = vi.fn();
  const send = vi.fn(async (): Promise<ProviderSendResult> => {
    started();
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return { status: 'accepted' };
  });
  const providerClose = vi.fn(async () => undefined);
  const h = harness(send, providerClose);
  const result = await h.manager.send({
    idempotencyKey: 'memory-jobs-2',
    messages: { email: { body: 'Hello' } },
  });
  await vi.waitFor(() => expect(started).toHaveBeenCalled());

  const closing = h.close();
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(providerClose).not.toHaveBeenCalled();
  release();
  await closing;
  expect(providerClose).toHaveBeenCalledOnce();

  await expect(
    h.manager.getNotification(result.notificationId),
  ).resolves.toMatchObject({ status: 'completed', summary: { accepted: 1 } });
});
