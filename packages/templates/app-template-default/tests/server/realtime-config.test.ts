import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import {
  createRealtimeBrokerRegistry,
  realtimeServiceOptions,
  type AppRealtimeConfig,
} from '@nocobase/app-server/realtime';
import { createInMemoryBroker } from '@nocobase/realtime/server';
import appRuntime from '../../server/runtime.js';

let root: string;
beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'realtime-config-'));
});
afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

async function load(yaml: string) {
  const configPath = path.join(root, `${crypto.randomUUID()}.yml`);
  await writeFile(configPath, yaml);
  const runtime = await resolveStandaloneAppRuntime(appRuntime, {
    rootDir: path.resolve(import.meta.dirname, '../..'),
    configPath,
    env: { AUTH_SECRET: 'test-auth-secret-at-least-32-characters' },
  });
  const issues = (await runtime.config.validate()).filter(
    (issue) => issue.path === 'realtime' || issue.path.startsWith('realtime.'),
  );
  if (issues.length)
    throw new Error(
      issues.map((issue) => `${issue.path} ${issue.message}`).join(' '),
    );
  return runtime;
}

it('loads the actual commented Redis example through the application runtime without exposing credentials', async () => {
  const source = await readFile(
    new URL('../../config.example.yml', import.meta.url),
    'utf8',
  );
  const example = source.match(/^# realtime:\n(?:#(?: {2,}.*)?\n)*/m)?.[0];
  expect(example).toBeDefined();
  const runtime = await load(
    source.replace(example!, example!.replace(/^# ?/gm, '')),
  );
  const config = runtime.config.get<AppRealtimeConfig>('realtime');
  expect(config).toMatchObject({
    namespace: 'my-app',
    authorizationTimeoutMs: 5000,
    sessionCheckIntervalMs: 30000,
    broker: {
      adapter: 'redis',
      setupTimeoutMs: 5000,
      connection: { host: '127.0.0.1', port: 6379, commandTimeout: 5000 },
    },
    limits: { maxConnections: 10000 },
  });
  expect(
    (await runtime.config.validate()).filter((issue) =>
      issue.path.startsWith('realtime'),
    ),
  ).toEqual([]);
  expect(
    runtime.config.publicPaths().some((p) => p.startsWith('realtime')),
  ).toBe(false);
  // Configuration loads without commercial dependencies, but Redis selection still requires registration.
  expect(() => realtimeServiceOptions(config)).toThrow(/not registered/u);
  const registry = createRealtimeBrokerRegistry();
  registry.register('redis', (context) => {
    expect(context.config).toBe(config);
    expect(context.namespace).toBe('my-app');
    return createInMemoryBroker();
  });
  await realtimeServiceOptions(
    config,
    'application',
    registry,
  ).broker?.shutdown();
});

it.each([
  '{}',
  'realtime:\n  limits:\n    maxConnections: 10',
  'realtime:\n  broker:\n    adapter: inMemory',
])('keeps local operation for %s', async (yaml) => {
  const runtime = await load(yaml);
  const config = runtime.config.get<AppRealtimeConfig>('realtime');
  expect(config?.broker?.adapter).not.toBe('redis');
  const options = realtimeServiceOptions(config);
  await options.broker?.shutdown();
});

it.each(['{}', 'null', '[]', 'redis', '{ adapter: "" }', '{ adapter: 12 }'])(
  'does not fill in a missing adapter for explicit broker %s',
  async (broker) => {
    await expect(
      load(`realtime:\n  broker: ${broker}`).then(() => undefined),
    ).rejects.toThrow(/realtime.broker/u);
  },
);

it.each([
  'adapter: inMemory',
  'redis: {}',
  'adapter: redis\n  broker: { adapter: redis }',
])('rejects legacy fields in runtime configuration: %s', async (legacy) => {
  await expect(
    load(`realtime:\n  ${legacy}`).then(() => undefined),
  ).rejects.toThrow(/old configuration format/u);
});
