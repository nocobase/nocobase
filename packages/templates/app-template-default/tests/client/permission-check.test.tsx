import { answerApi, type ApiCall } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  defineAppRoutes,
  defineClientPlugin,
} from '@nocobase/app-client/plugins';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { expect, it, vi } from 'vitest';
import { renderSettingsClient as renderWithApp } from '../helpers/settings-client.js';
import PermissionCheckPage from '../../client/pages/settings/permission-check.js';
import systemSettingsRoutes from '../../client/pages/settings/routes.js';
import { SETTINGS_GROUP } from '../../client/lib/navigation-transform.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const settingsNamespace = '@nocobase/permission-check-test';
const words = enUS.settings.permissionCheck;
const services = (app: ClientApplication) =>
  app.container.instance(
    authorizationClientToken,
    new AuthorizationClient(app.container.resolve(apiClientToken)),
  );
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
      // The System settings group of this application's routes.
      defineAppRoutes([
        {
          name: SETTINGS_GROUP,
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
      ]),
      systemSettingsRoutes,
    ],
  })(),
];
const options = {
  sections: [],
  recordAccess: [],
  subjectTypes: [],
  collections: [],
};
const people = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `u${index + 1}`,
    title: `User ${index + 1}`,
  }));

function api(
  answer: (call: ApiCall) => unknown,
): ReturnType<typeof vi.fn<(call: ApiCall) => unknown>> {
  return vi.fn((call: ApiCall) => {
    if (call.path === 'authorization/permissions')
      return { data: { unrestricted: true, permissions: [] } };
    if (call.path === 'authorization/inspector/options')
      return { data: options };
    return answer(call);
  });
}

function mount(route: string, calls: ReturnType<typeof api>) {
  return renderWithApp(
    <Routes>
      <Route
        path='/settings/permission-check'
        element={<PermissionCheckPage />}
      />
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

it('previews a role with more members than one request resolves, and finds any of them', async () => {
  const user = userEvent.setup();
  const members = people(101);
  const calls = api(({ path, json }) => {
    if (path === 'authorization/permissionSets')
      return { data: [{ key: 'sales', title: 'Sales' }] };
    if (path === 'authorization/permissionSets/sales/assignments')
      return {
        data: members.map((member) => ({
          id: `a-${member.id}`,
          subject: { type: 'user', id: member.id },
        })),
      };
    if (path === 'authorization/inspector/subjects/user/resolve') {
      const ids = (json as { ids: string[] }).ids;
      if (ids.length > 100) return new Response(null, { status: 400 });
      return { data: members.filter((member) => ids.includes(member.id)) };
    }
    return new Response(null, { status: 404 });
  });
  await mount('/settings/permission-check?role=sales', calls);
  const picker = await screen.findByRole('combobox', { name: words.user });
  await waitFor(() => expect(picker).not.toBeDisabled());
  const resolves = calls.mock.calls
    .map(([call]) => call)
    .filter((call) => call.path.endsWith('/resolve'));
  expect(
    resolves.map((call) => (call.json as { ids: string[] }).ids.length),
  ).toEqual([100, 1]);
  // Typing a name in the picker lists the matching members at once.
  await user.click(picker);
  await user.type(
    await screen.findByRole('combobox', { name: words.searchUsers }),
    'User 101',
  );
  expect(await screen.findByRole('option', { name: 'User 101' })).toBeVisible();
  await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
  // Searching within a role filters the members already listed instead of listing and resolving them again.
  expect(
    calls.mock.calls.filter(([call]) => call.path.endsWith('/assignments')),
  ).toHaveLength(1);
  expect(
    calls.mock.calls.filter(([call]) => call.path.endsWith('/resolve')),
  ).toHaveLength(2);
});

it('searches every user for any role and says when only the first page shows', async () => {
  const user = userEvent.setup();
  const everyone = people(150);
  const calls = api(({ path, query }) => {
    if (path === 'authorization/permissionSets') return { data: [] };
    if (path === 'authorization/inspector/subjects/user') {
      const q = typeof query?.q === 'string' ? query.q : '';
      const found = everyone.filter((item) => item.title.includes(q));
      return {
        data: found.slice(0, Number(query?.pageSize ?? 100)),
        meta: { total: found.length },
      };
    }
    return new Response(null, { status: 404 });
  });
  await mount('/settings/permission-check', calls);
  expect(
    await screen.findByText(/Showing 100 of 150 users/),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('combobox', { name: words.user }));
  await user.type(
    await screen.findByRole('combobox', { name: words.searchUsers }),
    'User 149',
  );
  await waitFor(() =>
    expect(calls).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'authorization/inspector/subjects/user',
        query: expect.objectContaining({ q: 'User 149' }),
      }),
    ),
  );
  await waitFor(() =>
    expect(screen.queryByText(/Showing \d+ of/)).not.toBeInTheDocument(),
  );
  expect(await screen.findByRole('option', { name: 'User 149' })).toBeVisible();
  await user.click(screen.getByRole('option', { name: 'User 149' }));
  expect(screen.getByRole('combobox', { name: words.user })).toHaveTextContent(
    'User 149',
  );
});

const users = () => ({ data: people(2), meta: { total: 2 } });

it('reports a failed role list', async () => {
  const failing = api(({ path }) => {
    if (path === 'authorization/permissionSets')
      return new Response(null, { status: 500 });
    if (path === 'authorization/inspector/subjects/user') return users();
    return new Response(null, { status: 404 });
  });
  await mount('/settings/permission-check', failing);
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(screen.getByRole('combobox', { name: words.role })).toBeVisible();
});

it('checks any role when roles cannot be read', async () => {
  const denied = api(({ path }) => {
    if (path === 'authorization/permissionSets')
      return new Response(null, { status: 403 });
    if (path === 'authorization/inspector/subjects/user') return users();
    return new Response(null, { status: 404 });
  });
  await mount('/settings/permission-check', denied);
  await waitFor(() =>
    expect(
      screen.getByRole('combobox', { name: words.user }),
    ).not.toBeDisabled(),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('combobox', { name: words.role }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('opens a preview link naming a role for any role when roles cannot be read', async () => {
  const user = userEvent.setup();
  const denied = api(({ path }) => {
    if (
      path === 'authorization/permissionSets' ||
      path.startsWith('authorization/permissionSets/')
    )
      return new Response(null, { status: 403 });
    if (path === 'authorization/inspector/subjects/user') return users();
    return new Response(null, { status: 404 });
  });
  await mount('/settings/permission-check?role=sales', denied);
  const picker = await screen.findByRole('combobox', { name: words.user });
  await waitFor(() => expect(picker).not.toBeDisabled());
  expect(
    screen.queryByRole('combobox', { name: words.role }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(denied).not.toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'authorization/permissionSets/sales/assignments',
    }),
  );
  await user.click(picker);
  expect(await screen.findByRole('option', { name: 'User 2' })).toBeVisible();
});

it('shows which menus a user sees and what they may do per business object', async () => {
  const decide = api(({ path, json }) => {
    if (path === 'authorization/permissionSets') return { data: [] };
    if (path === 'authorization/inspector/subjects/user') return users();
    if (path === 'authorization/inspector/configuredAccess')
      return { data: { unrestricted: false, sets: [] } };
    if (path === 'authorization/inspector/batchDecide') {
      const { checks } = json as {
        checks: { resource: { type: string; id: string }; action: string }[];
      };
      return {
        data: checks.map((check) => ({
          ...check,
          decision: {
            effect:
              check.resource.type === 'user' && check.action === 'read'
                ? 'permit'
                : check.resource.type === 'user' && check.action === 'update'
                  ? 'conditional'
                  : 'deny',
          },
        })),
      };
    }
    return new Response(null, { status: 404 });
  });
  await mount('/settings/permission-check?user=u1', decide);
  const objects = await screen.findByRole('heading', {
    name: enUS.settings.permissionEditor.objectsTab,
  });
  expect(
    screen.getByRole('heading', {
      name: enUS.settings.permissionEditor.menusTab,
    }),
  ).toBeVisible();
  const section = objects.parentElement!;
  // Allowed for all records: no hint of a limited range.
  expect(
    within(section).getByText(enUS.settings.readUsers, { exact: true }),
  ).toBeVisible();
  expect(
    within(section).getByText(
      `${enUS.settings.updateUsers} · ${words.effect.conditional}`,
    ),
  ).toBeVisible();
  // User management opens with reading users.
  expect(screen.getByText(/^1 of \d+ menus visible$/)).toBeVisible();
});
