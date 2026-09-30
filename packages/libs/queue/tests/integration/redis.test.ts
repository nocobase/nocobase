import { randomUUID } from 'node:crypto';

import { createRedisBackend, Queue, type BackendFactory } from 'bullmq';
import { Redis } from 'ioredis';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import {
  createQueueService,
  redisQueueIdentity,
  type QueueConfigEntry,
  type QueueService,
} from '../../src/index.js';
import {
  defineQueueContract,
  silentLogger,
  sleep,
  waitFor,
} from '../contract/queue-contract.js';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

defineQueueContract({
  name: 'redis',
  entry: (namespace) => ({ adapter: 'redis', connection, namespace }),
});

describe('redis queue backend', () => {
  const services: QueueService[] = [];
  const client = new Redis(connection);

  afterEach(async () => {
    await Promise.allSettled(services.splice(0).map((s) => s.shutdown()));
  });

  afterAll(async () => {
    await client.quit();
  });

  function service(
    entry: Partial<QueueConfigEntry> = {},
    namespace: string = `redis-${randomUUID()}`,
  ): QueueService {
    const created = createQueueService(
      {
        default: 'main',
        main: { adapter: 'redis', connection, namespace, ...entry },
      },
      {
        appName: 'redis-test',
        storagePath: '/nonexistent',
        logger: silentLogger,
      },
    );
    services.push(created);
    return created;
  }

  it('keeps every key of a queue under its hash-tagged prefix and stores an envelope', async () => {
    const namespace = `redis-${randomUUID()}`;
    const queue = service({}, namespace);
    await queue.setup();
    const { jobId } = await queue
      .producer('email')
      .publish('send', { version: 2, payload: 'user data' });
    const identity = redisQueueIdentity(namespace, 'email');
    expect(identity.name).toBe('q-ZW1haWw');
    expect(identity.prefix).toMatch(/^nbq:\{[0-9a-f]{64}\}$/u);
    const keys = await client.keys(`${identity.prefix}:*`);
    expect(keys).toContain(`${identity.prefix}:q-ZW1haWw:wait`);

    const raw = new Queue(identity.name, {
      connection,
      prefix: identity.prefix,
    });
    try {
      const job = await raw.getJob(jobId);
      expect(job?.name).toBe('send');
      expect(job?.data).toEqual({
        version: 1,
        payload: JSON.stringify({ version: 2, payload: 'user data' }),
      });
    } finally {
      await raw.close();
    }
  });

  it('shares a queue between services with the same namespace, each job once', async () => {
    const namespace = `redis-${randomUUID()}`;
    const seen: Array<[string, unknown]> = [];
    const instances = [service({}, namespace), service({}, namespace)];
    instances.forEach((instance, index) => {
      instance.consumer('shared').consume(async (_c, message) => {
        seen.push([`instance-${index}`, message]);
        await sleep(20);
      });
    });
    await Promise.all(instances.map((instance) => instance.setup()));
    await instances[0].producer('shared').publishMany(
      Array.from({ length: 20 }, (_, index) => ({
        channel: 'x',
        message: index,
      })),
    );
    await waitFor(() => seen.length === 20);
    await sleep(200);
    expect(
      seen.map(([, message]) => message).sort((a, b) => Number(a) - Number(b)),
    ).toEqual(Array.from({ length: 20 }, (_, index) => index));
    expect(new Set(seen.map(([instance]) => instance)).size).toBe(2);
  });

  it('fails jobs without a version 1 envelope instead of retrying them', async () => {
    const namespace = `redis-${randomUUID()}`;
    const queue = service({}, namespace);
    const calls: unknown[] = [];
    queue.consumer('foreign').consume(async (_c, message) => {
      calls.push(message);
    });
    await queue.setup();
    const identity = redisQueueIdentity(namespace, 'foreign');
    const raw = new Queue(identity.name, {
      connection,
      prefix: identity.prefix,
    });
    try {
      const job = await raw.add('x', { raw: true }, { attempts: 3 });
      const started = Date.now();
      while ((await job.getState()) !== 'failed') {
        if (Date.now() - started > 5000)
          throw new Error('The job did not fail.');
        await sleep(20);
      }
      await sleep(200);
      expect(calls).toEqual([]);
      expect((await raw.getJob(job.id ?? ''))?.attemptsMade).toBe(1);
    } finally {
      await raw.close();
    }
  });

  it('writes an explicit rate limit to the backend when the queue opens', async () => {
    const namespace = `redis-${randomUUID()}`;
    const queue = service({ rateLimit: { max: 7, duration: 1000 } }, namespace);
    queue.producer('limited');
    await queue.setup();
    const identity = redisQueueIdentity(namespace, 'limited');
    const meta = await client.hgetall(
      `${identity.prefix}:${identity.name}:meta`,
    );
    expect(meta).toMatchObject({ max: '7', duration: '1000' });
    await queue.manager('limited').configure({ rateLimit: null });
    const cleared = await client.hgetall(
      `${identity.prefix}:${identity.name}:meta`,
    );
    expect(cleared.max).toBeUndefined();
  });

  it('uses a registered backend factory for its configurations', async () => {
    const created: string[] = [];
    const factory: BackendFactory = (name, opts, options) => {
      created.push(name);
      return createRedisBackend(name, opts, options);
    };
    const queue = createQueueService(
      {
        default: 'custom',
        custom: {
          adapter: 'redis',
          queueBackend: 'tracked',
          connection,
          namespace: `redis-${randomUUID()}`,
        },
      },
      {
        appName: 'redis-test',
        storagePath: '/nonexistent',
        logger: silentLogger,
      },
    );
    services.push(queue);
    queue.registerBackend('tracked', factory);
    const received: unknown[] = [];
    queue.consumer('factory').consume(async (_c, message) => {
      received.push(message);
    });
    await queue.setup();
    expect(() => queue.registerBackend('late', factory)).toThrow(/before/u);
    await queue.producer('factory').publish('x', 'through the factory');
    await waitFor(() => received.length === 1);
    expect(created.length).toBeGreaterThanOrEqual(2);
  });

  it('fails setup instead of falling back when Redis is unreachable', async () => {
    const queue = createQueueService(
      {
        default: 'main',
        main: {
          adapter: 'redis',
          connection: { host: '127.0.0.1', port: 1 },
          setupTimeoutMs: 300,
        },
      },
      {
        appName: 'redis-test',
        storagePath: '/nonexistent',
        logger: silentLogger,
      },
    );
    services.push(queue);
    queue.producer('unreachable');
    await expect(queue.setup()).rejects.toThrow(
      /did not initialize within 300 ms/u,
    );
    await expect(
      queue.producer('unreachable').publish('x', {}),
    ).rejects.toThrow();
  });
});
