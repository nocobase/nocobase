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
        },
      },
      config: {
        demoMode: {
          enabled: !enabled,
          allowCollections: ['demoitems'],
          quickSignIn: false,
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
    });
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

it('uses defaults and ignores removed environment controls', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
    server: {
      env: {
        NOCOBASE_DEMO_QUICK_SIGN_IN: 'false',
        NOCOBASE_DEMO_DATA_MODELS: 'false',
        NOCOBASE_DEMO_DATA_MODEL_BASE_URL: 'not-a-url',
      },
    },
  });
  apps.push(app);
  expect(app.application.config.get('demoMode')).toEqual({
    enabled: false,
    allowCollections: [],
    quickSignIn: true,
  });
  expect(Object.keys(defineDemoModeConfig().rules?.env ?? {})).toEqual([
    'NOCOBASE_DEMO_MODE',
    'NOCOBASE_DEMO_WRITABLE_COLLECTIONS',
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
