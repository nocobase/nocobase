import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';
import { PermissionManagementPage } from '../../client/pages/settings/permission-management-page.js';
import applicationRoutes from '../../client/routes.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { useRouteNavigation } from '../../client/routing/route-navigation.js';

const { routes } = resolveAppClientContributions([
  {
    packageName: '@nocobase/app-template-examples',
    source: 'application',
    routes: applicationRoutes,
  },
]);

/** The shell's route tree and permission check, as `AppLayout` provides them. */
function Shell({ children }: { children: ReactNode }) {
  const { denied, loading } = useRouteNavigation(routes);
  return (
    <RouteTreeProvider routes={routes} access={{ denied, loading }}>
      {children}
    </RouteTreeProvider>
  );
}

function mount(prefix: string, tab = 'roles', roles = true, locale = 'en-US') {
  return renderAuthenticatedClient(<Shell>{tree(prefix)}</Shell>, {
    route: `${prefix}/${tab}`,
    locale,
    member: true,
    grants: [
      'authorization.default-access',
      ...(roles ? ['authorization.permission-sets'] : []),
    ].map((id) => ({
      resource: { type: 'settings', id },
      actions: [{ action: 'read' }],
    })),
  });
}
function Content({ tab }: { tab: 'roles' | 'default-access' }) {
  const location = useLocation();
  return (
    <PermissionManagementPage tab={tab}>
      <output aria-label='Route'>{location.pathname}</output>
    </PermissionManagementPage>
  );
}
function tree(prefix: string) {
  return (
    <Routes>
      <Route
        path={`${prefix}/roles`}
        element={<Content key='roles' tab='roles' />}
      />
      <Route
        path={`${prefix}/default-access`}
        element={<Content key='default-access' tab='default-access' />}
      />
    </Routes>
  );
}
it.each([''])(
  'uses two URL-backed tabs under one heading at the existing %s URLs and keeps keyboard focus',
  async (prefix) => {
    const user = userEvent.setup();
    await mount(prefix);
    await screen.findByRole('tab', { name: 'Roles and permissions' });
    expect(
      screen.getByRole('heading', { name: 'Permission management' }),
    ).toBeVisible();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    await user.click(screen.getByRole('tab', { name: 'Default data scopes' }));
    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
        `${prefix}/default-access`,
      ),
    );
    expect(
      screen.getByRole('tab', { name: 'Default data scopes' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('tabpanel', { name: 'Default data scopes' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: 'Default data scopes' }),
      ).toHaveFocus(),
    );
    await user.keyboard('{ArrowLeft}');
    expect(
      screen.getByRole('tab', { name: 'Roles and permissions' }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: 'Roles and permissions' }),
      ).toHaveAttribute('aria-selected', 'true'),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: 'Roles and permissions' }),
      ).toHaveFocus(),
    );
  },
);
it('shows a readable view without a single-tab bar and keeps direct navigation on it', async () => {
  await mount('', 'default-access', false);
  await screen.findByRole('heading', { name: 'Permission management' });
  // The module has one view this viewer may open, so it shows that view without a tab bar.
  await waitFor(() =>
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
    '/default-access',
  );
});
it('uses the agreed Chinese menu and tab names', async () => {
  await mount('', 'roles', true, 'zh-CN');
  await screen.findByRole('tab', { name: '角色与权限' });
  expect(screen.getByRole('heading', { name: '权限管理' })).toBeVisible();
  expect(screen.getByRole('tab', { name: '角色与权限' })).toBeVisible();
  expect(screen.getByRole('tab', { name: '默认数据范围' })).toBeVisible();
});
