import packageMetadata from '../../package.json' with { type: 'json' };
import { createAuthenticatedClientRenderer } from '../helpers/authenticated-client.js';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';
import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
import SettingsHomePage from '../../client/pages/settings/settings-home.js';
import applicationRoutes from '../../client/routes.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { useRouteNavigation } from '../../client/routing/route-navigation.js';

const renderAuthenticatedClient = createAuthenticatedClientRenderer();

const { routes } = resolveAppClientContributions([
  {
    packageName: packageMetadata.name,
    source: 'application',
    routes: applicationRoutes,
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

it('opens the first system settings page an administrator may open', async () => {
  // These are the application's own settings pages; User management, which comes first in a running application, is
  // `@nocobase/app-plugin-users`'s (see settings-navigation.test.ts).
  await mount();
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/roles',
    ),
  );
});

it('opens a restricted viewer on the first page they may open', async () => {
  await mount({
    member: true,
    grants: [
      {
        resource: { type: 'settings', id: 'authorization.default-access' },
        actions: [{ action: 'read' }],
      },
    ],
  });
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/default-access',
    ),
  );
});

it('explains when there is nothing to manage', async () => {
  await mount({ member: true, locale: 'zh-CN' });
  expect(await screen.findByText('暂时没有你可以管理的设置。')).toBeVisible();
  expect(screen.queryByRole('status', { name: 'Route' })).toBeNull();
});

it('links the System settings breadcrumb back to the home from a module view', async () => {
  await mount({}, '/settings/roles');
  const trail = await screen.findByRole('navigation', { name: 'Breadcrumb' });
  expect(
    await within(trail).findByRole('link', { name: 'System settings' }),
  ).toHaveAttribute('href', '/main/settings');
  expect(within(trail).getByText('Roles and permissions')).toBeVisible();
});
