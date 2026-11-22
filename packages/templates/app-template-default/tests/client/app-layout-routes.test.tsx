import { usePageBreadcrumb } from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { renderWithApp, answerApi } from '@nocobase/app-testing/client';
import { screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { AppLayout } from '../../client/layouts/app-layout.js';
import {
  createAppSidebarPreferenceStore,
  SidebarPreferenceProvider,
} from '../../client/layouts/use-sidebar-preference.js';
import enUS from '../../client/locales/en-US.js';
import packageMetadata from '../../package.json' with { type: 'json' };

vi.mock('@nocobase/app-plugin-authorization/client', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-authorization/client')
  >()),
  useCan: () => ({ can: true, isPending: false }),
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

async function renderLayout(
  page: ReactElement,
  initialRoute = '/orders/42',
  registered: readonly AppClientRegisteredRoute[] = routes,
): Promise<HTMLElement> {
  const sidebarPreference = createAppSidebarPreferenceStore('/test-app');
  await renderWithApp(
    <SidebarPreferenceProvider value={sidebarPreference}>
      <Routes>
        <Route element={<AppLayout routes={registered} />}>
          <Route path='/orders/:id' element={page} />
        </Route>
      </Routes>
    </SidebarPreferenceProvider>,
    {
      route: initialRoute,
      namespace: packageMetadata.name,
      namespaces: {
        [packageMetadata.name]: enUS,
        test: { Orders: 'Orders', Detail: 'Detail' },
      },
      fetch: answerApi(() => ({ data: {} })),
    },
  );
  return screen.getByRole('banner', { hidden: true });
}

it('shows the route trail of a nested page in its header', async () => {
  const header = await renderLayout(<h1>Detail page</h1>);
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

it('shows the trail a page declares, with its record names, in place of the route trail', async () => {
  const header = await renderLayout(<OrderPage />);
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

it('opens a registered personal settings page over the current business route', async () => {
  const profile: AppClientRegisteredRoute = {
    ...detail,
    id: 'profile',
    name: 'profile',
    authz: 'skip',
    surface: 'personalSettings',
    path: '/me/profile',
    packageName: packageMetadata.name,
    navigation: { title: 'settings.personal.appearance.title' },
    componentLoader: async () => ({ default: () => <h2>Profile settings</h2> }),
  };
  await renderLayout(
    <h1>Current order</h1>,
    '/orders/42?personalSettings=profile',
    [profile, ...routes],
  );
  const dialog = await screen.findByRole('dialog');
  expect(
    await within(dialog).findByRole('heading', { name: 'Profile settings' }),
  ).toBeVisible();
  expect(within(dialog).getByRole('link')).toHaveAttribute(
    'href',
    '/orders/42?personalSettings=profile',
  );
  expect(screen.getByText('Current order')).toBeInTheDocument();
});
