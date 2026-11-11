import { createApp } from '../../client/app.js';
import { createAppClientConfig } from '@nocobase/app-client';
import { defineClientPlugins } from '@nocobase/app-client/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultClientServiceProvider } from '../../client/service-provider.ts';

function links(rel: string): string[] {
  return [...document.head.querySelectorAll(`link[rel="${rel}"]`)].map(
    (element) => element.getAttribute('href') ?? '',
  );
}

afterEach(() => {
  document.head.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('installation links', () => {
  it('links the manifest under the base path without asking for notification permission', async () => {
    const requestPermission = vi.fn();
    vi.stubGlobal('Notification', { permission: 'default', requestPermission });
    document.head.innerHTML = '<link rel="icon" href="/favicon.ico">';
    const app = await createTestApp('/tenants/acme', {
      enabled: true,
      appleTouchIcon: 'assets/pwa-192.png',
    });

    await app.start();

    expect(links('manifest')).toEqual(['/tenants/acme/manifest.webmanifest']);
    expect(links('apple-touch-icon')).toEqual([
      '/tenants/acme/assets/pwa-192.png',
    ]);
    expect(requestPermission).not.toHaveBeenCalled();

    await app.shutdown();
    expect(links('manifest')).toEqual([]);
    expect(links('apple-touch-icon')).toEqual([]);
    expect(links('icon')).toEqual(['/favicon.ico']);
  });

  it('links nothing when installation is turned off', async () => {
    const app = await createTestApp('/main', { enabled: false });

    await app.start();

    expect(links('manifest')).toEqual([]);
    await app.shutdown();
  });
});

async function createTestApp(
  basePath: string,
  pwa: { enabled: boolean; appleTouchIcon?: string },
) {
  const runtime = await resolveAppRuntime(
    defineAppRuntime({
      packageName: '@example/app',
      createAppConfig: createAppClientConfig,
      serviceProviders: [DefaultClientServiceProvider],
      reactProviders: [],
      routes: [],
      plugins: defineClientPlugins([]),
    }),
    {
      rawConfig: { app: { title: 'App', basePath } },
      rawPublicConfig: { pwa },
    },
  );
  return createApp(runtime);
}
