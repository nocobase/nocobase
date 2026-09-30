import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createRedisBackend } from 'bullmq';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createQueueService,
  type QueueConfig,
  type QueueLogger,
  type QueueService,
} from '../../src/index.js';
import { selectQueueConfig, resolveQueueConfig } from '../../src/config.js';
import { silentLogger } from '../contract/queue-contract.js';

const storagePath = mkdtempSync(path.join(tmpdir(), 'nocobase-queue-config-'));
const services: QueueService[] = [];

afterEach(async () => {
  await Promise.allSettled(services.splice(0).map((s) => s.shutdown()));
});

function service(
  config: QueueConfig | undefined,
  overrides: { logger?: QueueLogger; onFallback?: () => void } = {},
): QueueService {
  const created = createQueueService(config, {
    appName: 'config-app',
    storagePath,
    logger: silentLogger,
    ...overrides,
  });
  services.push(created);
  return created;
}

function recordingLogger(): QueueLogger & { warnings: string[] } {
  const warnings: string[] = [];
  return {
    warnings,
    debug: () => undefined,
    info: () => undefined,
    warn: (_bindings, message) => warnings.push(message),
    error: () => undefined,
  };
}

describe('configuration key selection', () => {
  const config: QueueConfig = {
    default: 'memory',
    memory: { adapter: 'inMemory' },
    background: { adapter: 'inMemory', namespace: 'background' },
  };

  it('uses the named key, then default, then the built-in memory configuration', () => {
    expect(selectQueueConfig(config, 'background').key).toBe('background');
    expect(selectQueueConfig(config, undefined).key).toBe('memory');
    expect(selectQueueConfig(config, 'default').key).toBe('memory');
    expect(selectQueueConfig(config, 'missing').key).toBe('memory');
    expect(selectQueueConfig(undefined, 'anything').entry).toBeUndefined();
    expect(() => selectQueueConfig({ default: 'missing' }, undefined)).toThrow(
      /not a queue configuration/u,
    );
    expect(() => selectQueueConfig({ default: 'default' }, undefined)).toThrow(
      /not a queue configuration/u,
    );
  });

  it('leaves the connection to a registered backend factory', () => {
    const resolved = resolveQueueConfig(
      { key: 'pg', entry: { adapter: 'redis', queueBackend: 'postgres' } },
      { appName: 'crm', storagePath },
    );
    expect(resolved).toMatchObject({
      adapter: 'redis',
      queueBackend: 'postgres',
      connection: undefined,
    });
    // Naming BullMQ's own Redis backend is the same as naming none.
    expect(
      resolveQueueConfig(
        {
          key: 'r',
          entry: { adapter: 'redis', queueBackend: 'redis', connection: {} },
        },
        { appName: 'crm', storagePath },
      ).queueBackend,
    ).toBeUndefined();
  });

  it('defaults the namespace to the application name and fills every default', () => {
    const resolved = resolveQueueConfig(
      { key: 'memory', entry: { adapter: 'inMemory' } },
      { appName: 'crm', storagePath },
    );
    expect(resolved).toMatchObject({
      namespace: 'crm',
      concurrency: 1,
      rateLimit: undefined,
      persistencePath: storagePath,
      setupTimeoutMs: 10_000,
      shutdownTimeoutMs: 30_000,
      cancellationGraceMs: 5000,
      jobDefaults: {
        attempts: 1,
        removeOnComplete: { count: 1000 },
        removeOnFail: { age: 604_800 },
      },
    });
  });

  it.each([
    [{ adapter: 'inMemory', connection: {} }, /takes no connection/u],
    [{ adapter: 'redis' }, /needs a redis connection/u],
    [
      { adapter: 'redis', connection: {}, persistence: { path: '/x' } },
      /only inMemory/u,
    ],
    [{ adapter: 'inMemory', concurrency: 0 }, /positive integer/u],
    [{ adapter: 'inMemory', namespace: '  ' }, /namespace/u],
    [{ adapter: 'inMemory', rateLimit: { max: 1 } }, /rateLimit.duration/u],
    [{ adapter: 'inMemory', backoff: { type: 'linear' } }, /not supported/u],
    [{ adapter: 'inMemory', timeout: 1 }, /does not accept "timeout"/u],
    [{ connection: {} }, /needs an adapter/u],
    [{ adapter: 'custom' }, /needs an adapter/u],
    [
      { adapter: 'inMemory', queueBackend: 'postgres' },
      /takes no queueBackend/u,
    ],
    [{ adapter: 'redis', queueBackend: '' }, /must name a backend factory/u],
  ])('rejects %j', (entry, error) => {
    expect(() =>
      resolveQueueConfig(
        { key: 'bad', entry: entry as never },
        { appName: 'crm', storagePath },
      ),
    ).toThrow(error);
  });
});

describe('queue service configuration', () => {
  it('reports the built-in memory configuration once and not for an explicit memory key', async () => {
    const onFallback = vi.fn();
    const fallback = service(undefined, { onFallback });
    fallback.producer('a');
    fallback.consumer('b');
    await fallback.setup();
    expect(onFallback).toHaveBeenCalledTimes(1);

    const explicit = vi.fn();
    const memory = service(
      { default: 'memory', memory: { adapter: 'inMemory' } },
      { onFallback: explicit },
    );
    memory.producer('a');
    await memory.setup();
    expect(explicit).not.toHaveBeenCalled();
  });

  it('ignores the former connections/worker/jobs section with one warning', async () => {
    const logger = recordingLogger();
    const onFallback = vi.fn();
    const legacy = service(
      {
        default: 'sync',
        connections: { sync: { driver: 'sync' } },
        worker: { concurrency: 1 },
        jobs: { locations: [] },
      } as unknown as QueueConfig,
      { logger, onFallback },
    );
    legacy.producer('legacy');
    await legacy.setup();
    await legacy.producer('legacy').publish('x', {});
    expect(logger.warnings).toHaveLength(1);
    expect(logger.warnings[0]).toMatch(/removed connections\/worker\/jobs/u);
    expect(onFallback).toHaveBeenCalledTimes(1);
  });

  it('keeps a default that names a current key next to legacy fields', async () => {
    const logger = recordingLogger();
    const onFallback = vi.fn();
    const mixed = service(
      {
        default: 'memory',
        memory: { adapter: 'inMemory' },
        worker: {},
      } as unknown as QueueConfig,
      { logger, onFallback },
    );
    mixed.producer('mixed');
    await mixed.setup();
    expect(logger.warnings).toHaveLength(1);
    expect(onFallback).not.toHaveBeenCalled();
  });

  it('validates every key and backend name at setup', async () => {
    const unknownBackend = service({
      default: 'memory',
      memory: { adapter: 'inMemory' },
      other: { adapter: 'redis', queueBackend: 'custom', connection: {} },
    });
    await expect(unknownBackend.setup()).rejects.toThrow(/not registered/u);

    const nonObject = service({
      memory: 'inMemory' as never,
    });
    await expect(nonObject.setup()).rejects.toThrow(/configuration object/u);
  });

  it('keeps registration names unique per service', () => {
    const first = service(undefined);
    const second = service(undefined);
    first.registerBackend('custom', createRedisBackend);
    expect(() => first.registerBackend('custom', createRedisBackend)).toThrow(
      /already registered/u,
    );
    expect(() => first.registerBackend('redis', createRedisBackend)).toThrow(
      /already registered/u,
    );
    expect(() =>
      second.registerBackend('custom', createRedisBackend),
    ).not.toThrow();
  });

  it('rejects registration once setup started and entry points after shutdown', async () => {
    const queue = service(undefined);
    await queue.setup();
    expect(() => queue.registerBackend('late', createRedisBackend)).toThrow(
      /before the queue service is set up/u,
    );
    await queue.shutdown();
    expect(() => queue.producer('new')).toThrow(/shut down/u);
  });

  it('rejects invalid queue names', () => {
    const queue = service(undefined);
    expect(() => queue.producer('')).toThrow(/queue name/u);
    expect(() => queue.producer('a\nb')).toThrow(/queue name/u);
    expect(() => queue.producer('x'.repeat(257))).toThrow(/queue name/u);
    expect(() => queue.producer(' padded ')).not.toThrow();
  });
});
