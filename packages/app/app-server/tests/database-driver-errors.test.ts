// db-test-portability: sqlite-only — the driver loading under test is configured with SQLite
import { beforeEach, expect, it, vi } from 'vitest';
import { resolveDatabaseConfig } from '../src/database/resolve-config.js';

const loads = vi.hoisted(() => ({ mysql: vi.fn(), sqlite: vi.fn() }));
vi.mock('@nocobase/db-mysql', async () => {
  await loads.mysql();
  return { default: { dialect: 'mysql' } };
});
vi.mock('@nocobase/db-sqlite', async () => {
  await loads.sqlite();
  return { default: { dialect: 'sqlite' } };
});

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
});

it('loads only configured dialects, deduplicates them and preserves the input', async () => {
  const config = Object.freeze({
    metadataStore: 'collections',
    connections: Object.freeze({
      reporting: Object.freeze({ dialect: 'mysql', database: 'reports' }),
      archive: Object.freeze({ dialect: 'mysql', database: 'archive' }),
    }),
  });
  const resolved = await resolveDatabaseConfig(config);
  expect(loads.mysql).toHaveBeenCalledOnce();
  expect(loads.sqlite).not.toHaveBeenCalled();
  expect(resolved.drivers.mysql).toEqual({ dialect: 'mysql' });
  expect(resolved.connections).toEqual(config.connections);
  expect(resolved.metadataStore).toBe('collections');
  expect(config).not.toHaveProperty('drivers');
  await resolveDatabaseConfig(resolved);
  expect(loads.mysql).toHaveBeenCalledOnce();
});

it('preserves explicit factories and per-connection drivers without importing packages', async () => {
  const custom = { dialect: 'mysql' };
  const factory = Object.assign(() => ({}), {
    dialect: 'sqlite',
    driver: { dialect: 'sqlite' },
  });
  const resolved = await resolveDatabaseConfig({
    drivers: { sqlite: factory },
    connections: {
      main: { dialect: 'sqlite' },
      reporting: { dialect: 'mysql', databaseDriver: custom },
    },
  });
  expect(resolved.drivers.sqlite).toBe(factory);
  expect(resolved.connections.reporting.databaseDriver).toBe(custom);
  expect(loads.mysql).not.toHaveBeenCalled();
  expect(loads.sqlite).not.toHaveBeenCalled();
});

it('does not introduce conflicts between a per-connection driver and official defaults', async () => {
  const custom = { dialect: 'mysql' };
  const resolved = await resolveDatabaseConfig({
    connections: {
      official: { dialect: 'mysql' },
      custom: { dialect: 'mysql', databaseDriver: custom },
    },
  });
  expect(resolved.drivers.mysql).toBeUndefined();
  expect(resolved.connections.custom.databaseDriver).toBe(custom);
  expect(resolved.connections.official).toHaveProperty(
    'databaseDriver.dialect',
    'mysql',
  );
  await expect(resolveDatabaseConfig(resolved)).resolves.toEqual(resolved);
});

it('validates explicit conflicts and unknown dialects without fallback imports', async () => {
  await expect(
    resolveDatabaseConfig({
      drivers: { mysql: { dialect: 'mysql' } },
      connections: {
        reporting: { dialect: 'mysql', databaseDriver: { dialect: 'mysql' } },
      },
    }),
  ).rejects.toThrow('reporting');
  for (const dialect of [
    'custom',
    'constructor',
    '__proto__',
    '../../untrusted',
  ]) {
    await expect(
      resolveDatabaseConfig({ connections: { reporting: { dialect } } }),
    ).rejects.toThrow('Register a custom driver');
  }
  expect(loads.mysql).not.toHaveBeenCalled();
});

it('skips loading when the database is disabled', async () => {
  await resolveDatabaseConfig({
    default: 'none',
    connections: { main: { dialect: 'mysql' } },
  });
  expect(loads.mysql).not.toHaveBeenCalled();
});
