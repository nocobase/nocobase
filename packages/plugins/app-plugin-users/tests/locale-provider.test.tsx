import { defineClientPlugins } from '@nocobase/app-client/plugins';
import {
  apiClientToken,
  ClientApplication,
  ClientApplicationContext,
  createAppClientConfig,
  AppLocalePreferenceContext,
} from '@nocobase/app-client';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import { I18nProvider } from '@nocobase/i18n/client';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useContext, useEffect, type ContextType, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const identity = vi.hoisted(() => ({
  user: 'ann' as string | null,
  session: 'ann-1',
  pending: false,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    session: identity.user
      ? { user: { id: identity.user }, session: { id: identity.session } }
      : null,
    isPending: identity.pending,
  }),
}));
import { UserLocaleProvider } from '../client/locale-provider.js';

let app: ClientApplication;
let preference: ContextType<typeof AppLocalePreferenceContext>;
function Consumer() {
  const current = useContext(AppLocalePreferenceContext);
  useEffect(() => {
    preference = current;
  }, [current]);
  return <span>content</span>;
}
async function setup(
  values: Record<string, Record<string, unknown>> = {},
  load?: () => Promise<Record<string, unknown>>,
  extra?: ReactNode,
) {
  const config = document.createElement('script');
  config.id = 'nocobase-runtime-config';
  config.type = 'application/json';
  config.textContent = JSON.stringify({
    version: 1,
    config: { app: { basePath: '/' } },
  });
  document.body.append(config);
  const runtime = await resolveAppRuntime(
    defineAppRuntime({
      packageName: '@test/locale',
      plugins: defineClientPlugins([]),
      createAppConfig: createAppClientConfig,
      locales: { 'en-US': async () => ({}), 'zh-CN': async () => ({}) },
    }),
    { rawConfig: { api: { baseURL: '/api' } } },
  );
  app = new ClientApplication({
    runtime,
    createRenderConfig: () => ({ routes: null }),
  });
  await app.start();
  const request = vi
    .spyOn(app.services.resolve(apiClientToken), 'request')
    .mockImplementation(async (input) => {
      if (!input.method)
        return {
          data: load ? await load() : { ...values[identity.user ?? ''] },
        } as never;
      if (input.path.startsWith('users/me/preferences/')) {
        const { value, expectedUserId } = input.json as {
          value: string;
          expectedUserId: string;
        };
        expect(expectedUserId).toBe(identity.user);
        (values[identity.user ?? ''] ??= {})['i18n.locale'] = value;
        return {} as never;
      }
      const locale = (input.json as { locale: string }).locale;
      return {
        data: { locale, requestedLocale: locale, fallback: false },
      } as never;
    });
  const tree = () => (
    <ClientApplicationContext.Provider value={app}>
      <I18nProvider runtime={runtime.i18n}>
        <UserLocaleProvider
          key={JSON.stringify([identity.user, identity.session])}
        >
          <Consumer />
          {extra}
        </UserLocaleProvider>
      </I18nProvider>
    </ClientApplicationContext.Provider>
  );
  const view = render(tree());
  await screen.findByText('content');
  if (!load) await waitFor(() => expect(preference?.ready).toBe(true));
  return { request, values, rerender: () => view.rerender(tree()) };
}
afterEach(async () => {
  await app?.shutdown();
  localStorage.clear();
  identity.user = 'ann';
  identity.session = 'ann-1';
  identity.pending = false;
  vi.restoreAllMocks();
  document.getElementById('nocobase-runtime-config')?.remove();
});

describe('user locale integration', () => {
  it('restores the server preference instead of another account browser locale, and persists choices', async () => {
    localStorage.setItem('nocobase.locale:/', 'zh-CN');
    const { values, rerender } = await setup({
      ann: { 'i18n.locale': 'en-US' },
    });
    expect(app.runtime.i18n.getLocale()).toBe('en-US');
    await act(async () => {
      await preference?.set('zh-CN');
    });
    expect(values.ann?.['i18n.locale']).toBe('zh-CN');
    expect(localStorage.getItem('nocobase.locale:/')).toBe('zh-CN');
    identity.session = 'ann-new-session';
    localStorage.setItem('nocobase.locale:/', 'en-US');
    rerender();
    await screen.findByText('content');
    await waitFor(() => expect(preference?.ready).toBe(true));
    expect(app.runtime.i18n.getLocale()).toBe('zh-CN');
  });
  it('uses defaults without creating a preference, isolates accounts, and restores a guest choice after logout', async () => {
    const { values, rerender } = await setup({
      ann: { 'i18n.locale': 'zh-CN' },
    });
    await waitFor(() => expect(app.runtime.i18n.getLocale()).toBe('zh-CN'));
    identity.user = 'bob';
    identity.session = 'bob-1';
    rerender();
    expect(screen.queryByText('content')).toBeNull();
    await screen.findByText('content');
    expect(app.runtime.i18n.getLocale()).toBe('en-US');
    expect(values.bob).toBeUndefined();
    identity.user = null;
    rerender();
    await screen.findByText('content');
    await act(async () => {
      await preference?.set('zh-CN');
    });
    identity.user = 'bob';
    identity.session = 'bob-2';
    rerender();
    await screen.findByText('content');
    expect(app.runtime.i18n.getLocale()).toBe('en-US');
    identity.user = null;
    rerender();
    await screen.findByText('content');
    expect(app.runtime.i18n.getLocale()).toBe('zh-CN');
  });
  it('keeps a selection made before preference loading finishes', async () => {
    let release!: (values: Record<string, unknown>) => void;
    const loading = new Promise<Record<string, unknown>>((done) => {
      release = done;
    });
    const { values } = await setup({}, () => loading);
    await act(async () => {
      await preference!.set('zh-CN');
    });
    await act(async () => {
      release({ 'i18n.locale': 'en-US' });
      await loading;
    });
    await waitFor(() => expect(preference?.ready).toBe(true));
    expect(app.runtime.i18n.getLocale()).toBe('zh-CN');
    expect(values.ann?.['i18n.locale']).toBe('zh-CN');
  });
  it('cancels a selection whose locale resources finish after an account switch', async () => {
    const { values, rerender } = await setup();
    let release!: () => void;
    const loading = new Promise<void>((done) => {
      release = done;
    });
    const original = app.runtime.i18n.ensureLocaleLoaded.bind(app.runtime.i18n);
    vi.spyOn(app.runtime.i18n, 'ensureLocaleLoaded').mockImplementation(
      async (locale) => {
        if (locale === 'zh-CN') await loading;
        await original(locale);
      },
    );
    let switching!: Promise<unknown>;
    act(() => {
      switching = preference!.set('zh-CN');
    });
    const rejected = switching.catch((error: unknown) => error);
    identity.user = 'bob';
    identity.session = 'bob-delayed';
    rerender();
    await act(async () => {
      release();
      expect(await rejected).toMatchObject({
        message: 'The signed-in account changed.',
      });
    });
    await screen.findByText('content');
    expect(app.runtime.i18n.getLocale()).toBe('en-US');
    expect(values.bob).toBeUndefined();
    expect(values.ann).toBeUndefined();
  });
  it.each([
    ['signed out', null],
    ['signed in', 'ann'],
  ])('keeps children mounted while a %s session refreshes', async (_, user) => {
    identity.user = user;
    const mounts = vi.fn();
    function Probe() {
      useEffect(() => mounts(), []);
      return null;
    }
    const { rerender } = await setup({}, undefined, <Probe />);
    expect(mounts).toHaveBeenCalledOnce();
    identity.pending = true;
    rerender();
    expect(screen.getByText('content')).toBeInTheDocument();
    identity.pending = false;
    rerender();
    await waitFor(() => expect(preference?.ready).toBe(true));
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(mounts).toHaveBeenCalledOnce();
  });
  it('orders rapid choices and rejects unsupported values', async () => {
    const { values } = await setup();
    await act(async () => {
      await Promise.all([preference!.set('zh-CN'), preference!.set('en-US')]);
    });
    expect(values.ann?.['i18n.locale']).toBe('en-US');
    expect(app.runtime.i18n.getLocale()).toBe('en-US');
    await expect(preference!.set('xx-invalid')).rejects.toThrow(
      'Unsupported locale',
    );
  });
});
