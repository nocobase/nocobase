import { describe, expect, it } from 'vitest';
import { validateJobsConfig } from '../../src/validate-config.js';
import {
  selectJobsConfig,
  resolveJobsConfig,
  BUILT_IN_MEMORY_KEY,
} from '../../src/config.js';

describe('jobs backend configuration structure', () => {
  const local = { adapter: 'memory' };
  it.each([undefined, {}, { backends: {} }, { backends: { first: local } }])(
    'keeps built-in local selection without default: %j',
    (config) => {
      expect(selectJobsConfig(config, undefined).key).toBe(BUILT_IN_MEMORY_KEY);
      expect(selectJobsConfig(config, 'missing').key).toBe(BUILT_IN_MEMORY_KEY);
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
    expect(selectJobsConfig(config, undefined).key).toBe('first');
    expect(selectJobsConfig(config, 'missing').key).toBe('first');
    expect(selectJobsConfig(config, 'second').key).toBe('second');
    const selection = selectJobsConfig(config, 'second');
    const resolved = resolveJobsConfig(selection, 'scope', {
      appName: 'app',
      storagePath: '/storage/jobs',
    });
    expect(resolved).toMatchObject({
      key: 'second',
      namespace: 'app',
      concurrency: 1,
    });
    expect(selectJobsConfig(config, 'backends.second').key).toBe('first');
    expect(selectJobsConfig(config, 'toString').key).toBe('first');
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
      expect(() => validateJobsConfig(value)).toThrow();
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
    expect(() => validateJobsConfig(value)).toThrow(
      /old configuration format/u,
    );
    expect(() => validateJobsConfig(value)).toThrow(/jobs.backends/u);
  });
  it('does not disclose values from malformed defaults or connections', () => {
    for (const value of [
      { default: 'https://user:password@host' },
      { unused: { adapter: 'redis', connection: { password: 'top-secret' } } },
      { backends: { invalid: 'top-secret' } },
    ]) {
      try {
        validateJobsConfig(value);
        throw new Error('Expected rejection');
      } catch (error) {
        expect(String(error)).not.toMatch(/password@|top-secret/u);
      }
    }
  });
  it('preserves the physical namespace and storage defaults after wrapping an unchanged entry', () => {
    const entry = { ...local, namespace: 'existing-app' };
    const selected = selectJobsConfig(
      { default: 'renamed', backends: { renamed: entry } },
      undefined,
    );
    const defaults = { appName: 'app', storagePath: '/storage/jobs' };
    const resolved = resolveJobsConfig(selected, 'existing-scope', defaults);
    const direct = resolveJobsConfig(
      { key: 'renamed', config: entry },
      'existing-scope',
      defaults,
    );
    expect(resolved).toEqual(direct);
    expect(resolved.scope).toBe('existing-scope');
  });
});
