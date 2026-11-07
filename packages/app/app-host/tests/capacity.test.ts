import { afterEach, expect, it, vi } from 'vitest';
import { AppConfig } from '@nocobase/app-server/config';
import type { AppWebSocketEvents, AppWebSocket } from '@nocobase/app-websocket';
import type { Logger } from '@nocobase/logging';
import { AppRuntimeRegistry } from '../dist/app-registry.js';
import { deploymentSignal } from '../dist/deployment-control.js';
import { activateForRequest } from '../dist/on-demand.js';
import type { IncomingMessage } from 'node:http';

const registries: AppRuntimeRegistry[] = [];
afterEach(async () => {
  await Promise.all(
    registries.splice(0).map((registry) => registry.destroyAll()),
  );
  vi.useRealTimers();
});
const MiB = 1024 ** 2;
/** Moves the clock past capacity admission's recent-use protection, leaving timers real. */
function laterThanRecentUse() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.now() + 61_000);
}
function registry(
  options: ConstructorParameters<typeof AppRuntimeRegistry>[0] = {},
) {
  const instance = new AppRuntimeRegistry({
    startEvictionLoop: false,
    sampleMemory: () => ({
      heapUsed: 100 * MiB,
      heapLimit: 1280 * MiB,
      rss: 200 * MiB,
      available: 8192 * MiB,
    }),
    resolveFactory: () => () => ({
      fetch: () => new Response('ok'),
      config: new AppConfig(),
    }),
    ...options,
  });
  registries.push(instance);
  return instance;
}

it('keeps sockets alive across three idle and dormancy cycles, counts only opens, and preserves callbacks', async () => {
  vi.useFakeTimers();
  const onOpen = vi.fn();
  const onClose = vi.fn();
  const hibernate = vi.fn();
  const host = registry({
    idleTtlMs: 100,
    dormancy: { hibernate, materialize: async () => {} },
    resolveFactory: () => () => ({
      fetch: () => new Response('ok'),
      config: new AppConfig(),
      websocket: () => ({ onOpen, onClose }),
    }),
  });
  await host.create('a', { resourcePolicy: { dormantAfterMs: 1000 } });
  const handle = await host.ensureActiveHandle('a');
  const events = (await handle.acceptWebSocket!(
    new Request('http://localhost/a/ws'),
  )) as AppWebSocketEvents;
  expect(host.requireSnapshot('a').activeConnections).toBe(0);
  const socket = { close: vi.fn() } as unknown as AppWebSocket;
  await events.onOpen!({ type: 'open' }, socket);
  for (let i = 0; i < 3; i++) {
    await vi.advanceTimersByTimeAsync(1001);
    await host.sweep();
    expect(host.requireSnapshot('a').activeConnections).toBe(1);
    expect(host.getMetrics().activations).toBe(1);
  }
  const close = {
    type: 'close',
    code: 1000,
    reason: '',
    wasClean: true,
  } as const;
  await events.onClose!(close, socket);
  await events.onClose!(close, socket);
  expect(host.requireSnapshot('a').activeConnections).toBe(0);
  expect(onOpen).toHaveBeenCalledOnce();
  expect(onClose).toHaveBeenCalledTimes(2);
  await host.sweep();
  expect(host.isActive('a')).toBe(true);
  await vi.advanceTimersByTimeAsync(101);
  await host.sweep();
  expect(host.isActive('a')).toBe(false);
  expect(hibernate).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(900);
  await host.sweep();
  expect(hibernate).toHaveBeenCalledOnce();
});

it('counts a safe dormancy stop once even before the idle stop deadline', async () => {
  vi.useFakeTimers();
  const hibernate = vi.fn();
  const host = registry({
    idleTtlMs: 10_000,
    dormancy: { hibernate, materialize: async () => {} },
  });
  await host.create('a', { resourcePolicy: { dormantAfterMs: 1000 } });
  await vi.advanceTimersByTimeAsync(1001);
  expect(await host.hibernateIdle()).toEqual(['a']);
  expect(host.isActive('a')).toBe(false);
  expect(host.getMetrics()).toMatchObject({
    evictions: 1,
    idleEvictions: 1,
    dormancies: 1,
  });
  expect(await host.hibernateIdle()).toEqual([]);
  expect(hibernate).toHaveBeenCalledOnce();
});

it('reserves starting Apps atomically, releases failed starts and evicts the effective LRU', async () => {
  let release!: () => void;
  const started = new Promise<void>((resolve) => {
    release = resolve;
  });
  const host = registry({
    maxActiveApps: 1,
    resolveFactory: (definition) => async () => {
      if (definition.id === 'slow') await started;
      if (definition.id === 'broken') throw new Error('broken');
      return { fetch: () => new Response('ok'), config: new AppConfig() };
    },
  });
  await host.register('slow');
  const slow = host.ensureActive('slow');
  await vi.waitFor(() => expect(host.isActivating('slow')).toBe(true));
  const other = host.create('other').catch((error: unknown) => error);
  release();
  await slow;
  expect(await other).toMatchObject({ code: 'APP_CAPACITY_EXCEEDED' });
  laterThanRecentUse();
  await expect(host.create('broken')).rejects.toThrow('broken');
  await host.ensureActive('other');
  expect(host.list().map((app) => app.id)).toEqual(['other']);

  const lru = registry({ maxActiveApps: 2 });
  await lru.create('a');
  await lru.create('b');
  laterThanRecentUse();
  lru.touch('a', Date.now());
  await lru.create('c');
  expect(
    lru
      .list()
      .map((app) => app.id)
      .sort(),
  ).toEqual(['a', 'c']);
  expect(lru.getMetrics().capacityEvictions).toBe(1);
});

it('returns an explicit capacity page and logs occupants without evicting connections or residents', async () => {
  const warn = vi.fn();
  const resident = registry({
    maxActiveApps: 1,
    logger: { warn, info: vi.fn(), debug: vi.fn() } as unknown as Logger,
  });
  await resident.create('resident', { tier: 'dedicated' });
  await resident.register('new');
  const request = {
    method: 'GET',
    headers: { accept: 'text/html', 'accept-language': 'en' },
  } as IncomingMessage;
  const response = await activateForRequest(resident, 'new', request, {
    holdMs: 100,
    waitMs: 100,
  });
  expect(response).toBeInstanceOf(Response);
  expect((response as Response).status).toBe(503);
  expect(await (response as Response).text()).toContain(
    'Preview capacity is full',
  );
  expect(resident.isActive('resident')).toBe(true);
  expect(warn).toHaveBeenCalledWith(
    expect.objectContaining({
      occupants: [
        expect.objectContaining({
          appId: 'resident',
          reasons: expect.arrayContaining(['resident']),
        }),
      ],
    }),
    expect.any(String),
  );
});

it('samples live heap on each admission, does not count records and recovers when pressure falls', async () => {
  let heapUsed = 100 * MiB;
  const sampleHeap = vi.fn(() => ({ heapUsed, heapLimit: 1280 * MiB }));
  const host = registry({ sampleHeap });
  for (let i = 0; i < 40; i++) await host.register(`record${i}`);
  await host.create('a');
  await host.create('b');
  await host.create('c');
  heapUsed = 800 * MiB;
  await expect(host.create('d')).rejects.toMatchObject({
    code: 'APP_CAPACITY_EXCEEDED',
  });
  expect(host.list()).toHaveLength(3);
  expect(host.health().capacity.memorySlots).toBeUndefined();
  heapUsed = 100 * MiB;
  await host.ensureActive('d');
  expect(host.list()).toHaveLength(4);
  expect(sampleHeap.mock.calls.length).toBeGreaterThan(4);
});

it('keeps system reserve and RSS budget separate from the heap and recovers without a restart', async () => {
  let available = 1200 * MiB;
  let rss = 400 * MiB;
  const host = registry({
    memoryBudget: { reserveMb: 1024, appMemoryMb: 256, rssBudgetMb: 1024 },
    sampleMemory: () => ({
      heapUsed: 100 * MiB,
      heapLimit: 2048 * MiB,
      rss,
      available,
    }),
  });
  await expect(host.create('a')).rejects.toMatchObject({
    code: 'APP_CAPACITY_EXCEEDED',
  });
  available = 8192 * MiB;
  rss = 900 * MiB;
  await expect(host.ensureActive('a')).rejects.toMatchObject({
    code: 'APP_CAPACITY_EXCEEDED',
  });
  rss = 400 * MiB;
  await host.ensureActive('a');
  expect(host.isActive('a')).toBe(true);
});

it('serializes cold starts, bounds the queue and cleans a late timed-out runtime without publishing it', async () => {
  vi.useFakeTimers();
  const gate = Promise.withResolvers<void>();
  const started = Promise.withResolvers<void>();
  const disposed = vi.fn();
  const factory = vi.fn((definition) => async (runtime) => {
    if (definition.id === 'slow') {
      runtime.registerDisposer('late-runtime', disposed);
      started.resolve();
      await gate.promise;
    }
    return { fetch: () => new Response('ok'), config: new AppConfig() };
  });
  const host = registry({
    memoryBudget: { startupTimeoutMs: 100, maxPendingStarts: 2 },
    resolveFactory: factory,
  });
  const slow = host.create('slow').catch((error: unknown) => error);
  await started.promise;
  const next = host.create('next');
  await expect(host.create('overflow')).rejects.toMatchObject({
    code: 'APP_CAPACITY_EXCEEDED',
  });
  expect(factory).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(100);
  expect(await slow).toMatchObject({
    message: expect.stringContaining('startup timed out'),
  });
  await next;
  expect(host.isActive('slow')).toBe(false);
  expect(host.isActive('next')).toBe(true);
  gate.resolve();
  await vi.advanceTimersByTimeAsync(0);
  expect(disposed).toHaveBeenCalledOnce();
  expect(host.isActive('slow')).toBe(false);
  await host.ensureActive('overflow');
});

it('pauses only unloaded revisions while resident traffic and same-revision restarts continue', async () => {
  const host = registry();
  await host.create('a');
  await host.register('new');
  host.pauseNewRevisions();
  await expect(host.ensureActive('new')).rejects.toMatchObject({
    code: 'APP_CAPACITY_EXCEEDED',
  });
  expect(
    (await host.dispatch('a', new Request('http://localhost/a'))).status,
  ).toBe(200);
  await host.evict('a');
  await host.ensureActive('a');
  expect(host.isActive('a')).toBe(true);
});

it('does not reclaim an App with a live socket to admit another App', async () => {
  const host = registry({
    maxActiveApps: 1,
    resolveFactory: () => () => ({
      fetch: () => new Response('ok'),
      config: new AppConfig(),
      websocket: () => ({}),
    }),
  });
  await host.create('connected');
  const handle = await host.ensureActiveHandle('connected');
  const events = (await handle.acceptWebSocket!(
    new Request('http://localhost/connected/ws'),
  )) as AppWebSocketEvents;
  const socket = { close: vi.fn() } as unknown as AppWebSocket;
  await events.onOpen!({ type: 'open' }, socket);
  await expect(host.create('new')).rejects.toMatchObject({
    code: 'APP_CAPACITY_EXCEEDED',
  });
  expect(host.isActive('connected')).toBe(true);
  await events.onClose!(
    { type: 'close', code: 1000, reason: '', wasClean: true },
    socket,
  );
  // The page just closed its socket, so the App was in use moments ago.
  await expect(host.ensureActive('new')).rejects.toMatchObject({
    code: 'APP_CAPACITY_EXCEEDED',
  });
  laterThanRecentUse();
  await host.ensureActive('new');
  expect(host.isActive('connected')).toBe(false);
});

it('answers a newcomer that capacity is full instead of reclaiming an App polled moments ago', async () => {
  const warn = vi.fn();
  const host = registry({
    maxActiveApps: 1,
    logger: { warn, info: vi.fn(), debug: vi.fn() } as unknown as Logger,
  });
  await host.create('polled');
  laterThanRecentUse();
  // A poll a few seconds ago, with no request in flight now.
  host.touch('polled', Date.now() - 5_000);
  await expect(host.create('newcomer')).rejects.toMatchObject({
    code: 'APP_CAPACITY_EXCEEDED',
  });
  expect(host.isActive('polled')).toBe(true);
  expect(host.getMetrics().capacityEvictions).toBe(0);
  expect(warn).toHaveBeenCalledWith(
    expect.objectContaining({
      occupants: [{ appId: 'polled', reasons: ['recent'] }],
    }),
    expect.any(String),
  );
  vi.setSystemTime(Date.now() + 61_000);
  await host.ensureActive('newcomer');
  expect(host.isActive('polled')).toBe(false);
  expect(host.getMetrics().capacityEvictions).toBe(1);
});

it('applies admission to stopped reloads, deployments and replacements', async () => {
  const host = registry({ maxActiveApps: 1 });
  await host.create('resident', { tier: 'dedicated' });
  await host.register('stopped');
  await expect(host.reload('stopped')).rejects.toThrow('capacity exceeded');
  await expect(host.deploy('stopped')).rejects.toThrow('capacity exceeded');
  await expect(
    host.replaceDefinition(
      { ...host.definition('stopped')!, desiredVersion: 'next' },
      { activate: true },
    ),
  ).rejects.toThrow('capacity exceeded');
  expect(host.list().map((app) => app.id)).toEqual(['resident']);
});

it('rejects a replacement before stopping the serving version when memory is insufficient', async () => {
  let heapUsed = 100 * MiB;
  const host = registry({
    sampleHeap: () => ({ heapUsed, heapLimit: 1280 * MiB }),
  });
  await host.create('a', { desiredVersion: 'v1' });
  heapUsed = 800 * MiB;
  await expect(host.deploy('a', { version: 'v2' })).rejects.toThrow(
    'current runtime kept serving',
  );
  expect(host.requireSnapshot('a').desiredVersion).toBe('v1');
  expect(
    (await host.dispatch('a', new Request('http://localhost/a'))).status,
  ).toBe(200);
});

it('cancels dormant artifact preparation at the startup deadline and protects its remaining cleanup', async () => {
  vi.useFakeTimers();
  const entered = Promise.withResolvers<void>();
  const cancelled = Promise.withResolvers<void>();
  const cleaned = Promise.withResolvers<void>();
  const host = registry({
    memoryBudget: { startupTimeoutMs: 100 },
    dormancy: {
      hibernate: async () => {},
      materialize: async () => {
        const signal = deploymentSignal()!;
        entered.resolve();
        await new Promise<void>((resolve) =>
          signal.addEventListener('abort', () => resolve(), { once: true }),
        );
        cancelled.resolve();
        await cleaned.promise;
        signal.throwIfAborted();
      },
    },
  });
  await host.register('sleep');
  host.markDormant('sleep');
  const start = host.ensureActive('sleep').catch((error: unknown) => error);
  await entered.promise;
  await vi.advanceTimersByTimeAsync(100);
  await cancelled.promise;
  expect(await start).toMatchObject({
    message: expect.stringContaining('startup timed out'),
  });
  expect(host.prepareRotation(false)).toBe(false);
  cleaned.resolve();
  await vi.advanceTimersByTimeAsync(0);
  expect(host.prepareRotation(false)).toBe(true);
});

it('uses the measured 320 MiB default headroom and the configurable operational reserve', async () => {
  let available = 1330 * MiB;
  const host = registry({
    sampleMemory: () => ({
      heapUsed: 100 * MiB,
      heapLimit: 2240 * MiB,
      rss: 400 * MiB,
      available,
    }),
  });
  await expect(host.create('a')).rejects.toMatchObject({
    code: 'APP_CAPACITY_EXCEEDED',
  });
  available = 2048 * MiB;
  await host.ensureActive('a');
  expect(host.capacity().appMemory).toBe(320 * MiB);
});
