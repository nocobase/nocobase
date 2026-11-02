import { expect, it, vi } from 'vitest';
import {
  ConcurrentAbortError,
  ConcurrentCloseError,
  ConcurrentConfigurationError,
} from '@nocobase/concurrency';
import { ManagedConcurrencyService } from '../../server/services/concurrency.js';
import type {
  ConcurrencyInstance,
  ResolvedConcurrencyConfig,
} from '../../server/index.js';
import {
  ManagedLeaseRegistry,
  startAcquire,
  createSynchronousExecutor,
} from '../../server/index.js';

function fixture() {
  const service = new ManagedConcurrencyService({
    appName: 'test',
    nodeEnv: 'development',
  });
  const start = vi.fn(async () => {});
  const shutdown = vi.fn(async () => {});
  const acquire = vi.fn(async () => async () => {});
  const create = vi.fn(
    (_entry: ResolvedConcurrencyConfig): ConcurrencyInstance => {
      const registry = new ManagedLeaseRegistry();
      const controller = new AbortController();
      const pending = new Set<Promise<void>>();
      const request = () => {
        const task = startAcquire(registry, {
          signal: controller.signal,
          acquire,
        });
        if (task.completion) {
          const completion = task.completion;
          pending.add(completion);
          void completion
            .finally(() => pending.delete(completion))
            .catch(() => {});
        }
        return task.result;
      };
      const lock = {
        async lock() {
          const lease = await request();
          if (!lease) throw new Error('Expected lease');
          return lease;
        },
        tryLock: request,
      };
      return {
        manager: {
          createLock: async () => lock,
          createSynchronous: async () => createSynchronousExecutor(lock),
        },
        start,
        async shutdown() {
          controller.abort();
          while (pending.size) await Promise.allSettled([...pending]);
          await registry.releaseAll();
          await shutdown();
          registry.clear();
        },
      };
    },
  );
  const validate = vi.fn();
  service.registerImplementation('fixture', { validate, create });
  return { service, start, shutdown, create, validate, acquire };
}
const config = {
  default: 'memory',
  memory: { adapter: 'mutex' },
  remote: { adapter: 'fixture', connection: {} },
  second: { adapter: 'fixture', connection: {} },
};
it('S01/S06/E02: validate and synchronous create do not acquire; named initialization is shared', async () => {
  const f = fixture();
  f.service.boot(config);
  expect(f.validate).toHaveBeenCalledTimes(2);
  expect(f.create).not.toHaveBeenCalled();
  await f.service.start();
  const [a, b] = await Promise.all([
    f.service.getManager('remote'),
    f.service.getManager('remote'),
  ]);
  expect(a).toBe(b);
  expect(f.create).toHaveBeenCalledTimes(1);
  expect(f.start).toHaveBeenCalledTimes(1);
  expect(f.acquire).not.toHaveBeenCalled();
  const lease = await (await a.createLock('x')).lock();
  await lease.release();
  await f.service.shutdown();
  expect(f.shutdown).toHaveBeenCalledTimes(1);
});
it('S06: failed startup retains the same instance for shutdown and never rebuilds', async () => {
  const f = fixture();
  f.start.mockRejectedValue(new Error('start'));
  f.service.boot(config);
  await f.service.start();
  await expect(f.service.getManager('remote')).rejects.toBeInstanceOf(
    ConcurrentConfigurationError,
  );
  await expect(f.service.getManager('remote')).rejects.toBeInstanceOf(
    ConcurrentConfigurationError,
  );
  expect(f.create).toHaveBeenCalledTimes(1);
  await f.service.shutdown();
  expect(f.shutdown).toHaveBeenCalledTimes(1);
});
it('S07: shutdown closes an instance while start is pending and observes its later rejection', async () => {
  const f = fixture();
  const started = Promise.withResolvers<void>();
  const barrier = Promise.withResolvers<void>();
  f.start.mockImplementation(() => {
    started.resolve();
    return barrier.promise;
  });
  f.service.boot(config);
  await f.service.start();
  const initializing = f.service.getManager('remote');
  const rejected = initializing.catch((error: unknown) => error);
  await started.promise;
  const closing = f.service.shutdown();
  await vi.waitFor(() => expect(f.shutdown).toHaveBeenCalledTimes(1));
  barrier.reject(new Error('late start'));
  await closing;
  expect(await rejected).toBeInstanceOf(ConcurrentConfigurationError);
  await expect(f.service.getManager()).rejects.toBeInstanceOf(
    ConcurrentAbortError,
  );
});
it('S07: shutdown before factory microtask does not construct a late instance', async () => {
  const f = fixture();
  f.service.boot(config);
  await f.service.start();
  const pending = f.service
    .getManager('remote')
    .catch((error: unknown) => error);
  await f.service.shutdown();
  expect(await pending).toBeInstanceOf(ConcurrentAbortError);
  expect(f.create).not.toHaveBeenCalled();
});
it('S07: synchronous reentrant shutdown from create saves the returned instance without starting it', async () => {
  const service = new ManagedConcurrencyService({ appName: 'test' });
  const start = vi.fn(async () => {});
  const shutdown = vi.fn(async () => {});
  let closing: Promise<void> | undefined;
  service.registerImplementation('fixture', {
    validate: () => {},
    create: () => {
      closing = service.shutdown();
      return {
        manager: {
          createLock: async () => {
            throw new Error('not started');
          },
          createSynchronous: async () => {
            throw new Error('not started');
          },
        },
        start,
        shutdown,
      };
    },
  });
  service.boot({
    default: 'remote',
    remote: { adapter: 'fixture', connection: {} },
  });
  await expect(service.start()).rejects.toBeInstanceOf(ConcurrentAbortError);
  await closing;
  expect(start).not.toHaveBeenCalled();
  expect(shutdown).toHaveBeenCalledTimes(1);
});
it('C25/C26/S08: multi-instance shutdown continues after a failure; explicit retry reuses failed handle only', async () => {
  const f = fixture();
  f.service.boot(config);
  await f.service.start();
  await f.service.getManager('remote');
  await f.service.getManager('second');
  f.shutdown.mockRejectedValueOnce(new Error('close'));
  const closing = f.service.shutdown();
  expect(f.service.shutdown()).toBe(closing);
  await expect(closing).rejects.toBeInstanceOf(ConcurrentCloseError);
  expect(f.shutdown).toHaveBeenCalledTimes(2);
  await f.service.shutdown();
  expect(f.shutdown).toHaveBeenCalledTimes(3);
  await f.service.shutdown();
  expect(f.create).toHaveBeenCalledTimes(2);
  expect(f.shutdown).toHaveBeenCalledTimes(3);
});
it('registration captures methods and rejects duplicates and registration after boot', () => {
  const f = fixture();
  expect(() =>
    f.service.registerImplementation('fixture', {
      validate: f.validate,
      create: f.create,
    }),
  ).toThrow(ConcurrentConfigurationError);
  f.service.boot(config);
  expect(() =>
    f.service.registerImplementation('later', {
      validate: f.validate,
      create: f.create,
    }),
  ).toThrow(ConcurrentConfigurationError);
});

it('C24/E02: a failed held releaser does not stop sibling cleanup or the owned connection close', async () => {
  const f = fixture();
  const failedRelease = vi.fn(async () => {
    throw new Error('release failure');
  });
  const successfulRelease = vi.fn(async () => {});
  f.acquire
    .mockResolvedValueOnce(failedRelease)
    .mockResolvedValueOnce(successfulRelease);
  f.service.boot(config);
  await f.service.start();
  const manager = await f.service.getManager('remote');
  await (await manager.createLock('first')).lock();
  await (await manager.createLock('second')).lock();
  await expect(f.service.shutdown()).resolves.toBeUndefined();
  expect(failedRelease).toHaveBeenCalledTimes(1);
  expect(successfulRelease).toHaveBeenCalledTimes(1);
  expect(f.shutdown).toHaveBeenCalledTimes(1);
  await f.service.shutdown();
  expect(f.shutdown).toHaveBeenCalledTimes(1);
});
