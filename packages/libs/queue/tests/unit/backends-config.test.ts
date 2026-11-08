import { describe, expect, it } from 'vitest';
import { validateQueueConfig } from '../../src/validate-config.js';
import {
  selectQueueConfig,
  resolveQueueConfig,
  BUILT_IN_MEMORY_KEY,
} from '../../src/config.js';
import { queueIdentity } from '../../src/naming.js';

describe('queue backend configuration structure', () => {
  const local = { adapter: 'inMemory' };
  it.each([undefined, {}, { backends: {} }, { backends: { first: local } }])(
    'keeps built-in local selection without default: %j',
    (config) => {
      expect(selectQueueConfig(config, undefined).key).toBe(
        BUILT_IN_MEMORY_KEY,
      );
      expect(selectQueueConfig(config, 'missing').key).toBe(
        BUILT_IN_MEMORY_KEY,
      );
    },
  );
  it('selects default and explicit names with multiple entries of the same adapter and no inheritance', () => {
    const config = {
      default: 'first',
      backends: {
        first: { ...local, namespace: 'first', concurrency: 4 },
        second: local,
      },
    };
    expect(selectQueueConfig(config, undefined).key).toBe('first');
    expect(selectQueueConfig(config, 'missing').key).toBe('first');
    expect(selectQueueConfig(config, 'second').key).toBe('second');
    const selection = selectQueueConfig(config, 'second');
    const resolved = resolveQueueConfig(selection, {
      appName: 'app',
      storagePath: '/storage/queue',
    });
    expect(resolved).toMatchObject({
      key: 'second',
      namespace: 'app',
      concurrency: 1,
    });
    expect(selectQueueConfig(config, 'backends.second').key).toBe('first');
    expect(selectQueueConfig(config, 'toString').key).toBe('first');
  });
  it.each([
    null,
    [],
    false,
    1,
    '',
    { backends: null },
    { backends: [] },
    { backends: 'secret' },
    { backends: 1 },
    { default: null },
    { default: 1 },
    { default: [] },
    { default: '' },
    { default: 'missing', backends: { local } },
    ...[null, [], false, 1, '', 'memory', {}, { adapter: 1 }].map((entry) => ({
      backends: { unused: entry },
    })),
  ])(
    'rejects invalid structure before selecting even a valid named backend: %j',
    (value) => {
      expect(() => validateQueueConfig(value)).toThrow();
    },
  );
  it.each([
    { local },
    { default: 'local', local },
    { default: 'new', backends: { new: local }, unused: local },
    { default: 'local', backends: { local }, local },
    { backends: { local }, unused: local },
    { unknown: 42 },
  ])('rejects all legacy and mixed top-level entries: %j', (value) => {
    expect(() => validateQueueConfig(value)).toThrow(
      /old configuration format/u,
    );
    expect(() => validateQueueConfig(value)).toThrow(/queue.backends/u);
  });
  it('does not disclose values from malformed defaults or connections', () => {
    for (const value of [
      { default: 'https://user:password@host' },
      { unused: { adapter: 'redis', connection: { password: 'top-secret' } } },
      { backends: { invalid: 'top-secret' } },
    ]) {
      try {
        validateQueueConfig(value);
        throw new Error('Expected rejection');
      } catch (error) {
        expect(String(error)).not.toMatch(/password@|top-secret/u);
      }
    }
  });
  it('preserves the physical namespace and storage defaults after wrapping an unchanged entry', () => {
    const entry = { ...local, namespace: 'existing-app' };
    const selected = selectQueueConfig(
      { default: 'renamed', backends: { renamed: entry } },
      undefined,
    );
    const defaults = { appName: 'app', storagePath: '/storage/queue' };
    const resolved = resolveQueueConfig(selected, defaults);
    const direct = resolveQueueConfig(
      { key: 'renamed', entry: entry },
      defaults,
    );
    expect(resolved).toEqual(direct);
    expect(queueIdentity(resolved.namespace, 'existing-queue')).toBe(
      queueIdentity('existing-app', 'existing-queue'),
    );
  });
});
