// @vitest-environment jsdom
import { answerApi } from '@nocobase/app-testing/client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';
import { renderSettingsClient as renderWithApp } from '../../helpers/settings-client.js';
import {
  appNamespaces,
  settingsRoutes,
} from '../../helpers/settings-fixture.js';
import { AuthorizationPage } from '../../../client/settings/authorization-page.js';
import { authorizationSettingsToken } from '../../../client/tokens.js';
import {
  DATA_RULES_TAB,
  ROLES_TAB,
} from '../../../client/settings/tab-keys.js';

function Content({ tab }: { tab: string }) {
  const location = useLocation();
  return (
    <AuthorizationPage tab={tab}>
      <output aria-label='Route'>{location.pathname}</output>
    </AuthorizationPage>
  );
}

const tree = (
  <Routes>
    <Route path='/settings/roles' element={<Content tab={ROLES_TAB} />} />
    <Route
      path='/settings/default-access'
      element={<Content tab={DATA_RULES_TAB} />}
    />
    <Route path='/settings/checks' element={<Content tab='checks' />} />
  </Routes>
);

/** The kinds of data rule installed by default: Default access, as its rule plugin adds it. */
const DEFAULT_RULES = ['default-access'] as const;

/**
 * A session that may read the settings listed, as a member with those grants, in an application where the rule
 * plugins named in `rules` are installed.
 */
async function mount(
  route: string,
  readable: readonly string[],
  locale = 'en-US',
  rules: readonly string[] = DEFAULT_RULES,
) {
  const view = await renderWithApp(tree, {
    route,
    locale,
    routes: settingsRoutes,
    namespaces: appNamespaces,
    fetch: answerApi(({ path }) =>
      path === 'authorization/permissions'
        ? {
            data: {
              unrestricted: false,
              permissions: readable.map((id) => ({
                resource: { type: 'settings', id },
                actions: ['read'],
              })),
            },
          }
        : { data: [] },
    ),
  });
  const settings = view.app.container.resolve(authorizationSettingsToken);
  for (const rule of rules)
    settings.ruleTabs.add({
      key: rule,
      title: rule,
      authz: {
        resource: { type: 'settings', id: `authorization.${rule}` },
        action: 'read',
      },
      component: async () => ({ default: () => null }),
    });
  return view;
}

it('switches between the page tabs by address under one heading and keeps keyboard focus', async () => {
  const user = userEvent.setup();
  await mount('/settings/roles', [
    'authorization.permission-sets',
    'authorization.default-access',
  ]);
  await screen.findByRole('tab', { name: 'Data rules' });
  expect(
    screen.getByRole('heading', { name: 'Roles and permissions' }),
  ).toBeVisible();
  expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
    'Roles',
    'Data rules',
  ]);
  await user.click(screen.getByRole('tab', { name: 'Data rules' }));
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/default-access',
    ),
  );
  expect(screen.getByRole('tab', { name: 'Data rules' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByRole('tabpanel', { name: 'Data rules' })).toBeVisible();
  await waitFor(() =>
    expect(screen.getByRole('tab', { name: 'Data rules' })).toHaveFocus(),
  );
  await user.keyboard('{ArrowLeft}');
  expect(screen.getByRole('tab', { name: 'Roles' })).toHaveFocus();
  await user.keyboard('{Enter}');
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/roles',
    ),
  );
});

it('shows the one tab a viewer may open without a tab bar', async () => {
  await mount('/settings/default-access', ['authorization.default-access']);
  await screen.findByRole('heading', { name: 'Roles and permissions' });
  // The other tab is listed only once it is known to open, so wait for that answer.
  await waitFor(() =>
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument(),
  );
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
    '/settings/default-access',
  );
});

it('uses the agreed Chinese heading and tab names', async () => {
  await mount(
    '/settings/roles',
    ['authorization.permission-sets', 'authorization.default-access'],
    'zh-CN',
  );
  expect(await screen.findByRole('tab', { name: '数据规则' })).toBeVisible();
  expect(screen.getByRole('heading', { name: '角色和权限' })).toBeVisible();
  expect(screen.getByRole('tab', { name: '角色' })).toBeVisible();
});

it('lists a tab another package adds in its order, and only to those its page admits', async () => {
  const user = userEvent.setup();
  const view = await mount('/settings/roles', [
    'authorization.permission-sets',
    'authorization.default-access',
  ]);
  const settings = view.app.container.resolve(authorizationSettingsToken);
  const remove = settings.pageTabs.add({
    key: 'checks',
    title: 'Permission checks',
    order: 15,
    path: '/checks',
    authz: { resource: { type: 'settings', id: 'checks' }, action: 'read' },
  });
  // The session may not read the checks page, so its tab stays hidden.
  await screen.findByRole('tab', { name: 'Data rules' });
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(
    screen.queryByRole('tab', { name: 'Permission checks' }),
  ).not.toBeInTheDocument();
  remove();
  settings.pageTabs.add({
    key: 'checks',
    title: 'Permission checks',
    order: 15,
    path: '/checks',
    authz: {
      resource: { type: 'settings', id: 'authorization.permission-sets' },
      action: 'read',
    },
  });
  await screen.findByRole('tab', { name: 'Permission checks' });
  expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
    'Roles',
    'Permission checks',
    'Data rules',
  ]);
  await user.click(screen.getByRole('tab', { name: 'Permission checks' }));
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/checks',
    ),
  );
  // Adding a key twice names the mistake instead of replacing the tab.
  expect(() =>
    settings.pageTabs.add({
      key: 'checks',
      title: 'Again',
      path: '/checks',
      authz: 'unrestricted',
    }),
  ).toThrow('The page tab "checks" is added twice.');
});

it('hides Data rules while no rule plugin is installed and lists it once one is', async () => {
  const view = await mount(
    '/settings/roles',
    [
      'authorization.permission-sets',
      'authorization.default-access',
      'authorization.sharing-rules',
    ],
    'en-US',
    [],
  );
  await screen.findByRole('heading', { name: 'Roles and permissions' });
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  const settings = view.app.container.resolve(authorizationSettingsToken);
  const remove = settings.ruleTabs.add({
    key: 'sharing-rules',
    title: 'Sharing rules',
    authz: {
      resource: { type: 'settings', id: 'authorization.sharing-rules' },
      action: 'read',
    },
    component: async () => ({ default: () => null }),
  });
  expect(await screen.findByRole('tab', { name: 'Data rules' })).toBeVisible();
  remove();
  await waitFor(() =>
    expect(
      screen.queryByRole('tab', { name: 'Data rules' }),
    ).not.toBeInTheDocument(),
  );
});

it('hides Data rules when the viewer may open none of the installed kinds of rule', async () => {
  await mount(
    '/settings/roles',
    ['authorization.permission-sets', 'authorization.default-access'],
    'en-US',
    ['sharing-rules'],
  );
  await screen.findByRole('heading', { name: 'Roles and permissions' });
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(
    screen.queryByRole('tab', { name: 'Data rules' }),
  ).not.toBeInTheDocument();
});
