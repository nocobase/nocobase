import { afterEach, describe, expect, it, vi } from 'vitest';
import { SnowflakeIdGenerator } from '@nocobase/snowflake';
import {
  AppIdGenerator,
  ID_GENERATOR_SHUTDOWN_TIMEOUT_MS,
  type AppSnowflakeConfig,
  type ManagedIdGenerator,
} from '../src/id-generator/index.js';

afterEach(() => vi.useRealTimers());

function runtime(initialize: () => Promise<void> = async () => {}) {
  const ids = new SnowflakeIdGenerator({ workerId: 7 });
  return {
    initialize: vi.fn(initialize),
    shutdown: vi.fn(async () => {}),
    generate: vi.fn(() => ids.generate()),
    generateString: () => ids.generateString(),
  } satisfies ManagedIdGenerator;
}

describe('host ID generator lifecycle', () => {
  it('preserves manual synchronous generation and the original sequence', async () => {
    const ids = new AppIdGenerator({ workerId: 0 });
    const first = ids.generate();
    await ids.initialize();
    const second = Number(ids.generateString());
    expect(second).toBeGreaterThan(first);
    expect(
      new SnowflakeIdGenerator({ workerId: 0 }).parse(second).workerId,
    ).toBe(0);
    const stop = ids.shutdown();
    expect(ids.shutdown()).toBe(stop);
    expect(() => ids.generate()).toThrow('permanently closed');
    await stop;
  });

  it('constructs once, shares initialization, and does not open generation early', async () => {
    let ready!: () => void;
    const managed = runtime(
      () =>
        new Promise<void>((resolve) => {
          ready = resolve;
        }),
    );
    const factory = vi.fn(() => managed);
    const ids = new AppIdGenerator({ mode: 'auto' });
    ids.registerFactory(factory);
    expect(factory).not.toHaveBeenCalled();
    expect(() => ids.generateString()).toThrow('not initialized');
    const start = ids.initialize();
    expect(ids.initialize()).toBe(start);
    await Promise.resolve();
    expect(factory).toHaveBeenCalledOnce();
    expect(() => ids.generate()).toThrow('not initialized');
    ready();
    await start;
    const first = ids.generate();
    expect(Number(ids.generateString())).toBeGreaterThan(first);
    expect(managed.generate).toHaveBeenCalledTimes(2);
    const stop = ids.shutdown();
    expect(managed.shutdown).toHaveBeenCalledOnce();
    expect(() => ids.generate()).toThrow('permanently closed');
    await stop;
  });

  it('retains initialization failure without reconstruction and cleans up partial initialization', async () => {
    const managed = runtime(async () => {
      throw new Error('allocation unknown');
    });
    const factory = vi.fn(() => managed);
    const ids = new AppIdGenerator({ mode: 'auto' });
    ids.registerFactory(factory);
    const start = ids.initialize();
    await expect(start).rejects.toThrow('allocation unknown');
    expect(ids.initialize()).toBe(start);
    expect(factory).toHaveBeenCalledOnce();
    expect(() => ids.generate()).toThrow('not initialized');
    await ids.shutdown();
    expect(managed.shutdown).toHaveBeenCalledOnce();
  });

  it('closes during pending initialization and discards late success', async () => {
    let ready!: () => void;
    const managed = runtime(
      () =>
        new Promise<void>((resolve) => {
          ready = resolve;
        }),
    );
    const ids = new AppIdGenerator({ mode: 'auto' });
    ids.registerFactory(() => managed);
    const start = ids.initialize();
    const failed = await expect(start).rejects.toThrow('permanently closed');
    await Promise.resolve();
    await ids.shutdown();
    expect(managed.shutdown).toHaveBeenCalledOnce();
    ready();
    await failed;
    expect(() => ids.generate()).toThrow('permanently closed');
  });

  it('does not create a runtime when shutdown precedes initialization', async () => {
    const factory = vi.fn(() => runtime());
    const ids = new AppIdGenerator({ mode: 'auto' });
    ids.registerFactory(factory);
    await ids.shutdown();
    await expect(ids.initialize()).rejects.toThrow('permanently closed');
    expect(factory).not.toHaveBeenCalled();
  });

  it('bounds a noncompliant adapter shutdown and keeps generation closed', async () => {
    vi.useFakeTimers();
    const managed = runtime();
    managed.shutdown.mockImplementation(() => new Promise<void>(() => {}));
    const ids = new AppIdGenerator({ mode: 'auto' });
    ids.registerFactory(() => managed);
    await ids.initialize();
    const stop = ids.shutdown();
    const failed = await expect(stop).rejects.toThrow('return is unknown');
    await vi.advanceTimersByTimeAsync(ID_GENERATOR_SHUTDOWN_TIMEOUT_MS);
    await failed;
    expect(ids.shutdown()).toBe(stop);
    expect(() => ids.generateString()).toThrow('permanently closed');
  });

  it.each([
    { mode: 'auto', workerId: 0 },
    { mode: 'auto', epoch: 1605024000 },
    { mode: 'invalid' },
  ])(
    'rejects invalid config %j without calling the factory',
    async (config) => {
      const ids = new AppIdGenerator(config as AppSnowflakeConfig);
      const factory = vi.fn(() => runtime());
      ids.registerFactory(factory);
      await expect(ids.initialize()).rejects.toThrow(/forbids|mode must/);
      expect(factory).not.toHaveBeenCalled();
    },
  );

  it('requires an auto factory and refuses duplicate or late registration', async () => {
    const ids = new AppIdGenerator({ mode: 'auto' });
    await expect(ids.initialize()).rejects.toThrow(
      'requires an ID generator factory',
    );
    expect(() => ids.registerFactory(() => runtime())).toThrow(
      'once before initialization',
    );
    const other = new AppIdGenerator({ mode: 'auto' });
    other.registerFactory(() => runtime());
    expect(() => other.registerFactory(() => runtime())).toThrow(
      'once before initialization',
    );
  });
});
