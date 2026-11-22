import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect, it } from 'vitest';

import {
  createQueueService,
  type QueueConfig,
  type QueueImplementation,
  type QueueService,
} from '../../src/index.js';
import { silentLogger } from '../contract/queue-contract.js';

let storage: string;
const services: QueueService[] = [];
beforeEach(async () => {
  storage = await mkdtemp(path.join(os.tmpdir(), 'queue-describe-'));
});
afterEach(async () => {
  await Promise.allSettled(
    services.splice(0).map((service) => service.shutdown()),
  );
  await rm(storage, { recursive: true, force: true });
});
function service(config: unknown) {
  const queue = createQueueService(config as QueueConfig, {
    appName: 'describe',
    storagePath: storage,
    logger: silentLogger,
  });
  services.push(queue);
  return queue;
}
function implementation(sharing?: 'local' | 'shared'): QueueImplementation {
  return {
    ...(sharing ? { sharing } : {}),
    validateConfig: () => undefined,
    createRuntime: () => {
      throw new Error('not opened in these tests');
    },
  };
}

it('reports the built-in memory backend when queue.default is unset', () => {
  expect(service(undefined).describe?.()).toEqual({
    default: null,
    adapter: 'inMemory',
    sharing: 'local',
    registered: true,
    backends: [],
    selections: [],
  });
});

it('reports configured backends by name and adapter, and queues bound to another backend', () => {
  const queue = service({
    default: 'redis',
    backends: {
      redis: {
        adapter: 'redis',
        connection: { host: 'queue.internal', password: 'hunter2' },
      },
      memory: { adapter: 'inMemory' },
      custom: { adapter: 'custom' },
      missing: { adapter: 'absent', connection: { token: 'secret-token' } },
    },
  });
  queue.registerImplementation('redis', implementation('shared'));
  queue.registerImplementation('custom', implementation());
  queue.producer('notifications');
  queue.producer('local-work', 'memory');

  const description = queue.describe?.();

  expect(description).toEqual({
    default: 'redis',
    adapter: 'redis',
    sharing: 'shared',
    registered: true,
    backends: [
      { name: 'redis', adapter: 'redis', sharing: 'shared', registered: true },
      {
        name: 'memory',
        adapter: 'inMemory',
        sharing: 'local',
        registered: true,
      },
      {
        name: 'custom',
        adapter: 'custom',
        sharing: 'unknown',
        registered: true,
      },
      {
        name: 'missing',
        adapter: 'absent',
        sharing: 'unknown',
        registered: false,
      },
    ],
    selections: [{ consumer: 'local-work', backend: 'memory' }],
  });
  const json = JSON.stringify(description);
  for (const secret of ['queue.internal', 'hunter2', 'secret-token'])
    expect(json).not.toContain(secret);
});

it('rejects an undeclared sharing value', () => {
  expect(() =>
    service(undefined).registerImplementation('odd', {
      ...implementation(),
      sharing: 'everywhere' as 'shared',
    }),
  ).toThrow('unknown sharing');
});
