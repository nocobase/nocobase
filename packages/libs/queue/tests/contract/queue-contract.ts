import { randomUUID } from 'node:crypto';

import { afterEach, describe, expect, it } from 'vitest';

import {
  createQueueService,
  withChannel,
  type QueueConfigEntry,
  type QueueLogger,
  type QueueService,
} from '../../src/index.js';

/** An implementation the contract runs against. */
export interface QueueContractTarget {
  readonly name: string;
  /** A complete configuration entry for `namespace`, without job options. */
  entry(namespace: string): QueueConfigEntry;
}

export interface Deferred<T = void> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: unknown): void;
}

export function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export async function waitFor(
  predicate: () => boolean,
  timeoutMs = 5000,
): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) {
      throw new Error('Timed out waiting for a condition.');
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const silentLogger: QueueLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

/**
 * The business contract both implementations satisfy. Each test uses its
 * own namespace, so persistent backends do not share queues between tests.
 */
export function defineQueueContract(target: QueueContractTarget): void {
  describe(`${target.name} queue contract`, () => {
    const services: QueueService[] = [];

    afterEach(async () => {
      await Promise.allSettled(services.splice(0).map((s) => s.shutdown()));
    });

    function service(
      options: Partial<QueueConfigEntry> = {},
      namespace: string = `contract-${randomUUID()}`,
    ): QueueService {
      const created = createQueueService(
        {
          default: 'main',
          main: { ...target.entry(namespace), ...options },
        },
        {
          appName: 'contract',
          storagePath: '/nonexistent',
          logger: silentLogger,
        },
      );
      services.push(created);
      return created;
    }

    it('publishes only after setup and delivers the channel and a JSON copy', async () => {
      const queue = service();
      const received: Array<[string, unknown]> = [];
      queue.consumer('email').consume(async (channel, message) => {
        received.push([channel, message]);
      });
      await expect(
        queue.producer('email').publish('send', { to: 'a' }),
      ).rejects.toThrow(/before the queue service is set up/u);
      await queue.setup();
      const receipt = await queue
        .producer('email')
        .publish('send', { to: 'a', at: new Date(0) });
      expect(typeof receipt.jobId).toBe('string');
      await waitFor(() => received.length === 1);
      expect(received[0]).toEqual([
        'send',
        { to: 'a', at: '1970-01-01T00:00:00.000Z' },
      ]);
    });

    it('rejects values JSON cannot carry before writing anything', async () => {
      const queue = service();
      const received: unknown[] = [];
      await queue.setup();
      await expect(
        queue.producer('batch').publishMany([
          { channel: 'a', message: 1 },
          { channel: 'a', message: 2n },
        ]),
      ).rejects.toThrow(TypeError);
      const cyclic: Record<string, unknown> = {};
      cyclic.self = cyclic;
      await expect(
        queue.producer('batch').publish('a', cyclic),
      ).rejects.toThrow(TypeError);
      await expect(
        queue.producer('batch').publish('a', () => undefined),
      ).rejects.toThrow(/serialize to JSON/u);
      await queue.producer('batch').publish('a', 'sentinel');
      queue.consumer('batch').consume(async (_channel, message) => {
        received.push(message);
      });
      await waitFor(() => received.length === 1);
      await sleep(100);
      expect(received).toEqual(['sentinel']);
    });

    it('publishes a batch and skips existing IDs', async () => {
      const queue = service({
        jobIdProducer: (_queue, channel, message) =>
          `${channel}-${String((message as { id: number }).id)}`,
      });
      const received: unknown[] = [];
      await queue.setup();
      expect(await queue.producer('bulk').publishMany([])).toEqual([]);
      const receipts = await queue.producer('bulk').publishMany([
        { channel: 'c', message: { id: 1 } },
        { channel: 'c', message: { id: 2 } },
      ]);
      expect(receipts).toEqual([{ jobId: 'c-1' }, { jobId: 'c-2' }]);
      expect(
        await queue.producer('bulk').publish('c', { id: 1, again: true }),
      ).toEqual({ jobId: 'c-1' });
      await expect(
        queue
          .producer('bulk')
          .publish('c', { id: 3 }, { jobIdProducer: () => '42' }),
      ).rejects.toThrow(/integer/u);
      queue.consumer('bulk').consume(async (_channel, message) => {
        received.push(message);
      });
      await waitFor(() => received.length === 2);
      await sleep(100);
      expect(received).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('runs every handler of a snapshot and fails the job when any fails', async () => {
      const queue = service({ attempts: 2 });
      const calls: string[] = [];
      let failures = 0;
      queue.consumer('multi').consume(() => {
        calls.push('sync-throw');
        failures += 1;
        if (failures === 1) throw new Error('sync failure');
        return Promise.resolve();
      });
      queue.consumer('multi').consume(async () => {
        await sleep(20);
        calls.push('async');
      });
      await queue.setup();
      await queue.producer('multi').publish('x', {});
      await waitFor(() => calls.length === 4);
      expect(calls.filter((call) => call === 'async')).toHaveLength(2);
      expect(calls.filter((call) => call === 'sync-throw')).toHaveLength(2);
    });

    it('filters channels with withChannel and completes jobs every handler skips', async () => {
      const queue = service();
      const matched: string[] = [];
      queue.consumer('channels').consume(
        withChannel(['email', 'notification-email'], async (channel) => {
          matched.push(channel);
        }),
      );
      queue.consumer('channels').consume(
        withChannel([], async () => {
          matched.push('never');
        }),
      );
      await queue.setup();
      for (const channel of ['email', 'sms', 'notification-email']) {
        await queue.producer('channels').publish(channel, {});
      }
      await waitFor(() => matched.length === 2);
      await sleep(100);
      expect(matched.sort()).toEqual(['email', 'notification-email']);
    });

    it('waits for running calls on unregister and holds jobs until a handler returns', async () => {
      const queue = service();
      const release = deferred();
      const started = deferred();
      const seen: unknown[] = [];
      const unregister = queue
        .consumer('pause')
        .consume(async (_c, message) => {
          seen.push(message);
          started.resolve();
          await release.promise;
        });
      await queue.setup();
      await queue.producer('pause').publish('x', 1);
      await started.promise;
      let unregistered = false;
      const unregistering = unregister().then(() => {
        unregistered = true;
      });
      await sleep(50);
      expect(unregistered).toBe(false);
      release.resolve();
      await unregistering;
      await expect(unregister()).resolves.toBeUndefined();
      await queue.producer('pause').publish('x', 2);
      await sleep(200);
      expect(seen).toEqual([1]);
      queue.consumer('pause').consume(async (_c, message) => {
        seen.push(message);
      });
      await waitFor(() => seen.length === 2);
      expect(seen).toEqual([1, 2]);
    });

    it('fails a cancelled job without retrying it, even when the handler ignores the signal', async () => {
      const queue = service({ attempts: 3 });
      const started = deferred();
      let runs = 0;
      let aborted: unknown;
      queue.consumer('cancel').consume(async (_c, _m, signal) => {
        runs += 1;
        started.resolve();
        await new Promise<void>((resolve) => {
          signal.addEventListener('abort', () => {
            aborted = signal.reason;
            resolve();
          });
        });
      });
      await queue.setup();
      const { jobId } = await queue.producer('cancel').publish('x', {});
      await started.promise;
      expect(queue.manager('cancel').cancelJob('missing')).toBe(false);
      expect(queue.manager('cancel').cancelJob(jobId, 'stop')).toBe(true);
      await waitFor(() => aborted !== undefined);
      expect((aborted as Error).message).toBe('stop');
      await sleep(300);
      expect(runs).toBe(1);
    });

    it('retries with a fixed backoff until attempts run out', async () => {
      const queue = service({
        attempts: 3,
        backoff: { type: 'fixed', delay: 50 },
      });
      const runs: number[] = [];
      queue.consumer('retry').consume(async () => {
        runs.push(Date.now());
        throw new Error('always');
      });
      await queue.setup();
      await queue.producer('retry').publish('x', {});
      await waitFor(() => runs.length === 3);
      await sleep(200);
      expect(runs).toHaveLength(3);
      expect(runs[1] - runs[0]).toBeGreaterThanOrEqual(40);
      await expect(
        queue
          .producer('retry')
          .publish('x', {}, { backoff: { type: 'custom', delay: 1 } }),
      ).rejects.toThrow(/not supported/u);
    });

    it('delays jobs and orders waiting jobs by priority', async () => {
      const queue = service();
      const order: unknown[] = [];
      await queue.setup();
      const producer = queue.producer('ordered');
      await producer.publish('x', 'delayed', { delay: 300 });
      await producer.publish('x', 'p2', { priority: 2 });
      await producer.publish('x', 'p1', { priority: 1 });
      await producer.publish('x', 'none');
      const started = Date.now();
      let delayedAt = 0;
      queue.consumer('ordered').consume(async (_c, message) => {
        order.push(message);
        if (message === 'delayed') delayedAt = Date.now();
      });
      await waitFor(() => order.length === 4);
      expect(order).toEqual(['none', 'p1', 'p2', 'delayed']);
      expect(delayedAt - started).toBeGreaterThanOrEqual(150);
    });

    it('changes concurrency at runtime', async () => {
      const queue = service();
      let running = 0;
      let peak = 0;
      queue.consumer('parallel').consume(async () => {
        running += 1;
        peak = Math.max(peak, running);
        await sleep(100);
        running -= 1;
      });
      await queue.manager('parallel').configure({ concurrency: 3 });
      await queue.setup();
      await queue.producer('parallel').publishMany(
        Array.from({ length: 6 }, (_, index) => ({
          channel: 'x',
          message: index,
        })),
      );
      await waitFor(() => peak === 3);
      await expect(
        queue.manager('parallel').configure({ namespace: 'other' } as never),
      ).rejects.toThrow(/cannot be changed at runtime/u);
    });

    it('limits job starts per window and removes the limit with null', async () => {
      const queue = service();
      const starts: number[] = [];
      queue.consumer('limited').consume(async () => {
        starts.push(Date.now());
      });
      await queue.setup();
      await queue
        .manager('limited')
        .configure({ concurrency: 4, rateLimit: { max: 1, duration: 400 } });
      await queue.producer('limited').publishMany([
        { channel: 'x', message: 1 },
        { channel: 'x', message: 2 },
      ]);
      await waitFor(() => starts.length === 2);
      expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(300);
      await queue.manager('limited').configure({ rateLimit: null });
      // A worker already waiting out the last window may finish that wait.
      await queue.producer('limited').publishMany([
        { channel: 'x', message: 3 },
        { channel: 'x', message: 4 },
        { channel: 'x', message: 5 },
      ]);
      await waitFor(() => starts.length === 5);
      expect(starts[4] - starts[2]).toBeLessThan(300);
    });

    it('drains waiting jobs, and delayed ones on request', async () => {
      const queue = service();
      const kept: unknown[] = [];
      const cleared: unknown[] = [];
      await queue.setup();
      await queue.producer('drain-waiting').publish('x', 'waiting');
      await queue
        .producer('drain-waiting')
        .publish('x', 'delayed', { delay: 200 });
      await queue.manager('drain-waiting').drain();
      await queue.producer('drain-all').publish('x', 'waiting');
      await queue.producer('drain-all').publish('x', 'delayed', { delay: 200 });
      await queue.manager('drain-all').drain({ delayed: true });
      await queue.producer('drain-all').publish('x', 'after');
      queue.consumer('drain-waiting').consume(async (_c, message) => {
        kept.push(message);
      });
      queue.consumer('drain-all').consume(async (_c, message) => {
        cleared.push(message);
      });
      await waitFor(() => kept.length === 1);
      await sleep(400);
      expect(kept).toEqual(['delayed']);
      expect(cleared).toEqual(['after']);
    });

    it('binds a queue to one configuration key', () => {
      const queue = createQueueService(
        {
          default: 'main',
          main: target.entry(`contract-${randomUUID()}`),
          other: target.entry(`contract-${randomUUID()}`),
        },
        {
          appName: 'contract',
          storagePath: '/nonexistent',
          logger: silentLogger,
        },
      );
      services.push(queue);
      queue.producer('bound');
      expect(() => queue.consumer('bound', 'default')).not.toThrow();
      expect(() => queue.consumer('bound', 'missing')).not.toThrow();
      expect(() => queue.manager('bound', 'other')).toThrow(/is bound to/u);
    });

    it('returns interrupted jobs to waiting at shutdown without spending an attempt', async () => {
      const namespace = `contract-${randomUUID()}`;
      const options = { shutdownTimeoutMs: 100, cancellationGraceMs: 1000 };
      const first = service(options, namespace);
      const started = deferred();
      let interrupted = false;
      first.consumer('interrupted').consume(async (_c, _m, signal) => {
        started.resolve();
        await new Promise<void>((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            interrupted = true;
            reject(signal.reason as Error);
          });
        });
      });
      await first.setup();
      await first.producer('interrupted').publish('x', 'work');
      await started.promise;
      await first.shutdown();
      expect(interrupted).toBe(true);
      await expect(
        first.producer('interrupted').publish('x', 'late'),
      ).rejects.toThrow(/shutting down|shut down/u);
      await expect(first.shutdown()).resolves.toBeUndefined();

      const second = service(options, namespace);
      const received: unknown[] = [];
      second.consumer('interrupted').consume(async (_c, message) => {
        received.push(message);
      });
      await second.setup();
      await waitFor(() => received.length === 1);
      expect(received).toEqual(['work']);
    });

    it('reports handlers that ignore the shutdown signal past the grace period', async () => {
      const queue = service({ shutdownTimeoutMs: 50, cancellationGraceMs: 50 });
      const started = deferred();
      const release = deferred();
      queue.consumer('stuck').consume(async () => {
        started.resolve();
        await release.promise;
      });
      await queue.setup();
      await queue.producer('stuck').publish('x', {});
      await started.promise;
      await expect(queue.shutdown()).rejects.toThrow(
        /did not stop on the shutdown signal/u,
      );
      release.resolve();
    });
  });
}
