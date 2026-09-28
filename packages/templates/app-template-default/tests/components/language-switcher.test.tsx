import {
  ClientApplication,
  ClientApplicationContext,
  createAppClientConfig,
  defineAppClientRenderConfig,
  readStoredLocale,
  toasterToken,
  type Toaster,
} from '@nocobase/app-client';
import { defineClientPlugins } from '@nocobase/app-client/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import { I18nProvider } from '@nocobase/i18n/client';
import { I18nRuntime } from '@nocobase/i18n';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { LanguageSwitcher } from '@/layouts/components/language-switcher';

const APP = '@nocobase/app-template-default';
const FALLBACK_NOTICE = '服务端不支持该语言，服务端内容已回落为英文。';
const CHANGE_FAILED_NOTICE = '未能完成语言切换，请重试。';
const fetchMock = vi.fn();
const toaster = {
  show: vi.fn<Toaster['show']>(() => 'toast'),
  close: vi.fn<Toaster['close']>(),
};
const applications: ClientApplication[] = [];

function createServerResponse(fallback = false): Response {
  return new Response(
    JSON.stringify({
      locale: fallback ? 'en-US' : 'zh-CN',
      requestedLocale: 'zh-CN',
      fallback,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}

async function createRuntime(locales: string[]): Promise<{
  app: ClientApplication;
  runtime: I18nRuntime;
}> {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales,
    applicationNamespace: APP,
  });
  runtime.registerApplicationNamespace(APP, {
    'en-US': () =>
      Promise.resolve({
        default: {
          actions: { language: 'Language' },
          notices: {
            serverLocaleFallback:
              'The server does not support this language, so server messages will use English.',
            languageChangeFailed:
              'Unable to complete the language change. Please try again.',
          },
        },
      }),
    'zh-CN': () =>
      Promise.resolve({
        default: {
          actions: { language: '语言' },
          notices: {
            serverLocaleFallback: FALLBACK_NOTICE,
            languageChangeFailed: CHANGE_FAILED_NOTICE,
          },
        },
      }),
  });
  await runtime.init('en-US');
  const appRuntime = await resolveAppRuntime(
    defineAppRuntime({
      packageName: APP,
      createAppConfig: createAppClientConfig,
      plugins: defineClientPlugins([]),
    }),
    { rawConfig: { api: { baseURL: '/api' } } },
  );
  const app = new ClientApplication({
    runtime: appRuntime,
    createRenderConfig: () => defineAppClientRenderConfig({ routes: null }),
  });
  // Stands in for the toaster client/service-provider.ts registers, so the test sees what the menu reports.
  app.container.instance(toasterToken, toaster);
  await app.start();
  applications.push(app);
  return { app, runtime };
}

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.localStorage.clear();
  fetchMock.mockImplementation(() => Promise.resolve(createServerResponse()));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(async () => {
  await Promise.all(applications.splice(0).map((app) => app.shutdown()));
});

function renderMenu(app: ClientApplication, runtime: I18nRuntime) {
  return render(
    <ClientApplicationContext.Provider value={app}>
      <I18nProvider runtime={runtime}>
        <DropdownMenu>
          <DropdownMenuTrigger>Account</DropdownMenuTrigger>
          <DropdownMenuContent>
            <LanguageSwitcher />
          </DropdownMenuContent>
        </DropdownMenu>
      </I18nProvider>
    </ClientApplicationContext.Provider>,
  );
}

describe('LanguageSwitcher', () => {
  it('shows the current language by name rather than by locale code', async () => {
    const { app, runtime } = await createRuntime(['en-US', 'zh-CN']);

    renderMenu(app, runtime);
    screen.getByRole('button', { name: 'Account' }).focus();
    await userEvent.keyboard('{ArrowDown}');

    const trigger = await screen.findByRole('menuitem', {
      name: /Language\s*English/,
    });
    expect(trigger).toHaveTextContent('English');
    expect(trigger).not.toHaveTextContent('en-US');
    await userEvent.click(trigger);
    expect(
      await screen.findByRole('menuitemradio', { name: 'English' }),
    ).toBeChecked();
    expect(
      screen.getByRole('menuitemradio', { name: '中文' }),
    ).not.toBeChecked();
  });

  it('switches the language when another is chosen', async () => {
    const { app, runtime } = await createRuntime(['en-US', 'zh-CN']);
    const user = userEvent.setup();

    renderMenu(app, runtime);
    screen.getByRole('button', { name: 'Account' }).focus();
    await userEvent.keyboard('{ArrowDown}');

    await user.click(
      await screen.findByRole('menuitem', { name: /Language\s*English/ }),
    );
    // jsdom has no submenu geometry for the pointer safe corridor.
    fireEvent.click(await screen.findByRole('menuitemradio', { name: '中文' }));

    await waitFor(() => expect(runtime.getLocale()).toBe('zh-CN'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Account' }));
    await user.click(
      await screen.findByRole('menuitem', { name: /语言\s*中文/ }),
    );
    expect(
      await screen.findByRole('menuitemradio', { name: '中文' }),
    ).toBeChecked();
    expect(toaster.show).not.toHaveBeenCalled();
  });

  it('closes while synchronization is pending and reports server fallback', async () => {
    const { app, runtime } = await createRuntime(['en-US', 'zh-CN']);
    const user = userEvent.setup();
    let resolveRequest: ((response: Response) => void) | undefined;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    renderMenu(app, runtime);
    screen.getByRole('button', { name: 'Account' }).focus();
    await user.keyboard('{ArrowDown}');
    await user.click(
      await screen.findByRole('menuitem', { name: /Language\s*English/ }),
    );
    fireEvent.click(await screen.findByRole('menuitemradio', { name: '中文' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(runtime.getLocale()).toBe('zh-CN');
    expect(readStoredLocale()).toBe('zh-CN');
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    if (!resolveRequest) throw new Error('Locale request did not start.');
    resolveRequest(createServerResponse(true));

    await waitFor(() =>
      expect(toaster.show).toHaveBeenCalledWith({
        type: 'info',
        title: FALLBACK_NOTICE,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Account' }));
    expect(
      await screen.findByRole('menuitem', { name: /语言\s*中文/ }),
    ).not.toHaveAttribute('aria-disabled');
    expect(toaster.show).toHaveBeenCalledOnce();
    await user.keyboard('{Escape}{Escape}');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Account' })).toHaveFocus(),
    );
  });

  it('keeps the interface language and reports a server synchronization failure', async () => {
    const { app, runtime } = await createRuntime(['en-US', 'zh-CN']);
    const user = userEvent.setup();
    fetchMock.mockImplementation(() => Promise.reject(new Error('offline')));

    renderMenu(app, runtime);
    screen.getByRole('button', { name: 'Account' }).focus();
    await user.keyboard('{ArrowDown}');
    await user.click(
      await screen.findByRole('menuitem', { name: /Language\s*English/ }),
    );
    fireEvent.click(await screen.findByRole('menuitemradio', { name: '中文' }));

    await waitFor(() => expect(runtime.getLocale()).toBe('zh-CN'));
    await waitFor(() =>
      expect(toaster.show).toHaveBeenCalledWith({
        type: 'error',
        title: CHANGE_FAILED_NOTICE,
      }),
    );
    expect(readStoredLocale()).toBe('zh-CN');
    expect(toaster.show).toHaveBeenCalledOnce();
    await user.keyboard('{Escape}{Escape}');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Account' })).toHaveFocus(),
    );
  });

  it('supports switching from the keyboard', async () => {
    const { app, runtime } = await createRuntime(['en-US', 'zh-CN']);
    const user = userEvent.setup();
    renderMenu(app, runtime);

    await user.tab();
    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: /Language\s*English/ }),
      ).toHaveFocus(),
    );
    await user.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(
        screen.getByRole('menuitemradio', { name: 'English' }),
      ).toHaveFocus(),
    );
    await user.keyboard('{ArrowDown}{Enter}');
    expect(runtime.getLocale()).toBe('zh-CN');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(readStoredLocale()).toBe('zh-CN');
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Account' })).toHaveFocus(),
    );
  });

  it('renders nothing when the application offers one language', async () => {
    const { app, runtime } = await createRuntime(['en-US']);

    const { container } = render(
      <ClientApplicationContext.Provider value={app}>
        <I18nProvider runtime={runtime}>
          <LanguageSwitcher />
        </I18nProvider>
      </ClientApplicationContext.Provider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
