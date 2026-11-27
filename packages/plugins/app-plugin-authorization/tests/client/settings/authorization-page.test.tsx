// @vitest-environment jsdom
import { answerApi } from '@nocobase/app-testing/client';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';
import { renderSettingsClient as renderWithApp } from '../../helpers/settings-client.js';
import {
  appNamespaces,
  settingsRoutes,
} from '../../helpers/settings-fixture.js';
import { AuthorizationPage } from '../../../client/settings/authorization-page.js';
import {
  authorizationClientToken,
  authorizationSettingsToken,
} from '../../../client/tokens.js';
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
    <Route
      path='/settings/sharing-rules'
      element={<Content tab={DATA_RULES_TAB} />}
    />
    <Route path='/settings' element={<p>Settings home</p>} />
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
  available: readonly string[] = [
    'defaultAccess',
    'sharingRules',
    'restrictionRules',
  ],
  existing: readonly string[] = [],
) {
  const view = await renderWithApp(tree, {
    route,
    locale,
    authorization: {
      workspace: {
        business: [],
        excludedNewRuleResources: { 'database.collection': ['instances'] },
      },
    },
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
        : path.endsWith('/options')
          ? {
              data: {
                sections: [],
                collections: [
                  { name: 'instances' },
                  ...(available.includes(path.split('/')[1] ?? '')
                    ? [{ name: 'projects' }]
                    : []),
                ],
              },
            }
          : {
              data: existing.includes(path.split('/')[1] ?? '')
                ? [{ key: 'saved' }]
                : [],
            },
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

/**
 * Waits for the session's permissions, which every tab's answer reads, and renders what they decide. The tabs asked
 * first, so their answers are in once this one is.
 */
async function settled(view: Awaited<ReturnType<typeof mount>>) {
  const client = view.app.container.resolve(authorizationClientToken);
  await act(async () => {
    await client.can({
      resource: { type: 'settings', id: 'authorization.permission-sets' },
      action: 'read',
    });
  });
}

it('switches between the page tabs by address under one heading and keeps keyboard focus', async () => {
  const user = userEvent.setup();
  await mount('/settings/roles', [
    'authorization.permission-sets',
    'authorization.default-access',
  ]);
  await screen.findByRole('tab', { name: 'Data rules' });
  expect(
    screen.getByRole('heading', { name: 'Roles & permissions' }),
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
  const view = await mount('/settings/default-access', [
    'authorization.default-access',
  ]);
  await screen.findByRole('heading', { name: 'Roles & permissions' });
  // The other tab is listed only once it is known to open, so wait for that answer.
  await settled(view);
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
  expect(screen.getByRole('heading', { name: '角色与权限' })).toBeVisible();
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
  await settled(view);
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
  await screen.findByRole('heading', { name: 'Roles & permissions' });
  await settled(view);
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
  const view = await mount(
    '/settings/roles',
    ['authorization.permission-sets', 'authorization.default-access'],
    'en-US',
    ['sharing-rules'],
  );
  await screen.findByRole('heading', { name: 'Roles & permissions' });
  await settled(view);
  expect(
    screen.queryByRole('tab', { name: 'Data rules' }),
  ).not.toBeInTheDocument();
});

it('opens Data rules on sharing rules for a person who may read only those', async () => {
  const user = userEvent.setup();
  await mount(
    '/settings/roles',
    ['authorization.permission-sets', 'authorization.sharing-rules'],
    'en-US',
    ['default-access', 'sharing-rules'],
  );
  await user.click(await screen.findByRole('tab', { name: 'Data rules' }));
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/sharing-rules',
    ),
  );
  expect(screen.getByRole('tab', { name: 'Data rules' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

it('leaves a stored Data rules link for the first tab the person may open while no rule plugin is installed', async () => {
  await mount(
    '/settings/default-access',
    ['authorization.permission-sets', 'authorization.default-access'],
    'en-US',
    [],
  );
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/roles',
    ),
  );
  expect(
    screen.queryByRole('tab', { name: 'Data rules' }),
  ).not.toBeInTheDocument();
});

it('leaves an empty rule surface for roles when all three kinds have only excluded objects and no saved rules', async () => {
  await mount(
    '/settings/default-access',
    [
      'authorization.permission-sets',
      'authorization.default-access',
      'authorization.sharing-rules',
      'authorization.restriction-rules',
    ],
    'en-US',
    ['default-access', 'sharing-rules', 'restriction-rules'],
    [],
  );
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/roles',
    ),
  );
  expect(
    screen.queryByRole('tab', { name: 'Data rules' }),
  ).not.toBeInTheDocument();
});

it('opens the remaining kind with saved rules even when every catalog object is excluded', async () => {
  await mount(
    '/settings/roles',
    [
      'authorization.permission-sets',
      'authorization.default-access',
      'authorization.sharing-rules',
    ],
    'en-US',
    ['default-access', 'sharing-rules'],
    [],
    ['sharingRules'],
  );
  await userEvent.click(await screen.findByRole('tab', { name: 'Data rules' }));
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/sharing-rules',
    ),
  );
});

it('leaves an empty Data rules link for Settings when no other tab is accessible', async () => {
  await mount(
    '/settings/default-access',
    ['authorization.default-access'],
    'en-US',
    DEFAULT_RULES,
    [],
  );
  expect(await screen.findByText('Settings home')).toBeVisible();
});
