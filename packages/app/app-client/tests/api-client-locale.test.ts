import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClientToken, ClientApplication } from '../src/application.js';
import {
  createAppClientConfig,
  defineAppClientRenderConfig,
} from '../src/config.js';
import { defineClientPlugins } from '../src/plugins.js';
import { defineAppRuntime, resolveAppRuntime } from '../src/runtime/index.js';

const definition = defineAppRuntime({
  packageName: '@example/app',
  createAppConfig: createAppClientConfig,
  plugins: defineClientPlugins([]),
  locales: {
    'en-US': async () => ({ greeting: 'Hello' }),
    'zh-CN': async () => ({ greeting: '你好' }),
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * The language lives in the browser, so a server translating per request can
 * only learn it from the request itself.
 */
describe('the language the API client reports', () => {
  it('sends the current locale, and follows a switch without being rebuilt', async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(
        new Response('{}', { headers: { 'content-type': 'application/json' } }),
      ),
    );
    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
    const runtime = await resolveAppRuntime(definition, {
      rawConfig: { app: { basePath: '/main' }, api: { baseURL: '/main/api' } },
    });
    const app = new ClientApplication({
      runtime,
      createRenderConfig: () => defineAppClientRenderConfig({ routes: null }),
    });
    await app.start();
    const api = app.services.resolve(apiClientToken);

    await api.request({ path: 'authorization/permissionSets/options' });
    await runtime.i18n.changeLanguage('zh-CN');
    await api.request({ path: 'authorization/permissionSets/options' });

    expect(languages(fetch)).toEqual(['en-US', 'zh-CN']);
    await app.shutdown();
  });
});

function languages(
  fetch: ReturnType<typeof vi.fn>,
): readonly (string | null)[] {
  return fetch.mock.calls.map(([, init]) =>
    new Headers((init as RequestInit).headers).get('accept-language'),
  );
}
