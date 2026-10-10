import {
  ClientApplicationContext,
  type ClientApplication,
  createAppClientConfig,
} from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import { AppLayout } from '../../client/layouts/app-layout.js';
vi.mock('@nocobase/app-plugin-i18n/client', () => ({
  useSyncServerLocale: () => {},
}));

vi.mock('../../client/theme/index.js', () => ({ ThemeSettings: () => null }));
vi.mock('../../client/layouts/components/user-menu.js', () => ({
  UserMenu: () => null,
}));
vi.mock('../../client/routing/route-navigation.js', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../client/routing/route-navigation.js')
  >()),
  useRouteNavigation: (routes: readonly AppClientRegisteredRoute[]) => ({
    items: routes.map((route) => ({ route, children: [] })),
    loading: false,
    denied: new Set<string>(),
  }),
}));

/** The page the shell opens on: the header names it. */
const overview: AppClientRegisteredRoute = {
  id: 'overview',
  name: 'overview',
  path: '/',
  packageName: 'test',
  source: 'application',
  auth: 'optional',
  breadcrumb: { title: 'Overview' },
  componentLoader: async () => ({ default: () => null }),
};

async function setup(children: ReactNode) {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: 'test-app',
  });
  runtime.registerApplicationNamespace('test-app', locales);
  await runtime.init('en-US');
  const app = {
    config: createAppClientConfig({ rawConfig: {} }),
    runtime: {},
  } as unknown as ClientApplication;
  render(
    <I18nProvider runtime={runtime}>
      <ClientApplicationContext.Provider value={app}>
        <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
      </ClientApplicationContext.Provider>
    </I18nProvider>,
  );
  return runtime;
}

describe('shell translations', () => {
  it('updates header, footer and accessible labels without remounting', async () => {
    const runtime = await setup(<AppLayout routes={[overview]} />);
    // The header's trail, where a tagline used to be.
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toHaveTextContent('Overview');
    expect(screen.getByText('AI builds freely.')).toBeVisible();
    await act(() => runtime.changeLanguage('zh-CN'));
    expect(screen.getByRole('navigation', { name: '面包屑' })).toBeVisible();
    expect(screen.getByText('AI 自由构建。')).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'NocoBase' }).parentElement,
    ).toHaveTextContent('NocoBase 保障可靠。');
    expect(
      screen.getByRole('button', { name: '展开或收起导航' }),
    ).toHaveAttribute('title', '展开或收起导航');
    expect(screen.getByRole('link', { name: 'NocoBase' })).toHaveAttribute(
      'href',
      'https://www.nocobase.com',
    );
    await act(() => runtime.changeLanguage('en-US'));
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeVisible();
  });
});
