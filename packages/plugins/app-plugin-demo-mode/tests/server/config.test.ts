import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterEach, expect, it, vi } from 'vitest';

import { defineDemoModeConfig } from '../../server/config.js';
import { demoModeServiceToken } from '../../server/tokens.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

const apps: TestApp[] = [];
afterEach(async () => {
  for (const app of apps.splice(0)) await app.close();
  vi.unstubAllEnvs();
});

it('resolves defaults, file values and per-application environment without leaking between apps', async () => {
  vi.stubEnv('NOCOBASE_DEMO_MODE', 'false');
  for (const enabled of [true, false]) {
    const app = await createTestApp({
      createServer: createStandaloneServer,
      server: {
        env: {
          NOCOBASE_DEMO_MODE: String(enabled),
          NOCOBASE_DEMO_WRITABLE_COLLECTIONS: ' demonotes, demonotes ',
          NOCOBASE_DEMO_RESET_HOUR: enabled ? '4' : '5',
          NOCOBASE_DEMO_RESET_MINUTE: '30',
          NOCOBASE_DEMO_RESET_TIMEZONE: enabled ? 'Asia/Shanghai' : 'UTC',
          NOCOBASE_DEMO_RESET_LANGUAGE: enabled ? 'zh-CN' : 'en-US',
        },
      },
      config: {
        demoMode: {
          enabled: !enabled,
          allowCollections: ['demoitems'],
          quickSignIn: false,
          dailyReset: {
            hour: 8,
            minute: 15,
            timezone: 'Europe/London',
            language: 'ja-JP',
          },
        },
      },
    });
    apps.push(app);
  }
  for (const [index, app] of apps.entries()) {
    const enabled = index === 0;
    expect(app.application.config.get('demoMode')).toEqual({
      enabled,
      allowCollections: ['demonotes', 'demonotes'],
      quickSignIn: false,
      dailyReset: {
        hour: enabled ? 4 : 5,
        minute: 30,
        timezone: enabled ? 'Asia/Shanghai' : 'UTC',
        language: enabled ? 'zh-CN' : 'en-US',
      },
    });
    expect(app.application.config.publicValues().demoMode).toEqual({ enabled });
    expect(
      app.application.container.resolve(demoModeServiceToken).enabled,
    ).toBe(enabled);
    expect(
      app.application.container.resolve(demoModeServiceToken).allowCollections,
    ).toEqual(['session', 'verification', 'demonotes']);
    expect((await app.request('/items', { method: 'POST' })).status).toBe(
      index === 0 ? 400 : 200,
    );
  }
});

it('uses deployment defaults for daily resets', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
  });
  apps.push(app);
  expect(app.application.config.get('demoMode')).toEqual({
    enabled: false,
    allowCollections: [],
    quickSignIn: true,
    dailyReset: { hour: 3, minute: 0, timezone: 'UTC', language: 'en-US' },
  });
  expect(app.application.config.publicValues().demoMode).toEqual({
    enabled: false,
  });
  expect(Object.keys(defineDemoModeConfig().rules?.env ?? {})).toEqual([
    'NOCOBASE_DEMO_MODE',
    'NOCOBASE_DEMO_WRITABLE_COLLECTIONS',
    'NOCOBASE_DEMO_RESET_HOUR',
    'NOCOBASE_DEMO_RESET_MINUTE',
    'NOCOBASE_DEMO_RESET_TIMEZONE',
    'NOCOBASE_DEMO_RESET_LANGUAGE',
  ]);
});

it.each([
  { enabled: 'invalid' },
  { quickSignIn: 'false' },
  { allowCollections: ['invalid table'] },
])('rejects invalid resolved configuration %j at startup', async (demoMode) => {
  await expect(
    createTestApp({
      createServer: createStandaloneServer,
      config: { demoMode },
    }),
  ).rejects.toThrow(/demoMode/);
});

it.each([
  ['NOCOBASE_DEMO_RESET_HOUR', '24'],
  ['NOCOBASE_DEMO_RESET_HOUR', '-1'],
  ['NOCOBASE_DEMO_RESET_MINUTE', '60'],
  ['NOCOBASE_DEMO_RESET_MINUTE', '1.5'],
  ['NOCOBASE_DEMO_RESET_TIMEZONE', 'Invalid/Zone'],
  ['NOCOBASE_DEMO_RESET_TIMEZONE', ''],
  ['NOCOBASE_DEMO_RESET_LANGUAGE', 'not_a_locale'],
  ['NOCOBASE_DEMO_RESET_LANGUAGE', ''],
])(
  'rejects invalid reset environment %s=%s at startup',
  async (name, value) => {
    await expect(
      createTestApp({
        createServer: createStandaloneServer,
        server: { env: { [name]: value } },
      }),
    ).rejects.toThrow(/demoMode|Expected an integer/);
  },
);
