import { createApp } from '../../client/app.js';
import { createAppClientConfig } from '@nocobase/app-client';
import { defineClientPlugins } from '@nocobase/app-client/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import { describe, expect, it } from 'vitest';

import { DefaultClientServiceProvider } from '../../client/service-provider.ts';

describe('application title', () => {
  it('uses the configured title during the application lifecycle', async () => {
    const previousTitle = 'Host title';
    document.title = previousTitle;
    const app = await createTestApp('Configured application');

    await app.start();

    expect(app.refineConfig.options?.title).toEqual({
      text: 'Configured application',
    });
    expect(document.title).toBe('Configured application');

    await app.shutdown();
    expect(document.title).toBe(previousTitle);
  });

  it('falls back to NocoBase for a blank configured title', async () => {
    const previousTitle = 'Host title';
    document.title = previousTitle;
    const app = await createTestApp('   ');

    await app.start();

    expect(app.refineConfig.options?.title).toEqual({ text: 'NocoBase' });
    expect(document.title).toBe('NocoBase');

    await app.shutdown();
    expect(document.title).toBe(previousTitle);
  });
});

async function createTestApp(title: string) {
  const runtime = await resolveAppRuntime(
    defineAppRuntime({
      packageName: '@example/app',
      createAppConfig: createAppClientConfig,
      serviceProviders: [DefaultClientServiceProvider],
      reactProviders: [],
      routes: [],
      plugins: defineClientPlugins([]),
    }),
    { rawConfig: { app: { title } } },
  );
  return createApp(runtime);
}
