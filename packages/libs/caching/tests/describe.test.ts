import { describe, expect, it } from 'vitest';
import { createCaching, MemoryCacheProvider } from '../src/index.js';

describe('Caching.describe()', () => {
  it('reports the built-in memory provider as local', () => {
    const caching = createCaching();
    expect(caching.describe()).toEqual({
      default: 'memory',
      adapter: 'memory',
      sharing: 'local',
      registered: true,
      backends: [
        {
          name: 'memory',
          adapter: 'memory',
          sharing: 'local',
          registered: true,
        },
      ],
      selections: [],
    });
  });

  it('reports the sharing a driver declares, unknown when it declares none, and unregistered drivers', () => {
    const caching = createCaching({
      default: 'shared',
      providers: {
        shared: {
          driver: 'redis',
          connection: { host: 'cache.internal', password: 'hunter2' },
        },
        custom: { driver: 'custom' },
        missing: { driver: 'absent', token: 'secret-token' },
        memory: { driver: 'memory' },
      },
    });
    caching.registerDriver({
      name: 'redis',
      sharing: 'shared',
      createProvider: () => new MemoryCacheProvider(),
    });
    caching.registerDriver({
      name: 'custom',
      createProvider: () => new MemoryCacheProvider(),
    });
    caching.getCache({ namespace: 'sessions' });
    caching.getCache({ namespace: 'local-only', provider: 'memory' });
    caching.getCounter({ namespace: 'counters', provider: 'shared' });

    const description = caching.describe();

    expect(description).toEqual({
      default: 'shared',
      adapter: 'redis',
      sharing: 'shared',
      registered: true,
      backends: [
        {
          name: 'shared',
          adapter: 'redis',
          sharing: 'shared',
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
        {
          name: 'memory',
          adapter: 'memory',
          sharing: 'local',
          registered: true,
        },
      ],
      selections: [{ consumer: 'local-only', backend: 'memory' }],
    });
    const json = JSON.stringify(description);
    for (const secret of ['cache.internal', 'hunter2', 'secret-token'])
      expect(json).not.toContain(secret);
  });

  it('keeps every provider one namespace selected, ignores the default, and bounds what it records', () => {
    const caching = createCaching({
      default: 'memory',
      providers: {
        memory: { driver: 'memory' },
        other: { driver: 'memory' },
        third: { driver: 'memory' },
      },
    });
    caching.getCache({ namespace: 'mixed', provider: 'other' });
    caching.getBloomFilter({ namespace: 'mixed', provider: 'third' });
    caching.getCounter({ namespace: 'mixed', provider: 'memory' });
    caching.getCache({ namespace: 'mixed', provider: 'other' });
    for (let index = 0; index < 100; index++)
      caching.getCache({ namespace: `dynamic-${index}`, provider: 'other' });

    const { selections } = caching.describe();

    const other = selections.filter(({ backend }) => backend === 'other');
    expect(other[0]).toEqual({ consumer: 'mixed', backend: 'other' });
    expect(other.length).toBe(20);
    expect(new Set(other.map(({ consumer }) => consumer)).size).toBe(20);
    expect(selections.filter(({ backend }) => backend !== 'other')).toEqual([
      { consumer: 'mixed', backend: 'third' },
    ]);
  });

  it('does not record a selection whose provider cannot be created', () => {
    const caching = createCaching();
    expect(() =>
      caching.getCache({ namespace: 'broken', provider: 'absent' }),
    ).toThrow('not configured');
    expect(caching.describe().selections).toEqual([]);
  });

  it('rejects an undeclared sharing value', () => {
    expect(() =>
      createCaching().registerDriver({
        name: 'odd',
        sharing: 'everywhere' as 'shared',
        createProvider: () => new MemoryCacheProvider(),
      }),
    ).toThrow('unknown sharing');
  });
});
