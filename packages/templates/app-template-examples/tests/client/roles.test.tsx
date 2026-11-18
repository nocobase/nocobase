import { answerApi } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  defineAppRoutes,
  defineClientPlugin,
} from '@nocobase/app-client/plugins';
import {
  AuthorizationClient,
  authorizationClientToken,
  type PermissionGrant,
  type PermissionSet,
} from '@nocobase/app-plugin-authorization/client';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { expect, it, vi } from 'vitest';
import { renderSettingsClient as renderWithApp } from '../helpers/settings-client.js';
import RolesPage from '../../client/pages/settings/roles.js';
import RoleForm from '../../client/pages/settings/role-form.js';
import systemSettingsRoutes from '../../client/pages/settings/routes.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const settingsNamespace = '@nocobase/compact-role-test';
const words = enUS.settings;
const editor = words.permissionEditor;
const services = (app: ClientApplication) =>
  app.container.instance(
    authorizationClientToken,
    new AuthorizationClient(app.container.resolve(apiClientToken)),
  );
// The System settings group of this application's routes, without its business pages.
const settingsShellRoutes = defineAppRoutes([
  {
    name: 'systemManagement',
    navigation: { title: 'settings.title' },
    children: [
      {
        name: 'settingsHome',
        path: '/settings',
        auth: 'required',
        authz: 'skip',
        componentLoader: async () => ({ default: () => null }),
      },
      {
        name: 'settingsAccount',
        navigation: { title: 'settings.categories.account', order: 10 },
        children: [],
      },
    ],
  },
]);

const namespaces = {
  [settingsNamespace]: {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  },
};
const plugins = [
  defineClientPlugin({
    packageName: settingsNamespace,
    routes: [
      settingsShellRoutes,
      systemSettingsRoutes,
      defineAppRoutes([
        {
          name: 'start',
          path: '/start',
          navigation: { title: 'navigation.home' },
          authz: { resource: { type: 'page', id: 'start' }, action: 'access' },
          componentLoader: async () => ({ default: () => null }),
        },
        {
          name: 'library',
          path: '/library',
          navigation: { title: 'navigation.resources' },
          authz: {
            resource: { type: 'page', id: 'library' },
            action: 'access',
          },
          componentLoader: async () => ({ default: () => null }),
        },
      ]),
    ],
  })(),
];
const options = {
  sections: [
    {
      name: 'administration',
      title: 'Administration',
      order: 0,
      subsections: [
        {
          name: 'authorization',
          title: 'Authorization',
          resources: [
            {
              type: 'settings',
              id: 'authorization.permission-sets',
              title: 'Permission sets',
              actions: [
                { name: 'read', title: 'Read roles' },
                { name: 'update', title: 'Change roles' },
              ],
            },
          ],
        },
      ],
    },
  ],
  recordAccess: [],
  subjectTypes: [],
  collections: [],
};

function api(roles: PermissionSet[]) {
  return vi.fn(
    ({
      path,
      method,
      json,
    }: {
      path: string;
      method: string;
      json?: { grants: readonly PermissionGrant[] };
    }) => {
      if (path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (path === 'authorization/permissionSets/options')
        return { data: options };
      if (path === 'authorization/permissionSets') return { data: roles };
      const key = decodeURIComponent(path.split('/').at(-1) ?? '');
      const index = roles.findIndex((role) => role.key === key);
      if (index === -1) return new Response(null, { status: 404 });
      if (method === 'PATCH' && json)
        roles[index] = { ...roles[index]!, grants: json.grants };
      return { data: roles[index] };
    },
  );
}

function mount(route: string, calls: ReturnType<typeof api>) {
  return renderWithApp(
    <Routes>
      <Route path='/settings/roles' element={<RolesPage />}>
        <Route path='create' element={<RoleForm />} />
        <Route path=':key/edit' element={<RoleForm />} />
      </Route>
    </Routes>,
    {
      route,
      namespace: settingsNamespace,
      namespaces,
      plugins,
      services,
      fetch: answerApi(calls),
    },
  );
}

it('lists the roles beside the editor, opens the first one and keeps the system administrator read-only', async () => {
  const user = userEvent.setup();
  await mount(
    '/settings/roles',
    api([
      { key: 'team', title: 'NocoBase team', grants: [] },
      { key: 'cp-customer', title: 'Customer', grants: [] },
      { key: 'root', title: 'System administrator', unrestricted: true },
      {
        key: 'member',
        title: 'Member',
        grants: [],
        protection: { allow: ['update'] },
      },
    ] as PermissionSet[]),
  );
  const list = await screen.findByRole('complementary', { name: words.roles });
  await waitFor(() =>
    expect(
      within(list)
        .getAllByRole('link')
        .map((link) => link.querySelector('[title]')?.textContent),
    ).toEqual(['System administrator', 'Customer', 'Member', 'NocoBase team']),
  );
  expect(within(list).getByText(words.unrestrictedRole)).toBeVisible();
  expect(within(list).getByText(words.protected)).toBeVisible();
  // The first role opens at once: the system administrator, which has nothing to set.
  expect(await screen.findByText(editor.unrestrictedTitle)).toBeVisible();
  expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: words.save, exact: true }),
  ).not.toBeInTheDocument();
  await user.type(
    within(list).getByRole('textbox', { name: words.roleSearch }),
    'Customer',
  );
  await waitFor(() =>
    expect(within(list).getAllByRole('link')).toHaveLength(1),
  );
  expect(within(list).getByRole('link')).toHaveAttribute(
    'href',
    '/settings/roles/cp-customer/edit',
  );
});

it('saves menu access with the actions, explains escalation and asks before switching roles with unsaved changes', async () => {
  const user = userEvent.setup();
  const roles = [
    { key: 'team', title: 'NocoBase team', grants: [], revision: 'one' },
    { key: 'support', title: 'Support', grants: [], revision: 'one' },
  ] as PermissionSet[];
  const calls = api(roles);
  await mount('/settings/roles/team/edit', calls);
  const open = await screen.findByRole('switch', { name: words.openPage });
  await waitFor(() => expect(open).not.toBeDisabled());
  expect(screen.getByText('0 of 4 menus visible')).toBeVisible();
  await user.click(open);
  expect(screen.getByText('1 of 4 menus visible')).toBeVisible();
  expect(screen.getByText(words.unsaved)).toBeVisible();

  // Administration: changing roles needs reading them and is explained as an escalation.
  await user.click(
    screen.getByRole('button', {
      name: new RegExp(`^${words.permissionManagement}`),
    }),
  );
  expect(screen.getByText(words.escalation.roles)).toBeVisible();
  await user.click(screen.getByRole('switch', { name: /Change roles/ }));
  expect(screen.getByRole('switch', { name: /Read roles/ })).toBeChecked();
  expect(screen.getByText(editor.riskHint)).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: words.save, exact: true }),
  );
  await waitFor(() =>
    expect(calls).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH' }),
    ),
  );
  expect(roles[0]?.grants).toEqual(
    expect.arrayContaining([
      {
        resource: { type: 'page', id: 'start' },
        actions: [{ action: 'access' }],
      },
      {
        resource: { type: 'settings', id: 'authorization.permission-sets' },
        actions: [{ action: 'read' }, { action: 'update' }],
      },
    ]),
  );
  // After saving, the editor stays on the menu it was showing.
  await waitFor(() =>
    expect(screen.queryByText(words.unsaved)).not.toBeInTheDocument(),
  );
  expect(screen.getByRole('switch', { name: /Change roles/ })).toBeChecked();

  // Switching to another role with an unsaved change asks first.
  await user.click(screen.getByRole('switch', { name: /Change roles/ }));
  await user.click(screen.getByRole('link', { name: /Support/ }));
  const dialog = await screen.findByRole('alertdialog');
  expect(within(dialog).getByText(words.discardTitle)).toBeVisible();
  await user.click(within(dialog).getByRole('button', { name: words.cancel }));
  expect(
    screen.getByRole('switch', { name: /Change roles/ }),
  ).not.toBeChecked();
});

it('announces a slow retry after the role list fails to load, from the retry button', async () => {
  const roles = { data: [{ key: 'team', title: 'NocoBase team', grants: [] }] };
  let reads = 0;
  let finish!: () => void;
  const slow = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await renderWithApp(
    <Routes>
      <Route path='/settings/roles' element={<RolesPage />}>
        <Route path=':key/edit' element={null} />
      </Route>
    </Routes>,
    {
      route: '/settings/roles',
      namespace: settingsNamespace,
      namespaces,
      services,
      fetch: answerApi(async ({ path }) => {
        if (path === 'authorization/permissions')
          return { data: { unrestricted: true, permissions: [] } };
        reads += 1;
        if (reads === 1)
          return Response.json(
            { error: { status: 'INTERNAL', message: 'Unavailable' } },
            { status: 500 },
          );
        await slow;
        return roles;
      }),
    },
  );
  await screen.findByText(enUS.listFeedback.failed);
  vi.useFakeTimers();
  try {
    await act(async () => {
      screen.getByRole('button', { name: enUS.listFeedback.retry }).click();
    });
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(
      screen.getByRole('button', { name: enUS.listFeedback.retrying }),
    ).toBeDisabled();
    await act(async () => {
      finish();
      await vi.advanceTimersByTimeAsync(0);
    });
  } finally {
    vi.useRealTimers();
  }
  expect(await screen.findByTitle('NocoBase team')).toBeVisible();
  expect(screen.queryByText(enUS.listFeedback.failed)).not.toBeInTheDocument();
});
