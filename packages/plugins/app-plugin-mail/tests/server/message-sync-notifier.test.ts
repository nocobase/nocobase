import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  createQueueService,
  type QueueConfigEntry,
  type QueueService,
} from '@nocobase/queue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  MailMessagesSyncedEvent,
  MailUnsubscribe,
} from '../../server/contracts/message-sync-events.js';
import {
  MAIL_MESSAGE_SYNC_CHANNEL,
  MAIL_MESSAGE_SYNC_QUEUE,
  MAIL_MESSAGE_SYNC_SHUTDOWN_TIMEOUT_MS,
  MailMessageSyncNotifier,
} from '../../server/message-sync-notifier.js';
import { createMailTestQueue, mailQueueBackends } from '../helpers/queue.js';

const event: MailMessagesSyncedEvent = {
  eventId: 'event-1',
  accountId: 'account-1',
  ownerId: 'owner-1',
  syncRunId: 'run-1',
  phase: 'history',
  syncedAt: '2026-09-01T00:00:00.000Z',
  messageIds: ['local-1'],
};

const queues: QueueService[] = [];
const notifiers: MailMessageSyncNotifier[] = [];
const directories: string[] = [];

async function fixture(entry: Partial<QueueConfigEntry> = {}) {
  const storagePath = await mkdtemp(path.join(tmpdir(), 'mail-sync-queue-'));
  directories.push(storagePath);
  const queueLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const queue = createQueueService(
    {
      default: 'memory',
      memory: {
        adapter: 'inMemory',
        ...(entry.adapter === 'redis'
          ? {}
          : { persistence: { path: storagePath } }),
        ...entry,
      },
    },
    { appName: 'mail-notifier-test', storagePath, logger: queueLogger },
  );
  queues.push(queue);
  const logger = { error: vi.fn() };
  const notifier = new MailMessageSyncNotifier(queue, logger);
  notifiers.push(notifier);
  return { queue, notifier, logger, queueLogger, storagePath };
}

async function flush(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

async function barrier(queue: QueueService): Promise<void> {
  const passed = Promise.withResolvers<void>();
  const unregister = queue
    .consumer(MAIL_MESSAGE_SYNC_QUEUE)
    .consume(async (channel): Promise<void> => {
      if (channel === 'test.barrier') passed.resolve();
    });
  await queue.producer(MAIL_MESSAGE_SYNC_QUEUE).publish('test.barrier', {});
  await passed.promise;
  await unregister();
}

afterEach(async () => {
  vi.useRealTimers();
  await Promise.allSettled(
    notifiers.splice(0).map((notifier) => notifier.close()),
  );
  await Promise.allSettled(queues.splice(0).map((queue) => queue.shutdown()));
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe.each(mailQueueBackends)('Mail event transport on %s', (backend) => {
  it('delivers to all local subscriptions registered before host setup', async () => {
    const host = await createMailTestQueue(backend);
    const notifier = new MailMessageSyncNotifier(host.hostQueue);
    const first = vi.fn();
    const second = vi.fn();
    try {
      notifier.subscribe(first);
      notifier.subscribe(second);
      await host.setup();
      await notifier.publish([event]);
      await barrier(host.hostQueue);
      expect(first).toHaveBeenCalledExactlyOnceWith(
        event,
        expect.any(AbortSignal),
      );
      expect(second).toHaveBeenCalledExactlyOnceWith(
        event,
        expect.any(AbortSignal),
      );
    } finally {
      await notifier.close();
      await host.close();
    }
  });

  it('uses host retry defaults and reruns all local subscribers', async () => {
    const host = await createMailTestQueue(backend);
    const notifier = new MailMessageSyncNotifier(host.hostQueue);
    const successful = vi.fn();
    let attempts = 0;
    try {
      await host.hostQueue
        .manager(MAIL_MESSAGE_SYNC_QUEUE)
        .configure({ attempts: 3 });
      notifier.subscribe((): void => {
        attempts += 1;
        if (attempts < 3) throw new Error('Private listener error');
      });
      notifier.subscribe(successful);
      await host.setup();
      await notifier.publish([event]);
      await vi.waitFor(() => expect(successful).toHaveBeenCalledTimes(3));
      await barrier(host.hostQueue);
      expect(attempts).toBe(3);
    } finally {
      await notifier.close();
      await host.close();
    }
  });

  it('deduplicates stable event IDs while retained by the selected backend', async () => {
    const host = await createMailTestQueue(backend);
    const notifier = new MailMessageSyncNotifier(host.hostQueue);
    const received = vi.fn();
    try {
      notifier.subscribe(received);
      await host.setup();
      await notifier.publish([event, event]);
      await barrier(host.hostQueue);
      await notifier.publish([event]);
      await barrier(host.hostQueue);
      expect(received).toHaveBeenCalledOnce();
    } finally {
      await notifier.close();
      await host.close();
    }
  });
});

it.skipIf(!process.env.NOCOBASE_MAIL_TEST_REDIS_PORT)(
  'Redis workers compete for a publisher-only instance rather than globally broadcasting',
  async () => {
    const namespace = `mail-competing-${randomUUID()}`;
    const hosts = await Promise.all([
      createMailTestQueue('redis', namespace),
      createMailTestQueue('redis', namespace),
      createMailTestQueue('redis', namespace),
    ]);
    const transports = hosts.map(
      (host) => new MailMessageSyncNotifier(host.hostQueue),
    );
    const first: string[] = [];
    const second: string[] = [];
    try {
      transports[0]!.subscribe((received) => {
        first.push(received.eventId);
      });
      transports[1]!.subscribe((received) => {
        second.push(received.eventId);
      });
      await Promise.all(hosts.map((host) => host.setup()));
      const events = Array.from({ length: 20 }, (_, index) => ({
        ...event,
        eventId: `competing-${index}`,
      }));
      await transports[2]!.publish(events);
      await vi.waitFor(() => expect(first.length + second.length).toBe(20));
      await Promise.all(transports.map((transport) => transport.close()));
      expect([...first, ...second].sort()).toEqual(
        events.map((item) => item.eventId).sort(),
      );
      expect(new Set([...first, ...second]).size).toBe(20);
    } finally {
      await Promise.allSettled(
        transports.map((transport) => transport.close()),
      );
      await Promise.all(hosts.map((host) => host.close()));
    }
  },
);

describe('Mail queue-backed message sync notifier', () => {
  it('registers in boot before queue setup and publishes to every local registration', async () => {
    const { queue, notifier } = await fixture();
    const first = vi.fn();
    const second = vi.fn();
    const subscribe = vi.spyOn(
      queue.consumer(MAIL_MESSAGE_SYNC_QUEUE),
      'consume',
    );
    notifier.subscribe(first);
    notifier.subscribe(second);
    expect(subscribe).toHaveBeenCalledTimes(2);
    await queue.setup();
    await notifier.publish([event]);
    await barrier(queue);
    expect(first).toHaveBeenCalledExactlyOnceWith(
      event,
      expect.any(AbortSignal),
    );
    expect(second).toHaveBeenCalledExactlyOnceWith(
      event,
      expect.any(AbortSignal),
    );
    expect(first.mock.calls[0][0]).not.toBe(second.mock.calls[0][0]);
  });

  it('awaits queue acceptance but not asynchronous listener completion', async () => {
    const { queue, notifier } = await fixture();
    const started = Promise.withResolvers<void>();
    const finished = Promise.withResolvers<void>();
    notifier.subscribe(async (): Promise<void> => {
      started.resolve();
      await finished.promise;
    });
    await queue.setup();
    await notifier.publish([event]);
    await started.promise;
    let closed = false;
    const closing = notifier.close().then(() => {
      closed = true;
    });
    await flush();
    expect(closed).toBe(false);
    finished.resolve();
    await closing;
  });

  it('leaves retry policy to the queue, rerunning all handlers without republishing a sync', async () => {
    const { queue, notifier, logger, queueLogger } = await fixture({
      attempts: 3,
    });
    const publisher = vi.spyOn(
      queue.producer(MAIL_MESSAGE_SYNC_QUEUE),
      'publish',
    );
    const successful = vi.fn();
    logger.error.mockImplementation(() => {
      throw new Error('Logging failed');
    });
    let synchronousAttempts = 0;
    let asynchronousAttempts = 0;
    notifier.subscribe((): void => {
      synchronousAttempts += 1;
      if (synchronousAttempts === 1) throw new Error('password=secret');
    });
    notifier.subscribe(async (): Promise<void> => {
      asynchronousAttempts += 1;
      if (asynchronousAttempts <= 2) throw new Error('body=private');
    });
    notifier.subscribe(successful);
    await queue.setup();
    await notifier.publish([event]);
    await vi.waitFor(() => expect(successful).toHaveBeenCalledTimes(3));
    await barrier(queue);
    expect(synchronousAttempts).toBe(3);
    expect(asynchronousAttempts).toBe(3);
    expect(
      publisher.mock.calls.filter(
        ([channel]) => channel === MAIL_MESSAGE_SYNC_CHANNEL,
      ),
    ).toHaveLength(1);
    expect(publisher.mock.calls[0][2]).toEqual({
      jobIdProducer: expect.any(Function),
    });
    expect(
      publisher.mock.calls[0][2]?.jobIdProducer?.(
        MAIL_MESSAGE_SYNC_QUEUE,
        MAIL_MESSAGE_SYNC_CHANNEL,
        event,
      ),
    ).toBe(event.eventId);
    expect(logger.error).toHaveBeenCalledTimes(3);
    expect(logger.error.mock.calls[0][0]).toEqual({
      event: 'mail.message_sync.listener_failed',
      eventId: event.eventId,
      accountId: event.accountId,
      syncRunId: event.syncRunId,
    });
    expect(
      JSON.stringify([logger.error.mock.calls, queueLogger.error.mock.calls]),
    ).not.toMatch(/secret|private|password|body/);
  });

  it('deduplicates by stable event ID while the queue retains the job', async () => {
    const { queue, notifier } = await fixture();
    const received = vi.fn();
    notifier.subscribe(received);
    await queue.setup();
    await notifier.publish([event, event]);
    await barrier(queue);
    await notifier.publish([event]);
    await barrier(queue);
    expect(received).toHaveBeenCalledOnce();
  });

  it('retains events published before a late subscription instead of dropping them', async () => {
    const { queue, notifier } = await fixture();
    await queue.setup();
    await notifier.publish([event]);
    const received = vi.fn();
    notifier.subscribe(received);
    await barrier(queue);
    expect(received).toHaveBeenCalledExactlyOnceWith(
      event,
      expect.any(AbortSignal),
    );
  });

  it('snapshots publisher input and freezes a separate event and ID array for each listener', async () => {
    const { queue, notifier } = await fixture();
    const received = vi.fn();
    notifier.subscribe((snapshot): void => {
      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(Object.isFrozen(snapshot.messageIds)).toBe(true);
      expect(Reflect.set(snapshot, 'accountId', 'other')).toBe(false);
      expect(Reflect.set(snapshot.messageIds, '0', 'other')).toBe(false);
    });
    notifier.subscribe(received);
    await queue.setup();
    const input = { ...event, messageIds: ['local-1'] };
    const publishing = notifier.publish([input]);
    input.accountId = 'changed';
    input.messageIds[0] = 'changed';
    await publishing;
    await barrier(queue);
    expect(received).toHaveBeenCalledExactlyOnceWith(
      event,
      expect.any(AbortSignal),
    );
  });

  it('cancels and drains an independent registration, including duplicate callbacks', async () => {
    const { queue, notifier } = await fixture();
    const started = Promise.withResolvers<AbortSignal>();
    const finish = Promise.withResolvers<void>();
    const received = vi.fn(
      async (
        _event: MailMessagesSyncedEvent,
        signal: AbortSignal,
      ): Promise<void> => {
        started.resolve(signal);
        await finish.promise;
      },
    );
    const unsubscribe = notifier.subscribe(received);
    notifier.subscribe(received);
    await queue.setup();
    await notifier.publish([event]);
    const signal = await started.promise;
    let drained = false;
    const removing = unsubscribe().then(() => {
      drained = true;
    });
    expect(unsubscribe()).toBe(unsubscribe());
    expect(signal.aborted).toBe(true);
    await flush();
    expect(drained).toBe(false);
    finish.resolve();
    await removing;
    await notifier.publish([{ ...event, eventId: 'event-2' }]);
    await barrier(queue);
    expect(received).toHaveBeenCalledTimes(3);
  });

  it('forwards queue cancellation and notifier closure signals cooperatively', async () => {
    const { queue, notifier } = await fixture();
    const signals: AbortSignal[] = [];
    notifier.subscribe(async (_event, signal): Promise<void> => {
      signals.push(signal);
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true }),
      );
    });
    await queue.setup();
    await notifier.publish([event]);
    await vi.waitFor(() => expect(signals).toHaveLength(1));
    expect(
      queue.manager(MAIL_MESSAGE_SYNC_QUEUE).cancelJob(event.eventId),
    ).toBe(true);
    await barrier(queue);
    expect(signals[0].aborted).toBe(true);
    await notifier.publish([{ ...event, eventId: 'event-2' }]);
    await vi.waitFor(() => expect(signals).toHaveLength(2));
    const closing = notifier.close();
    expect(signals[1].aborted).toBe(true);
    expect(notifier.close()).toBe(closing);
    await closing;
    expect(() => notifier.subscribe(vi.fn())).toThrow(/closed/);
    await expect(
      notifier.publish([{ ...event, eventId: 'event-3' }]),
    ).resolves.toBeUndefined();
    // The Mail notifier must not shut down the application's shared queue service.
    await queue.producer('unrelated').publish('work', {});
  });

  it('awaits publications already in flight during close and refuses new ones', async () => {
    const { queue, notifier } = await fixture();
    await queue.setup();
    const accepted = Promise.withResolvers<{ jobId: string }>();
    const publish = vi
      .spyOn(queue.producer(MAIL_MESSAGE_SYNC_QUEUE), 'publish')
      .mockReturnValue(accepted.promise);
    const publishing = notifier.publish([event]);
    await flush();
    let drained = false;
    const closing = notifier.close().then(() => {
      drained = true;
    });
    await notifier.publish([{ ...event, eventId: 'event-2' }]);
    await flush();
    expect(drained).toBe(false);
    expect(publish).toHaveBeenCalledOnce();
    accepted.resolve({ jobId: event.eventId });
    await publishing;
    await closing;
  });

  it('rejects malformed payloads without exposing validation details and skips other channels', async () => {
    const { queue, notifier, logger, queueLogger } = await fixture();
    const received = vi.fn();
    notifier.subscribe(received);
    await queue.setup();
    const producer = queue.producer(MAIL_MESSAGE_SYNC_QUEUE);
    for (const payload of [
      null,
      {},
      { ...event, phase: 'secret' },
      { ...event, syncedAt: 'private' },
      { ...event, messageIds: [42] },
      { ...event, messageIds: [] },
      {
        ...event,
        messageIds: Array.from({ length: 101 }, (_, index) => `local-${index}`),
      },
      { ...event, body: 'private' },
    ]) {
      await producer.publish(MAIL_MESSAGE_SYNC_CHANNEL, payload);
    }
    await producer.publish('unrelated', { password: 'secret' });
    await notifier.publish([event]);
    await barrier(queue);
    expect(received).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledTimes(8);
    expect(
      logger.error.mock.calls.every(
        ([data]) =>
          JSON.stringify(data) ===
          JSON.stringify({ event: 'mail.message_sync.payload_invalid' }),
      ),
    ).toBe(true);
    expect(
      JSON.stringify([logger.error.mock.calls, queueLogger.error.mock.calls]),
    ).not.toMatch(/secret|private|password|body/);
  });

  it('logs per-publication errors safely, continues later events, and never rejects committed sync', async () => {
    const { queue, notifier, logger } = await fixture();
    const received = vi.fn();
    notifier.subscribe(received);
    await queue.setup();
    const producer = queue.producer(MAIL_MESSAGE_SYNC_QUEUE);
    vi.spyOn(producer, 'publish').mockRejectedValueOnce(
      new Error('body=private password=secret'),
    );
    logger.error.mockImplementation(() => {
      throw new Error('Logging failed');
    });
    await expect(
      notifier.publish([event, { ...event, eventId: 'event-2' }]),
    ).resolves.toBeUndefined();
    await barrier(queue);
    expect(received).toHaveBeenCalledOnce();
    expect(received.mock.calls[0][0].eventId).toBe('event-2');
    expect(JSON.stringify(logger.error.mock.calls)).not.toMatch(
      /secret|private|password|body/,
    );
  });

  it('contains publication failure before setup and after shared queue shutdown', async () => {
    const { queue, notifier, logger } = await fixture();
    await expect(notifier.publish([event])).resolves.toBeUndefined();
    await queue.setup();
    await queue.shutdown();
    await expect(notifier.publish([event])).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledTimes(2);
  });

  it('does not fall back to local callbacks when the backend is missing or broken', async () => {
    for (const broken of [false, true]) {
      const { queue, notifier, logger, storagePath } = await fixture(
        broken
          ? {}
          : {
              adapter: 'redis',
              queueBackend: 'unregistered',
              connection: { host: '127.0.0.1' },
            },
      );
      if (broken) {
        const encoded = Buffer.from(
          JSON.stringify(['mail-notifier-test', MAIL_MESSAGE_SYNC_QUEUE]),
        ).toString('base64url');
        await writeFile(
          path.join(storagePath, `queue.${encoded}.state.json`),
          'private broken state',
        );
      }
      const received = vi.fn();
      notifier.subscribe(received);
      await expect(queue.setup()).rejects.toThrow();
      await expect(notifier.publish([event])).resolves.toBeUndefined();
      expect(received).not.toHaveBeenCalled();
      expect(JSON.stringify(logger.error.mock.calls)).not.toMatch(
        /private|broken state/,
      );
    }
  });

  it('supports self-unsubscription without awaiting the drain inside its own handler', async () => {
    const { queue, notifier } = await fixture();
    const finished = Promise.withResolvers<void>();
    const received = vi.fn((): void => {
      // Queue's unregistration waits for this handler, so drain it only outside.
      void unsubscribe();
      finished.resolve();
    });
    const unsubscribe: MailUnsubscribe = notifier.subscribe(received);
    await queue.setup();
    await notifier.publish([event]);
    await finished.promise;
    await unsubscribe();
    await notifier.publish([{ ...event, eventId: 'event-2' }]);
    await barrier(queue);
    expect(received).toHaveBeenCalledOnce();
    await notifier.close();
  });

  it('rejects bounded shutdown truthfully when a listener ignores abort, without losing idempotence', async () => {
    const { queue, notifier } = await fixture();
    const started = Promise.withResolvers<AbortSignal>();
    const finish = Promise.withResolvers<void>();
    notifier.subscribe(async (_event, signal): Promise<void> => {
      started.resolve(signal);
      await finish.promise;
    });
    await queue.setup();
    await notifier.publish([event]);
    const signal = await started.promise;
    vi.useFakeTimers();
    const closing = notifier.close();
    const rejection = closing.catch((error: unknown) => error);
    expect(signal.aborted).toBe(true);
    expect(notifier.close()).toBe(closing);
    await vi.advanceTimersByTimeAsync(MAIL_MESSAGE_SYNC_SHUTDOWN_TIMEOUT_MS);
    expect(await rejection).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/shutdown timed out/),
      }),
    );
    finish.resolve();
    vi.useRealTimers();
    await queue.shutdown();
    await expect(notifier.close()).rejects.toThrow(/shutdown timed out/);
  });

  it('isolates separate application queue instances instead of claiming a global broadcast', async () => {
    const first = await fixture();
    const second = await fixture();
    const received = vi.fn();
    second.notifier.subscribe(received);
    await first.queue.setup();
    await second.queue.setup();
    await first.notifier.publish([event]);
    await flush();
    expect(received).not.toHaveBeenCalled();
    await second.notifier.publish([event]);
    await barrier(second.queue);
    expect(received).toHaveBeenCalledOnce();
  });
});
