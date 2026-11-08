import { describe, expect, it } from 'vitest';
import { resolveConcurrencyConfig } from '../../config/resolve.js';
import { ManagedConcurrencyService } from '../../server/services/concurrency.js';

describe('concurrency backend configuration structure', () => {
  const local = { adapter: 'mutex' };
  it.each([undefined, {}, { backends: {} }, { backends: { first: local } }])(
    'does not auto-select a backend without default: %j',
    (value) => {
      const snapshot = resolveConcurrencyConfig(value, 'app');
      expect(snapshot.defaultKey).toBe('');
      expect(snapshot.entries.get('')?.namespace).toBe('app');
    },
  );
  it.each([
    { local },
    { default: 'local', local },
    { default: 'new', backends: { new: local }, unused: local },
    { default: 'local', backends: { local }, local },
    { backends: { local }, unused: local },
    { unknown: 42 },
  ])('rejects every legacy or mixed entry: %j', (value) => {
    expect(() => resolveConcurrencyConfig(value, 'app')).toThrow(
      /old configuration format/u,
    );
    expect(() => resolveConcurrencyConfig(value, 'app')).toThrow(
      /concurrency.backends/u,
    );
  });
  it.each([
    { backends: null },
    { backends: [] },
    { backends: '' },
    { backends: 1 },
    ...[null, [], false, 1, '', {}, { adapter: 1 }].map((entry) => ({
      backends: { unused: entry },
    })),
    { default: 'missing', backends: { local } },
    { default: [] },
  ])('rejects invalid nesting: %j', (value) => {
    expect(() => resolveConcurrencyConfig(value, 'app')).toThrow();
  });
  it('preserves strict explicit selection, independent defaults and local lock identity', async () => {
    const service = new ManagedConcurrencyService({ appName: 'app' });
    service.boot({
      default: 'first',
      backends: {
        first: { adapter: 'mutex', namespace: 'existing-app', ttl: 30000 },
        second: { adapter: 'mutex' },
      },
    });
    try {
      await service.start();
      const manager = await service.getManager('first');
      expect(await service.getManager()).toBe(manager);
      await expect(service.getManager('missing')).rejects.toThrow();
      const snapshot = resolveConcurrencyConfig(
        { backends: { second: local } },
        'app',
      );
      expect(snapshot.entries.get('second')).toEqual({
        key: 'second',
        adapter: 'mutex',
        namespace: 'app',
      });
      const held = await (await manager.createLock('existing-resource')).lock();
      try {
        expect(
          await (
            await manager.createSynchronous('existing-resource')
          ).tryRun(() => 'wrong'),
        ).toEqual({ acquired: false });
      } finally {
        await held.release();
      }
    } finally {
      await service.shutdown();
    }
  });
});
