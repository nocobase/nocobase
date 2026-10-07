import { usePageBreadcrumb } from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { AppLayout } from '../../client/layouts/app-layout.js';
import enUS from '../../client/locales/en-US.js';

// Breadcrumb titles are route data, not keys any namespace owns: the trail translates each through its package's
// namespace with the title itself as `defaultValue`, so the runtime is not strict.
const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/app-template-examples',
    resources: enUS,
  },
  strict: false,
});

function I18n({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

vi.mock('@nocobase/app-plugin-i18n/client', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@nocobase/app-plugin-i18n/client')
  >()),
  useSyncServerLocale: () => {},
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useClientApplication: () => ({ runtime: { settingsRouteTree: [] } }),
}));
vi.mock('../../client/routing/route-navigation.js', async (original) => ({
  ...(await original<
    typeof import('../../client/routing/route-navigation.js')
  >()),
  useRouteNavigation: () => ({ items: [], denied: new Set(), loading: false }),
}));
vi.mock('../../client/layouts/components/app-sidebar.js', async (original) => ({
  ...(await original<
    typeof import('../../client/layouts/components/app-sidebar.js')
  >()),
  AppSidebar: () => null,
}));
beforeEach(() =>
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
);
afterEach(() => vi.unstubAllGlobals());
vi.mock('../../client/layouts/components/header-actions.js', () => ({
  HeaderActions: () => null,
}));
// The global AI entry loads AI employees from the server; these tests are about the shell around it.
vi.mock('../../client/components/ai-employee-entry.js', () => ({
  AIEmployeeEntry: ({ children }: { readonly children: ReactNode }) => children,
}));

const detail: AppClientRegisteredRoute = {
  id: 'detail',
  name: 'detail',
  packageName: 'test',
  source: 'application',
  auth: 'required',
  path: '/orders/:id',
  breadcrumb: { title: 'Detail' },
  componentLoader: async () => ({ default: () => null }),
};
const routes = [
  {
    ...detail,
    id: 'orders',
    name: 'orders',
    path: '/orders',
    breadcrumb: { title: 'Orders' },
    children: [detail],
  },
];

function OrderPage(): ReactElement {
  usePageBreadcrumb([
    { label: 'Orders', to: '/orders?status=open' },
    { label: 'Order #42' },
  ]);
  return <h1>Order #42</h1>;
}

function renderLayout(page: ReactElement): HTMLElement {
  render(
    <MemoryRouter initialEntries={['/orders/42']}>
      <Routes>
        <Route element={<AppLayout routes={routes} />}>
          <Route path='/orders/:id' element={page} />
        </Route>
      </Routes>
    </MemoryRouter>,
    { wrapper: I18n },
  );
  return screen.getByRole('banner');
}

it('shows the route trail of a nested page in its header', () => {
  const header = renderLayout(<h1>Detail page</h1>);
  const trail = within(header).getByRole('navigation', { name: 'Breadcrumb' });
  expect(within(trail).getByRole('link', { name: 'Orders' })).toHaveAttribute(
    'href',
    '/orders',
  );
  expect(within(trail).getByText('Detail')).toHaveAttribute(
    'aria-current',
    'page',
  );
  // The header carries the only trail: the page renders none of its own.
  expect(
    screen.getAllByRole('navigation', { name: 'Breadcrumb' }),
  ).toHaveLength(1);
});

it('shows the trail a page declares, with its record names, in place of the route trail', () => {
  const header = renderLayout(<OrderPage />);
  const trail = within(header).getByRole('navigation', { name: 'Breadcrumb' });
  expect(within(trail).getByRole('link', { name: 'Orders' })).toHaveAttribute(
    'href',
    '/orders?status=open',
  );
  expect(within(trail).getByText('Order #42')).toHaveAttribute(
    'aria-current',
    'page',
  );
  expect(within(trail).queryByText('Detail')).toBeNull();
});
