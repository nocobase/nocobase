import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  createQueueService,
  type QueueConfig,
  type QueueImplementation,
  type QueueRuntime,
  type QueueService,
} from '../../src/index.js';
import { deferred, silentLogger } from '../contract/queue-contract.js';

let storage: string;
const services: QueueService[] = [];
beforeEach(async () => {
  storage = await mkdtemp(path.join(os.tmpdir(), 'queue-extension-'));
});
afterEach(async () => {
  await Promise.allSettled(
    services.splice(0).map((service) => service.shutdown()),
  );
  await rm(storage, { recursive: true, force: true });
});
function service(config: unknown): QueueService {
  const queue = createQueueService(config as QueueConfig, {
    appName: 'extension',
    storagePath: storage,
    logger: silentLogger,
  });
  services.push(queue);
  return queue;
}
function implementation(open: () => Promise<void> = async () => undefined) {
  const close = vi.fn(async () => undefined);
  const add = vi.fn(async () => ['prepared-id']);
  const createRuntime = vi.fn((): QueueRuntime => ({
    open,
    close,
    add,
    startConsuming: async () => undefined,
    pauseConsuming: async () => undefined,
    setConcurrency: () => undefined,
    setRateLimit: async () => undefined,
    drain: async () => undefined,
    stopConsuming: async () => undefined,
  }));
  const validateConfig = vi.fn(() => undefined);
  const backend: QueueImplementation = { createRuntime, validateConfig };
  return { backend, close, add, createRuntime, validateConfig };
}

it('validates unused common options but defers absent backend validation', async () => {
  const queue = service({
    default: 'memory',
    memory: { adapter: 'inMemory' },
    redis: { adapter: 'redis' },
  });
  await queue.setup();
  await queue.producer('memory').publish('x', {});
  expect(() => queue.producer('later', 'redis')).toThrow(
    /configuration "redis".*adapter "redis".*not registered/u,
  );
  const invalid = service({ redis: { adapter: 'redis', concurrency: 0 } });
  await expect(invalid.setup()).rejects.toThrow(/positive integer/u);
});

it.each(['default', 'early'])(
  'rejects missing selected Redis implementation (%s) without fallback',
  async (selection) => {
    const queue = service({
      ...(selection === 'default' ? { default: 'redis' } : {}),
      redis: { adapter: 'redis' },
    });
    if (selection === 'early') queue.producer('early', 'redis');
    await expect(queue.setup()).rejects.toThrow(
      /@nocobase\/app-plugin-queue-redis\/server/u,
    );
  },
);

it('binds early entry points, validates every registered backend configuration without opening unused runtimes and freezes registration', async () => {
  const queue = service({
    default: 'one',
    one: { adapter: 'external' },
    two: { adapter: 'external' },
  });
  const producer = queue.producer('mail');
  queue.consumer('mail').consume(async () => undefined);
  await queue.manager('mail').configure({ concurrency: 2 });
  const backend = implementation();
  expect(backend.createRuntime).not.toHaveBeenCalled();
  queue.registerImplementation('external', backend.backend);
  expect(() => queue.producer('mail', 'two')).toThrow(/bound/u);
  await queue.setup();
  expect(backend.validateConfig.mock.calls.length).toBeGreaterThanOrEqual(2);
  expect(backend.createRuntime).toHaveBeenCalledTimes(1);
  await expect(producer.publish('x', {})).resolves.toEqual({
    jobId: 'prepared-id',
  });
  expect(() => queue.registerImplementation('late', backend.backend)).toThrow(
    /before setup/u,
  );
});

it('fully validates even unused configurations of registered implementations', async () => {
  const queue = service({ unused: { adapter: 'external' } });
  queue.registerImplementation('external', {
    ...implementation().backend,
    validateConfig: () => {
      throw new Error('invalid backend options');
    },
  });
  await expect(queue.setup()).rejects.toThrow('invalid backend options');
});

it('cleans up a late successful open after its independent initialization deadline', async () => {
  const gate = deferred();
  const backend = implementation(() => gate.promise);
  const queue = service({
    default: 'external',
    external: { adapter: 'external', setupTimeoutMs: 20 },
  });
  queue.registerImplementation('external', backend.backend);
  queue.producer('late');
  await expect(queue.setup()).rejects.toThrow(/did not initialize/u);
  expect(backend.close).toHaveBeenCalled();
  gate.resolve();
  await vi.waitFor(() => expect(backend.close).toHaveBeenCalledTimes(2));
});

it('keeps a running service and other queues healthy after lazy initialization failure and permits retry', async () => {
  let fail = true;
  const backend = implementation(async () => {
    if (fail) throw new Error('offline');
  });
  const queue = service({
    memory: { adapter: 'inMemory' },
    external: { adapter: 'external' },
  });
  queue.registerImplementation('external', backend.backend);
  await queue.setup();
  const producer = queue.producer('external', 'external');
  await expect(producer.publish('x', {})).rejects.toThrow('offline');
  await queue.producer('memory', 'memory').publish('x', {});
  fail = false;
  await expect(producer.publish('x', {})).resolves.toEqual({
    jobId: 'prepared-id',
  });
  expect(backend.createRuntime).toHaveBeenCalledTimes(2);
});

it('keeps shared initialization alive when the first publish exhausts its own ten-second budget', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  const gate = deferred();
  const backend = implementation(() => gate.promise);
  const queue = service({
    default: 'external',
    external: { adapter: 'external', setupTimeoutMs: 20000 },
  });
  queue.registerImplementation('external', backend.backend);
  try {
    await queue.setup();
    const producer = queue.producer('shared');
    const first = producer.publish('x', {}).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(6000);
    const second = producer.publish('x', {});
    await vi.advanceTimersByTimeAsync(4001);
    expect(await first).toMatchObject({
      message: expect.stringMatching(/10000 ms/u),
    });
    expect(backend.close).not.toHaveBeenCalled();
    expect(backend.createRuntime).toHaveBeenCalledTimes(1);
    gate.resolve();
    await vi.advanceTimersByTimeAsync(0);
    await expect(second).resolves.toEqual({ jobId: 'prepared-id' });
    expect(backend.add).toHaveBeenCalledTimes(1);
    await queue.shutdown();
  } finally {
    vi.useRealTimers();
  }
});
