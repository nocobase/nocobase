import { describe, expect, it, vi } from 'vitest';
import { ConcurrentConfigurationError } from '@nocobase/concurrency';
import {
  resolveConcurrencyConfig,
  validateConcurrencyConfig,
} from '../../config/resolve.js';
import { ManagedConcurrencyService } from '../../server/services/concurrency.js';

describe('concurrency pure configuration', () => {
  it('normalizes absent/default/explicit memory without creating a backend', () => {
    const implicit = resolveConcurrencyConfig(undefined, 'crm');
    expect(implicit.entries.get(implicit.defaultKey)).toEqual({
      key: 'built-in-memory',
      adapter: 'mutex',
      namespace: 'crm',
      ttl: 30000,
      operationTimeoutMs: 5000,
      cleanupTimeoutMs: 5000,
      shutdownTimeoutMs: 30000,
    });
    const explicit = resolveConcurrencyConfig(
      { default: 'memory', memory: { adapter: 'mutex' } },
      'crm',
    );
    expect(explicit.defaultKey).toBe('memory');
    expect(explicit.entries.get('memory')?.namespace).toBe('crm');
  });
  it.each([
    null,
    [],
    '',
    1,
    false,
    { default: null },
    { default: '' },
    { default: 'missing' },
    { default: 'default' },
    { default: 'memory', memory: [] },
    { default: 'memory', memory: 'mutex' },
    { 'bad.name': { adapter: 'mutex' } },
    { memory: {} },
    { memory: { adapter: '' } },
    { memory: { adapter: 'mutex', namespace: null } },
    { memory: { adapter: 'mutex', connection: undefined } },
    ...[
      'timeoutMs',
      'autoRenew',
      'capabilities',
      'owner',
      'permits',
      'acquireTimeoutMs',
      'session',
    ].map((field) => ({ memory: { adapter: 'mutex', [field]: false } })),
    ...[0, -1, NaN, Infinity, '30000', 2147483648].map((ttl) => ({
      memory: { adapter: 'mutex', ttl },
    })),
  ])('rejects malformed or obsolete configuration %#', (value) => {
    expect(() => resolveConcurrencyConfig(value, 'crm')).toThrow(
      ConcurrentConfigurationError,
    );
  });
  it('reports path-only CLI validation without secret values', () => {
    const error = vi.fn();
    validateConcurrencyConfig(
      { default: 'secret-value' },
      { error, warning: vi.fn(), isUserProvided: () => true },
    );
    expect(error).toHaveBeenCalledWith(
      'default',
      'Must name an existing configuration.',
    );
    expect(JSON.stringify(error.mock.calls)).not.toContain('secret-value');
  });
  it('allows unused unknown adapters but validates their common fields', () => {
    expect(() =>
      resolveConcurrencyConfig(
        { remote: { adapter: 'future', connection: { password: 'secret' } } },
        'crm',
      ),
    ).not.toThrow();
    expect(() =>
      resolveConcurrencyConfig(
        { remote: { adapter: 'future', ttl: 0 } },
        'crm',
      ),
    ).toThrow();
    const service = new ManagedConcurrencyService({ appName: 'crm' });
    expect(() =>
      service.boot({ default: 'remote', remote: { adapter: 'future' } }),
    ).toThrow(ConcurrentConfigurationError);
  });
  it('validates every registered item at boot and deep-freezes independent snapshots', () => {
    const validate = vi.fn();
    const create = vi.fn();
    const config = {
      remote: { adapter: 'test', connection: { nested: { value: 1 } } },
    };
    const service = new ManagedConcurrencyService({ appName: 'crm' });
    service.registerImplementation('test', { validate, create });
    service.boot(config);
    expect(validate).toHaveBeenCalledOnce();
    const entry = validate.mock.calls[0]![0] as {
      connection: { nested: { value: number } };
    };
    config.remote.connection.nested.value = 2;
    expect(entry.connection.nested.value).toBe(1);
    expect(Object.isFrozen(entry.connection.nested)).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });
});
