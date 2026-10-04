import {
  apiClientToken,
  ClientApplication,
  ClientApplicationContext,
  createAppClientConfig,
} from '@nocobase/app-client';
import { defineClientPlugins } from '@nocobase/app-client/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import { I18nProvider } from '@nocobase/i18n/client';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import i18n, { useAppLocale, useSyncServerLocale } from '../../client/index.js';

const applications: ClientApplication[] = [];

async function createApplication(baseURL: string): Promise<ClientApplication> {
  const runtime = await resolveAppRuntime(
    defineAppRuntime({
      packageName: '@test/app',
      createAppConfig: createAppClientConfig,
      plugins: defineClientPlugins([i18n()]),
      locales: {
        'en-US': async () => ({ greeting: 'Hello' }),
        'zh-CN': async () => ({ greeting: '你好' }),
      },
    }),
    { rawConfig: { api: { baseURL } } },
  );
  const app = new ClientApplication({
    runtime,
    createRenderConfig: () => ({ routes: null }),
  });
  applications.push(app);
  await app.start();
  return app;
}

function wrapperFor(app: ClientApplication) {
  return function Wrapper({ children }: PropsWithChildren): ReactElement {
    return (
      <ClientApplicationContext.Provider value={app}>
        <I18nProvider runtime={app.runtime.i18n}>{children}</I18nProvider>
      </ClientApplicationContext.Provider>
    );
  };
}

afterEach(async () => {
  for (const app of applications.splice(0)) await app.shutdown();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('application locale requests', () => {
  it('keeps locale switches scoped to each application and its configured API', async () => {
    const response = {
      locale: 'zh-CN',
      requestedLocale: 'zh-CN',
      fallback: false,
    };
    const fetchSpy = vi
      .fn<typeof fetch>()
      .mockImplementation(() =>
        Promise.resolve(Response.json({ data: response })),
      );
    vi.stubGlobal('fetch', fetchSpy);
    const first = await createApplication('/first/custom-api');
    const second = await createApplication('https://api.example.com/second');
    const firstRequest = vi.spyOn(
      first.services.resolve(apiClientToken),
      'request',
    );
    const secondRequest = vi.spyOn(
      second.services.resolve(apiClientToken),
      'request',
    );
    const firstHook = renderHook(() => useAppLocale(), {
      wrapper: wrapperFor(first),
    });
    const secondHook = renderHook(() => useAppLocale(), {
      wrapper: wrapperFor(second),
    });

    await act(async () => {
      await expect(
        firstHook.result.current.setLocale('zh-CN'),
      ).resolves.toEqual(response);
    });
    expect(firstRequest).toHaveBeenCalledOnce();
    expect(secondRequest).not.toHaveBeenCalled();
    expect(firstHook.result.current.locale).toBe('zh-CN');
    expect(secondHook.result.current.locale).toBe('en-US');

    await act(async () => {
      await secondHook.result.current.setLocale('zh-CN');
    });
    expect(secondRequest).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls.map(([url]) => String(url))).toEqual([
      '/first/custom-api/i18n/locale',
      'https://api.example.com/second/i18n/locale',
    ]);
  });

  it('synchronizes startup locale with the client in the current application context', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(() =>
        Promise.resolve(
          Response.json({
            data: {
              locale: 'en-US',
              requestedLocale: 'en-US',
              fallback: false,
            },
          }),
        ),
      ),
    );
    const first = await createApplication('/first/api');
    const second = await createApplication('/second/api');
    const firstRequest = vi.spyOn(
      first.services.resolve(apiClientToken),
      'request',
    );
    const secondRequest = vi.spyOn(
      second.services.resolve(apiClientToken),
      'request',
    );
    let current = first;
    const wrapper = ({ children }: PropsWithChildren): ReactElement => (
      <ClientApplicationContext.Provider value={current}>
        <I18nProvider runtime={first.runtime.i18n}>{children}</I18nProvider>
      </ClientApplicationContext.Provider>
    );
    const { rerender } = renderHook(() => useSyncServerLocale(), { wrapper });
    await waitFor(() => expect(firstRequest).toHaveBeenCalledOnce());
    expect(secondRequest).not.toHaveBeenCalled();
    rerender();
    expect(firstRequest).toHaveBeenCalledOnce();
    current = second;
    rerender();
    await waitFor(() => expect(secondRequest).toHaveBeenCalledOnce());
    expect(secondRequest).toHaveBeenCalledWith({
      path: 'i18n/locale',
      method: 'PUT',
      json: { locale: 'en-US' },
    });
  });

  it('skips startup synchronization when the application tree has no i18n provider', async () => {
    const app = await createApplication('/main/api');
    const request = vi.spyOn(app.services.resolve(apiClientToken), 'request');
    const wrapper = ({ children }: PropsWithChildren): ReactElement => (
      <ClientApplicationContext.Provider value={app}>
        {children}
      </ClientApplicationContext.Provider>
    );
    renderHook(() => useSyncServerLocale(), { wrapper });
    expect(request).not.toHaveBeenCalled();
  });
});
