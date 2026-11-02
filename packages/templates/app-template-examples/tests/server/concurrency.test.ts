import { expect, it, vi } from 'vitest';
import { ConcurrentAbortError } from '@nocobase/concurrency';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  concurrencyServiceToken,
  type ConcurrencyService,
} from '@nocobase/app-plugin-concurrency/server';
import { createStandaloneServer } from '../../server/standalone.js';
import concurrency from '../../server/config/concurrency.js';

class BusinessConsumer {
  public constructor(private readonly service: ConcurrencyService) {}
  public manager() {
    return this.service.getManager('memory');
  }
}

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { secret: 'test-auth-secret-at-least-32-characters' },
  },
});

test('explicit ttl keeps local Lock and Executor mutually exclusive until actual release', async ({
  app,
}) => {
  const manager = await app.container
    .resolve(concurrencyServiceToken)
    .getManager();
  const lock = await manager.createLock('concurrency-test:ttl', { ttl: 1 });
  const executor = await manager.createSynchronous('concurrency-test:ttl', {
    ttl: 2,
  });
  vi.useFakeTimers();
  try {
    const held = await lock.lock();
    let entered = false;
    const done = Promise.withResolvers<string>();
    const running = executor.run(() => {
      entered = true;
      return done.promise;
    });
    try {
      await vi.advanceTimersByTimeAsync(1000);
      expect(entered).toBe(false);
      await held.release();
      await vi.advanceTimersByTimeAsync(0);
      expect(entered).toBe(true);
      let successorEntered = false;
      const next = lock.lock().then((lease) => {
        successorEntered = true;
        return lease;
      });
      await vi.advanceTimersByTimeAsync(1000);
      expect(successorEntered).toBe(false);
      done.resolve('actual');
      expect(await running).toBe('actual');
      const successor = await next;
      await held.release();
      const attempt = executor.tryRun(() => 'wrong', 10);
      await vi.advanceTimersByTimeAsync(10);
      expect(await attempt).toEqual({ acquired: false });
      await successor.release();
    } finally {
      done.resolve('actual');
      await running;
      await held.release();
    }
  } finally {
    vi.useRealTimers();
  }
});
test('the real default composition supplies one memory lock domain to two business consumers', async ({
  app,
}) => {
  const service = app.container.resolve(concurrencyServiceToken);
  const first = new BusinessConsumer(service);
  const second = new BusinessConsumer(service);
  expect(app.config.get('concurrency')).toEqual({
    default: 'memory',
    memory: { adapter: 'mutex' },
  });
  const [left, right] = await Promise.all([first.manager(), second.manager()]);
  expect(left).toBe(right);
  expect(left).toBe(await service.getManager());
  const lock = await left.createLock('concurrency-test:business');
  const executor = await right.createSynchronous('concurrency-test:business');
  const lease = await lock.lock();
  try {
    expect(await executor.tryRun(() => 'should-not-run')).toEqual({
      acquired: false,
    });
  } finally {
    await lease.release();
  }
  expect(await executor.tryRun(() => 'done')).toEqual({
    acquired: true,
    value: 'done',
  });
  const cancellation = new AbortController();
  const held = await lock.lock();
  const cancelled = lock
    .lock({ signal: cancellation.signal })
    .catch((error: unknown) => error);
  cancellation.abort();
  expect(await cancelled).toBeInstanceOf(ConcurrentAbortError);
  await held.release();
  const active = await lock.lock();
  const interrupted = lock.lock().catch((error: unknown) => error);
  await app.shutdown();
  expect(await interrupted).toBeInstanceOf(ConcurrentAbortError);
  await active.release();
  await expect(lock.lock()).rejects.toBeInstanceOf(ConcurrentAbortError);
});

it('declares only the default selector environment variable and no public configuration', () => {
  expect(concurrency.rules?.public).toEqual([]);
  expect(Object.keys(concurrency.rules?.env ?? {})).toEqual([
    'CONCURRENCY_DEFAULT',
  ]);
  expect(concurrency.rules?.validators).toHaveLength(1);
});
