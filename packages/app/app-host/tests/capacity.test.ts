import { afterEach, expect, it, vi } from 'vitest';
import { AppConfig } from '@nocobase/app-server/config';
import type { AppWebSocketEvents, AppWebSocket } from '@nocobase/app-websocket';
import type { Logger } from '@nocobase/logging';
import { AppRuntimeRegistry } from '../dist/app-registry.js';
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
    sampleHeap: () => ({ heapUsed: 100 * MiB, heapLimit: 1280 * MiB }),
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
  await expect(host.create('other')).rejects.toMatchObject({
    code: 'APP_CAPACITY_EXCEEDED',
  });
  release();
  await slow;
  laterThanRecentUse();
  await expect(host.create('broken')).rejects.toThrow('broken');
  await host.ensureActive('other');
  expect(host.list().map((app) => app.id)).toEqual(['other']);

  const lru = registry(); // (70% * 1280 - 256) / 256 = two slots
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

it('rejects retained heap pressure after one safe eviction and requests rotation', async () => {
  let heapUsed = 100 * MiB;
  const host = registry({
    sampleHeap: () => ({ heapUsed, heapLimit: 1280 * MiB }),
  });
  await host.create('a');
  laterThanRecentUse();
  heapUsed = 800 * MiB;
  await expect(host.create('b')).rejects.toMatchObject({
    code: 'APP_CAPACITY_EXCEEDED',
  });
  expect(host.isActive('a')).toBe(false);
  expect(host.getMetrics().capacityEvictions).toBe(1);
  expect(host.getMetrics().memoryPressure).toBe(1);
  heapUsed = 100 * MiB;
  await host.ensureActive('b');
  expect(host.isActive('b')).toBe(true);
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
