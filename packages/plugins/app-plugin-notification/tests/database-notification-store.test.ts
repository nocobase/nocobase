// @vitest-environment node

import type { DatabaseManager } from '@nocobase/db';
import { type TestDatabase } from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DatabaseNotificationStore,
  type NotificationAttemptRecord,
  type NotificationDeliveryRecord,
  type NotificationLogBundle,
} from '../server/store.js';
import { createNotificationTestDatabase } from './helpers/database.js';

describe('DatabaseNotificationStore', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let store: DatabaseNotificationStore;

  beforeEach(async () => {
    testDatabase = await createNotificationTestDatabase();
    database = testDatabase.database;
    store = new DatabaseNotificationStore(database);
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('persists a delivery lifecycle and rejects stale state transitions', async () => {
    const bundle = createBundle();
    await store.create(bundle);

    await expect(
      store.listReady('2026-08-24T00:00:00.000Z'),
    ).resolves.toMatchObject([
      {
        id: 'delivery-1',
        status: 'pending',
      },
    ]);

    const claimed = await store.claimDelivery(
      'delivery-1',
      'lease-1',
      '2026-08-24T00:01:00.000Z',
    );
    expect(claimed).toMatchObject({
      status: 'preparing',
      leaseToken: 'lease-1',
    });
    await expect(
      store.claimDelivery('delivery-1', 'lease-2', '2026-08-24T00:02:00.000Z'),
    ).resolves.toBeUndefined();

    const attempt = createAttempt();
    const started = await store.startAttempt(
      {
        ...claimed!,
        providerIdempotency: {
          startedAt: '2026-08-24T00:00:01.000Z',
          expiresAt: '2026-08-25T00:00:01.000Z',
        },
      },
      attempt,
      '2026-08-24T00:01:00.000Z',
    );
    expect(started?.providerIdempotency).toEqual({
      startedAt: '2026-08-24T00:00:01.000Z',
      expiresAt: '2026-08-25T00:00:01.000Z',
    });
    expect(started).toMatchObject({ attemptCount: 1 });
    await expect(
      store.startAttempt(
        claimed!,
        { ...attempt, id: 'attempt-stale' },
        '2026-08-24T00:01:00.000Z',
      ),
    ).resolves.toBeUndefined();

    const finishedAttempt: NotificationAttemptRecord = {
      ...attempt,
      status: 'accepted',
      finishedAt: '2026-08-24T00:00:02.000Z',
      providerMessageId: 'provider-message-1',
    };
    const finished = await store.finishAttemptAndDelivery(
      finishedAttempt,
      started!,
      'accepted',
    );
    expect(finished).toMatchObject({
      status: 'accepted',
      leaseToken: undefined,
      leaseExpiresAt: undefined,
    });
    await expect(store.getLog('notification-1')).resolves.toMatchObject({
      status: 'completed',
      messageSnapshot: { email: { subject: 'Hello' } },
    });
  });

  it('returns an expired preparation lease to pending', async () => {
    await store.create(createBundle());
    await store.claimDelivery(
      'delivery-1',
      'expired-lease',
      '2026-08-24T00:01:00.000Z',
    );

    await expect(
      store.recoverExpired('2026-08-24T00:02:00.000Z'),
    ).resolves.toMatchObject([{ id: 'delivery-1', status: 'pending' }]);
    await expect(store.getDelivery('delivery-1')).resolves.toMatchObject({
      status: 'pending',
    });
    await expect(store.getLog('notification-1')).resolves.toMatchObject({
      status: 'pending',
    });
  });

  it('does not claim a retry before nextRunAt', async () => {
    await store.create(createBundle());
    const claimed = await store.claimDelivery(
      'delivery-1',
      'lease-1',
      '2026-08-25T00:01:00.000Z',
    );
    const attempt = createAttempt();
    const started = await store.startAttempt(
      claimed!,
      attempt,
      '2026-08-25T00:01:00.000Z',
    );
    await store.finishAttemptAndDelivery(
      {
        ...attempt,
        status: 'failed',
        finishedAt: '2026-08-25T00:00:01.000Z',
        error: { message: 'retry later' },
      },
      started!,
      'failed',
      { message: 'retry later' },
      '2099-01-01T00:00:00.000Z',
    );

    await expect(
      store.claimDelivery('delivery-1', 'lease-2', '2026-08-25T00:02:00.000Z'),
    ).resolves.toBeUndefined();
  });

  it('derives notification status from current Delivery states', async () => {
    const bundle = createBundle();
    await store.create({
      ...bundle,
      deliveries: [
        ...bundle.deliveries,
        { ...bundle.deliveries[0]!, id: 'delivery-2' },
      ],
    });
    const first = await store.claimDelivery(
      'delivery-1',
      'lease-1',
      '2026-08-25T00:01:00.000Z',
    );
    const firstAttempt = createAttempt();
    const firstStarted = await store.startAttempt(
      first!,
      firstAttempt,
      '2026-08-25T00:01:00.000Z',
    );
    await store.finishAttemptAndDelivery(
      {
        ...firstAttempt,
        status: 'accepted',
        finishedAt: '2026-08-25T00:00:01.000Z',
      },
      firstStarted!,
      'accepted',
    );
    await expect(store.getLog('notification-1')).resolves.toMatchObject({
      status: 'processing',
    });

    const second = await store.claimDelivery(
      'delivery-2',
      'lease-2',
      '2026-08-25T00:01:00.000Z',
    );
    const secondAttempt = {
      ...createAttempt(),
      id: 'attempt-2',
      deliveryId: 'delivery-2',
    };
    const secondStarted = await store.startAttempt(
      second!,
      secondAttempt,
      '2026-08-25T00:01:00.000Z',
    );
    await store.finishAttemptAndDelivery(
      {
        ...secondAttempt,
        status: 'accepted',
        finishedAt: '2026-08-25T00:00:02.000Z',
      },
      secondStarted!,
      'accepted',
    );
    await expect(store.getLog('notification-1')).resolves.toMatchObject({
      status: 'completed',
    });
  });

  it('marks an expired Provider submission lease as unknown', async () => {
    await store.create(createBundle());
    const claimed = await store.claimDelivery(
      'delivery-1',
      'expired-submission',
      '2026-08-24T00:01:00.000Z',
    );
    await store.startAttempt(
      claimed!,
      createAttempt(),
      '2026-08-24T00:01:00.000Z',
    );

    await expect(
      store.recoverExpired('2026-08-24T00:02:00.000Z'),
    ).resolves.toMatchObject([{ id: 'delivery-1', status: 'unknown' }]);
    await expect(store.getDelivery('delivery-1')).resolves.toMatchObject({
      status: 'unknown',
      lastError: { code: 'LEASE_EXPIRED' },
    });
    await expect(store.listAttempts('delivery-1')).resolves.toMatchObject([
      {
        id: 'attempt-1',
        status: 'unknown',
        finishedAt: '2026-08-24T00:02:00.000Z',
        error: { code: 'LEASE_EXPIRED' },
      },
    ]);
    await expect(
      store.finishAttemptAndDelivery(
        {
          ...createAttempt(),
          status: 'accepted',
          finishedAt: '2026-08-24T00:03:00.000Z',
        },
        (await store.getDelivery('delivery-1'))!,
        'accepted',
      ),
    ).resolves.toBeUndefined();
    await expect(store.listAttempts('delivery-1')).resolves.toMatchObject([
      { status: 'unknown' },
    ]);
  });

  it('atomically returns the original notification for the same idempotency key', async () => {
    const first = withIdempotency(createBundle(), 'won:42:user-7', 'v1:same');
    const repeated = withIdempotency(
      {
        ...createBundle(),
        log: { ...createBundle().log, id: 'notification-2' },
        deliveries: [
          {
            ...createBundle().deliveries[0]!,
            id: 'delivery-2',
            notificationId: 'notification-2',
          },
        ],
      },
      'won:42:user-7',
      'v1:same',
    );

    const results = await Promise.all([
      store.createOrGetByIdempotency(first),
      store.createOrGetByIdempotency(repeated),
    ]);
    expect(results.map((result) => result.outcome).sort()).toEqual([
      'created',
      'existing',
    ]);
    expect(results[0]?.bundle.log.id).toBe(results[1]?.bundle.log.id);
    const notificationId = results[0]!.bundle.log.id;
    await expect(
      store.getLogByIdempotencyKey('won:42:user-7'),
    ).resolves.toMatchObject({ id: notificationId });
    const unusedNotificationId =
      notificationId === 'notification-1' ? 'notification-2' : 'notification-1';
    await expect(store.listDeliveries(unusedNotificationId)).resolves.toEqual(
      [],
    );
  });

  it('reports an idempotency conflict for a different fingerprint', async () => {
    await store.createOrGetByIdempotency(
      withIdempotency(createBundle(), 'won:42:user-7', 'v1:first'),
    );

    await expect(
      store.createOrGetByIdempotency(
        withIdempotency(createBundle(), 'won:42:user-7', 'v1:different'),
      ),
    ).resolves.toMatchObject({ outcome: 'conflict' });
  });

  it('moves a terminal failed Delivery to retrying with an auditable retry resolution', async () => {
    await store.create(createBundle());
    const claimed = await store.claimDelivery(
      'delivery-1',
      'lease-1',
      '2026-08-24T00:01:00.000Z',
    );
    const attempt = createAttempt();
    const started = await store.startAttempt(
      {
        ...claimed!,
        providerIdempotency: {
          startedAt: '2026-08-24T00:00:01.000Z',
          expiresAt: '2026-08-25T00:00:01.000Z',
        },
      },
      attempt,
      '2026-08-24T00:01:00.000Z',
    );
    await store.finishAttemptAndDelivery(
      {
        ...attempt,
        status: 'failed',
        finishedAt: '2026-08-24T00:00:02.000Z',
      },
      started!,
      'failed',
      { message: 'response lost' },
    );

    const resolution = {
      type: 'terminal_failure' as const,
      reason: 'Provider has recovered.',
      requestedAt: '2026-08-24T00:03:00.000Z',
    };
    await expect(
      store.retryDelivery('delivery-1', resolution),
    ).resolves.toMatchObject({
      status: 'retrying',
      retryResolution: { type: 'terminal_failure' },
      lastError: undefined,
      providerIdempotency: undefined,
    });
    await expect(store.listRetryAudits('delivery-1')).resolves.toMatchObject([
      {
        deliveryId: 'delivery-1',
        resolution,
        providerIdempotency: {
          startedAt: '2026-08-24T00:00:01.000Z',
          expiresAt: '2026-08-25T00:00:01.000Z',
        },
      },
    ]);

    const retryClaim = await store.claimDelivery(
      'delivery-1',
      'lease-2',
      '2026-09-01T00:04:00.000Z',
    );
    const retryAttempt: NotificationAttemptRecord = {
      ...createAttempt(),
      id: 'attempt-2',
      sequence: 2,
      retryResolution: resolution,
    };
    const retryStarted = await store.startAttempt(
      { ...retryClaim!, retryResolution: resolution },
      retryAttempt,
      '2026-09-01T00:04:00.000Z',
    );
    expect(retryStarted).toMatchObject({
      status: 'submitting',
      retryResolution: resolution,
    });
    await expect(store.listRetryAudits('delivery-1')).resolves.toMatchObject([
      { resolution },
    ]);
    await expect(store.listAttempts('delivery-1')).resolves.toMatchObject([
      { sequence: 1, retryResolution: undefined },
      { sequence: 2, retryResolution: resolution },
    ]);
  });
});

function withIdempotency(
  bundle: NotificationLogBundle,
  idempotencyKey: string,
  requestFingerprint: string,
): NotificationLogBundle {
  return {
    ...bundle,
    log: { ...bundle.log, idempotencyKey, requestFingerprint },
  };
}

function createBundle(): NotificationLogBundle {
  const createdAt = '2026-08-24T00:00:00.000Z';
  const delivery: NotificationDeliveryRecord = {
    id: 'delivery-1',
    notificationId: 'notification-1',
    channelName: 'email',
    channelType: 'email',
    recipientSnapshot: { address: 'test@example.com' },
    messageSnapshot: { subject: 'Hello' },
    providerType: 'fake',
    attemptCount: 0,
    status: 'pending',
    createdAt,
    updatedAt: createdAt,
  };
  return {
    log: {
      id: 'notification-1',
      sourceType: 'test',
      messageSnapshot: { email: { subject: 'Hello' } },
      status: 'pending',
      createdAt,
      updatedAt: createdAt,
    },
    deliveries: [delivery],
  };
}

function createAttempt(): NotificationAttemptRecord {
  return {
    id: 'attempt-1',
    deliveryId: 'delivery-1',
    sequence: 1,
    providerType: 'fake',
    status: 'submitting',
    startedAt: '2026-08-24T00:00:01.000Z',
  };
}
