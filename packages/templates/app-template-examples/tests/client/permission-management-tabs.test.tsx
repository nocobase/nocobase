import { renderWithApp } from '@nocobase/app-testing/client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import { PermissionManagementPage } from '../../client/pages/settings/permission-management-page.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
const access = vi.hoisted(() => ({ roles: true, defaults: true }));
vi.mock('@nocobase/app-plugin-authorization/client', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-authorization/client')
  >()),
  useCan: ({ resource }: { resource: { id: string } }) => ({
    can:
      resource.id === 'authorization.permission-sets'
        ? access.roles
        : access.defaults,
  }),
}));
const namespace = '@nocobase/permission-tabs-test';
const namespaces = {
  [namespace]: {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  },
};
beforeEach(() => {
  access.roles = true;
  access.defaults = true;
});
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
it.each(['', '/settings'])(
  'uses two URL-backed tabs under one heading, preserves the existing %s route prefix and keyboard focus',
  async (prefix) => {
    const user = userEvent.setup();
    await renderWithApp(tree(prefix), {
      route: `${prefix}/roles`,
      namespace,
      namespaces,
    });
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
it('hides an unreadable tab while keeping direct navigation on the readable default scope page', async () => {
  access.roles = false;
  await renderWithApp(tree(''), {
    route: '/default-access',
    namespace,
    namespaces,
  });
  expect(
    screen.queryByRole('tab', { name: 'Roles and permissions' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('tab', { name: 'Default data scopes' }),
  ).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
    '/default-access',
  );
});
it('uses the agreed Chinese menu and tab names', async () => {
  await renderWithApp(tree(''), {
    route: '/roles',
    namespace,
    namespaces,
    locale: 'zh-CN',
  });
  expect(screen.getByRole('heading', { name: '权限管理' })).toBeVisible();
  expect(screen.getByRole('tab', { name: '角色与权限' })).toBeVisible();
  expect(screen.getByRole('tab', { name: '默认数据范围' })).toBeVisible();
});
