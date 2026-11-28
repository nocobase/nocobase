import { expect, it, vi } from 'vitest';

import type { AuditEvent } from '../src/index.js';
import { AuditCoordinator } from '../src/service.js';

it('delivers in parallel, isolates mutation and failures, and closes every instance', async () => {
  const coordinator = new AuditCoordinator(vi.fn());
  const blocked = Promise.withResolvers<void>();
  const observed = Promise.withResolvers<AuditEvent>();
  const close = vi.fn();
  coordinator.registerDriver({
    name: 'test',
    createTransport: (_options, { name }) => ({
      close,
      write: async (event) => {
        if (name === 'slow') {
          (event.request as { data: string }).data = 'changed';
          await blocked.promise;
          throw new Error('write failure');
        }
        observed.resolve(event);
      },
    }),
  });
  await coordinator.start(
    {
      enabled: true,
      transports: { slow: { driver: 'test' }, parallel: { driver: 'test' } },
    },
    { storageDir: '/test/audit/storage' },
  );
  const writing = coordinator.record({
    requestId: 'example',
    action: 'save',
    resource: 'settings',
    operationName: 'Save settings',
    actor: { type: 'anonymous' },
    roles: [],
    targets: [],
    status: 200,
    outcome: 'success',
    durationMs: 1,
    occurredAt: '2026-01-01T00:00:00.000Z',
    request: { data: 'original' },
  });
  try {
    await expect(observed.promise).resolves.toMatchObject({
      request: { data: 'original' },
    });
    blocked.resolve();
    await writing;
  } finally {
    blocked.resolve();
    await coordinator.close();
  }
  expect(close).toHaveBeenCalledTimes(2);
});

it('refuses unknown active destinations and aborts timed-out writes', async () => {
  const report = vi.fn();
  const coordinator = new AuditCoordinator(report);
  const paths = { storageDir: '/test/audit/storage' };
  await expect(
    coordinator.start(
      {
        enabled: true,
        transports: { history: { driver: 'unknown' } },
      },
      paths,
    ),
  ).rejects.toThrow('unregistered driver');
  await coordinator.close();

  const unconfigured = new AuditCoordinator(report);
  await expect(unconfigured.start({ enabled: true }, paths)).resolves.toBe(
    false,
  );
  await unconfigured.close();

  const bounded = new AuditCoordinator(report);
  const abort = vi.fn();
  bounded.registerDriver({
    name: 'blocked',
    createTransport: () => ({
      write: (_event, { signal }) =>
        new Promise<void>((resolve) => {
          signal.addEventListener(
            'abort',
            () => {
              abort();
              resolve();
            },
            { once: true },
          );
        }),
    }),
  });
  await bounded.start(
    { enabled: true, transports: { slow: { driver: 'blocked' } } },
    paths,
  );
  await bounded.record({
    requestId: 'example',
    action: 'save',
    resource: 'settings',
    operationName: 'Save settings',
    actor: { type: 'anonymous' },
    roles: [],
    targets: [],
    status: 200,
    outcome: 'success',
    durationMs: 1,
    occurredAt: '2026-01-01T00:00:00.000Z',
  });
  expect(abort).toHaveBeenCalledOnce();
  expect(report).toHaveBeenCalledWith(
    'Audit destination write timed out.',
    'slow',
  );
  await bounded.close();
});
