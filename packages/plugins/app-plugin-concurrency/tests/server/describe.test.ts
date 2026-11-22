import { expect, it, vi } from 'vitest';
import { ConcurrentConfigurationError } from '@nocobase/concurrency';
import { ManagedConcurrencyService } from '../../server/services/concurrency.js';
import type {
  ConcurrencyImplementation,
  ConcurrencyInstance,
} from '../../server/index.js';

function implementation(
  sharing?: 'local' | 'shared',
): ConcurrencyImplementation {
  return {
    ...(sharing ? { sharing } : {}),
    validate: vi.fn(),
    create: (): ConcurrencyInstance => ({
      manager: {
        createLock: vi.fn(),
        createSynchronous: vi.fn(),
      } as unknown as ConcurrencyInstance['manager'],
      start: async () => {},
      shutdown: async () => {},
    }),
  };
}

it('reports the built-in mutex as local', () => {
  const service = new ManagedConcurrencyService({
    appName: 'app',
    nodeEnv: 'development',
  });
  service.boot({
    default: 'memory',
    backends: { memory: { adapter: 'mutex' } },
  });
  expect(service.describe()).toEqual({
    default: 'memory',
    adapter: 'mutex',
    sharing: 'local',
    registered: true,
    backends: [
      { name: 'memory', adapter: 'mutex', sharing: 'local', registered: true },
    ],
    selections: [],
  });
});

it('reports configured backends by name and adapter, and other backends callers used', async () => {
  const service = new ManagedConcurrencyService({
    appName: 'app',
    nodeEnv: 'development',
  });
  service.registerImplementation('redis', implementation('shared'));
  service.registerImplementation('custom', implementation());
  service.boot({
    default: 'shared',
    backends: {
      shared: {
        adapter: 'redis',
        connection: { host: 'locks.internal', password: 'hunter2' },
      },
      memory: { adapter: 'mutex' },
      custom: { adapter: 'custom' },
      missing: { adapter: 'absent', connection: { token: 'secret-token' } },
    },
  });
  await service.start();
  await service.getManager('memory');

  const description = service.describe();

  expect(description).toEqual({
    default: 'shared',
    adapter: 'redis',
    sharing: 'shared',
    registered: true,
    backends: [
      { name: 'shared', adapter: 'redis', sharing: 'shared', registered: true },
      { name: 'memory', adapter: 'mutex', sharing: 'local', registered: true },
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
    selections: [{ backend: 'memory' }],
  });
  const json = JSON.stringify(description);
  for (const secret of ['locks.internal', 'hunter2', 'secret-token'])
    expect(json).not.toContain(secret);
  await service.shutdown();
});

it('refuses to describe before boot and rejects an undeclared sharing value', () => {
  const service = new ManagedConcurrencyService({ appName: 'app' });
  expect(() => service.describe()).toThrow(ConcurrentConfigurationError);
  expect(() =>
    service.registerImplementation('odd', {
      ...implementation(),
      sharing: 'everywhere' as 'shared',
    }),
  ).toThrow(ConcurrentConfigurationError);
});
