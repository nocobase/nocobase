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
  vi.stubEnv('NOCOBASE_DEMO_MODE', 'observe');
  for (const mode of ['read-only', 'off'] as const) {
    const app = await createTestApp({
      createServer: createStandaloneServer,
      server: {
        env: {
          NOCOBASE_DEMO_MODE: mode,
          NOCOBASE_DEMO_WRITABLE_COLLECTIONS: ' demonotes, demonotes ',
        },
      },
      config: {
        demoMode: {
          mode: 'observe',
          allowCollections: ['demoitems'],
          quickSignIn: false,
        },
      },
    });
    apps.push(app);
  }
  for (const [index, app] of apps.entries()) {
    const mode = index === 0 ? 'read-only' : 'off';
    expect(app.application.config.get('demoMode')).toEqual({
      mode,
      allowCollections: ['demonotes', 'demonotes'],
      quickSignIn: false,
    });
    expect(app.application.container.resolve(demoModeServiceToken).mode).toBe(
      mode,
    );
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
    mode: 'off',
    allowCollections: [],
    quickSignIn: true,
  });
  expect(Object.keys(defineDemoModeConfig().rules?.env ?? {})).toEqual([
    'NOCOBASE_DEMO_MODE',
    'NOCOBASE_DEMO_WRITABLE_COLLECTIONS',
  ]);
});

it.each([
  { mode: 'invalid' },
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
