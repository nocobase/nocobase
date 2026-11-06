import packageMetadata from '../../package.json' with { type: 'json' };
import { createAuthenticatedClientRenderer } from '../helpers/authenticated-client.js';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';
import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
import SettingsHomePage from '../../client/pages/settings/settings-home.js';
import settingsRoutes from '../../client/pages/settings/routes.js';
import shellRoutes from '../../client/pages/settings/shell-routes.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { useRouteNavigation } from '../../client/routing/route-navigation.js';

const renderAuthenticatedClient = createAuthenticatedClientRenderer();

const { routes } = resolveAppClientContributions([
  {
    packageName: packageMetadata.name,
    source: 'application',
    routes: [shellRoutes, settingsRoutes],
  },
]);

function Shell({ children }: { children: ReactNode }) {
  const { denied, loading } = useRouteNavigation(routes);
  return (
    <RouteTreeProvider routes={routes} access={{ denied, loading }}>
      <Breadcrumbs denied={denied} />
      {children}
    </RouteTreeProvider>
  );
}

function Where() {
  return <output aria-label='Route'>{useLocation().pathname}</output>;
}

function mount(
  options: Parameters<typeof renderAuthenticatedClient>[1] = {},
  route = '/settings',
) {
  return renderAuthenticatedClient(
    <Shell>
      <Routes>
        <Route path='/settings' element={<SettingsHomePage />} />
        <Route path='*' element={<Where />} />
      </Routes>
    </Shell>,
    { route, ...options },
  );
}

it('groups the modules an administrator may open into categories of cards that open by keyboard', async () => {
  const user = userEvent.setup();
  await mount();
  const account = await screen.findByRole('region', {
    name: 'Accounts and permissions',
  });
  const cards = within(account).getAllByRole('link');
  expect(cards.map((card) => card.textContent)).toEqual([
    'UsersManage accounts, access and active sessions.',
    'Permission managementSet what each role can open and do, and the data it can see.',
  ]);
  expect(cards[0]).toHaveAttribute('href', '/main/settings/users');
  expect(cards[1]).toHaveAttribute('href', '/main/settings/roles');
  // Categories without a module this viewer may open are not shown.
  expect(screen.getAllByRole('region')).toHaveLength(1);
  cards[1].focus();
  await user.keyboard('{Enter}');
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/roles',
    ),
  );
});

it('shows a restricted viewer only what they may open, opening a tabbed module on its readable view', async () => {
  await mount({
    member: true,
    grants: [
      {
        resource: { type: 'settings', id: 'authorization.default-access' },
        actions: [{ action: 'read' }],
      },
    ],
  });
  const account = await screen.findByRole('region', {
    name: 'Accounts and permissions',
  });
  // Categories without a module this viewer may open are not shown.
  expect(screen.getAllByRole('region')).toHaveLength(1);
  const cards = within(account).getAllByRole('link');
  expect(cards).toHaveLength(1);
  expect(cards[0]).toHaveAttribute('href', '/main/settings/default-access');
});

it('explains when there is nothing to manage', async () => {
  await mount({ member: true, locale: 'zh-CN' });
  expect(await screen.findByText('暂时没有你可以管理的设置。')).toBeVisible();
  expect(screen.getByRole('heading', { name: '系统设置' })).toBeVisible();
});

it('links the System settings breadcrumb back to the home from a module view', async () => {
  await mount({}, '/settings/roles');
  const trail = await screen.findByRole('navigation', { name: 'Breadcrumb' });
  expect(
    await within(trail).findByRole('link', { name: 'System settings' }),
  ).toHaveAttribute('href', '/main/settings');
  expect(within(trail).getByText('Roles and permissions')).toBeVisible();
});
