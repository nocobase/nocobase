import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { expect, it, vi } from 'vitest';

import { AppLayout } from '../../client/layouts/app-layout.js';
import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
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
vi.mock('../../client/layouts/components/layout-sidebar.js', () => ({
  LayoutSidebar: () => null,
}));
vi.mock('../../client/layouts/components/header-actions.js', () => ({
  HeaderActions: () => null,
}));

it('provides business route breadcrumbs to its outlet without an outer provider', () => {
  const child: AppClientRegisteredRoute = {
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
      ...child,
      id: 'orders',
      name: 'orders',
      path: '/orders',
      breadcrumb: { title: 'Orders' },
      children: [child],
    },
  ];
  render(
    <MemoryRouter initialEntries={['/orders/42']}>
      <Routes>
        <Route element={<AppLayout routes={routes} />}>
          <Route path='/orders/:id' element={<Breadcrumbs />} />
        </Route>
      </Routes>
    </MemoryRouter>,
    { wrapper: I18n },
  );
  expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
    'href',
    '/orders',
  );
  expect(screen.getByText('Detail')).toHaveAttribute('aria-current', 'page');
});
