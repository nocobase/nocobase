import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { usePageBreadcrumb } from '@nocobase/app-client';
import { render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { expect, it, vi } from 'vitest';

import { AppLayout } from '../../client/layouts/app-layout.js';

// The agents' chat needs services these tests do not provide; the agent-chat block is tested in the UI Library.
vi.mock(
  '@nocobase/app-plugin-agents/client/chat',
  () => import('../setup/agents-chat-stub.js'),
);
vi.mock(
  '../../client/agents/chat.js',
  () => import('../setup/agents-chat-stub.js'),
);

// The person's language and theme on the server: not what these tests are about.
vi.mock('../../client/account/preferences-sync.js', () => ({
  useUserPreferencesSync: () => undefined,
}));
vi.mock('@nocobase/app-plugin-i18n/client', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@nocobase/app-plugin-i18n/client')
  >()),
  useSyncServerLocale: () => {},
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
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
vi.mock('../../client/layouts/components/header-actions.js', () => ({
  HeaderActions: () => null,
}));

// `useIsMobile` reads the width; JSDOM has no matchMedia to listen with.
vi.stubGlobal('matchMedia', () => ({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
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
