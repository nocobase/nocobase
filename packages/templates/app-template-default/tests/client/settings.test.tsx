import { renderSettingsClient as renderWithApp } from '../helpers/settings-client.js';
import { answerApi } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import {
  defineAppRoutes,
  defineClientPlugin,
} from '@nocobase/app-client/plugins';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, useNavigate } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import UserForm from '../../client/pages/settings/user-form.js';
import UsersPage from '../../client/pages/settings/users.js';
import RoleForm from '../../client/pages/settings/role-form.js';
import RolesPage from '../../client/pages/settings/roles.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
const settingsNamespace = '@nocobase/settings-test';
const userRow = {
  id: 'alice',
  name: 'Alice',
  email: 'alice@example.test',
  disabledAt: null,
  roleScopes: { app: ['sales'] },
};
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

describe('template system settings', () => {
  it('loads real client data, searches without losing typed input and hides actions without permission', async () => {
    const user = userEvent.setup();
    const calls = vi.fn(({ path }: { path: string }) =>
      path === 'authorization/permissions'
        ? { data: { unrestricted: false, permissions: [] } }
        : { data: [userRow], meta: { total: 1 } },
    );
    await renderWithApp(<UsersPage />, {
      namespace: settingsNamespace,
      namespaces,
      services,
      fetch: answerApi(calls),
    });
    expect(await screen.findByText('Alice', { exact: true })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'New user' }),
    ).not.toBeInTheDocument();
    const search = screen.getByRole('textbox', {
      name: enUS.settings.userSearch,
    });
    await user.type(search, 'Ali');
    await waitFor(() =>
      expect(calls).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'users',
          query: expect.objectContaining({ q: 'Ali' }),
        }),
      ),
    );
    expect(search).toHaveValue('Ali');
  });
  it('waits for Chinese composition and restores the textbox from history query changes', async () => {
    const calls = vi.fn(({ path }: { path: string }) =>
      path === 'authorization/permissions'
        ? { data: { unrestricted: false, permissions: [] } }
        : { data: [userRow], meta: { total: 1 } },
    );
    function HistoryControls() {
      const navigate = useNavigate();
      return (
        <button onClick={() => void navigate('?q=Bob')}>External query</button>
      );
    }
    await renderWithApp(
      <>
        <UsersPage />
        <HistoryControls />
      </>,
      {
        namespace: settingsNamespace,
        namespaces,
        services,
        fetch: answerApi(calls),
      },
    );
    const search = screen.getByRole('textbox', {
      name: enUS.settings.userSearch,
    });
    fireEvent.compositionStart(search);
    fireEvent.change(search, { target: { value: '张三' } });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(
      calls.mock.calls.some(
        ([call]) => Reflect.get(call, 'query')?.q === '张三',
      ),
    ).toBe(false);
    fireEvent.compositionEnd(search);
    await waitFor(() =>
      expect(calls).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'users',
          query: expect.objectContaining({ q: '张三' }),
        }),
      ),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'External query' }),
    );
    await waitFor(() => expect(search).toHaveValue('Bob'));
  });
  it('shows failed role options with retry and prevents incomplete saves', async () => {
    const calls = vi.fn(({ path }: { path: string }) => {
      if (path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (path.endsWith('/options'))
        return Response.json(
          { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unavailable' } },
          { status: 500 },
        );
      return { data: [{ key: 'sales', title: 'Sales', grants: [] }] };
    });
    await renderWithApp(
      <Routes>
        <Route path='/settings/roles' element={<RolesPage />}>
          <Route path='create' element={<RoleForm />} />
        </Route>
      </Routes>,
      {
        route: '/settings/roles/create',
        namespace: settingsNamespace,
        namespaces,
        services,
        fetch: answerApi(calls),
      },
    );
    expect((await screen.findAllByText(enUS.settings.failed))[0]).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Save', exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Retry' }).length,
    ).toBeGreaterThan(0);
    expect(
      calls.mock.calls.some(([call]) => Reflect.get(call, 'method') === 'POST'),
    ).toBe(false);
  });
  it('keeps user creation disabled and displays a retry when role options fail', async () => {
    const calls = vi.fn(({ path }: { path: string }) => {
      if (path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (path.endsWith('/options'))
        return Response.json(
          { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unavailable' } },
          { status: 500 },
        );
      return { data: [userRow], meta: { total: 1 } };
    });
    await renderWithApp(
      <Routes>
        <Route path='/settings/users' element={<UsersPage />}>
          <Route path='create' element={<UserForm />} />
        </Route>
      </Routes>,
      {
        route: '/settings/users/create',
        namespace: settingsNamespace,
        namespaces,
        services,
        fetch: answerApi(calls),
      },
    );
    expect((await screen.findAllByText(enUS.settings.failed))[0]).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Create', exact: true }),
    ).toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'Retry' }).length,
    ).toBeGreaterThan(0);
  });
  it('preserves the role draft on a conditional save conflict and submits the original revision', async () => {
    const user = userEvent.setup();
    const calls = vi.fn(
      ({ path, method }: { path: string; method: string }) => {
        if (path === 'authorization/permissions')
          return { data: { unrestricted: true, permissions: [] } };
        if (path.endsWith('/options'))
          return {
            data: {
              sections: [
                {
                  name: 'administration',
                  title: 'Business operations',
                  order: 0,
                  subsections: [
                    {
                      name: 'settings',
                      title: 'Settings',
                      resources: [
                        {
                          type: 'settings',
                          id: 'authorization.permission-sets',
                          title: 'Roles',
                          actions: [{ name: 'read', title: 'Read roles' }],
                        },
                      ],
                    },
                  ],
                },
              ],
              recordAccess: [],
              subjectTypes: [],
              collections: [],
            },
          };
        if (path === 'authorization/permissionSets')
          return {
            data: [
              {
                key: 'sales',
                title: 'Sales',
                grants: [],
                revision: 'version-1',
              },
            ],
          };
        if (method === 'PATCH')
          return Response.json(
            {
              error: {
                code: 'ALREADY_EXISTS',
                message: 'Conflict',
                reason: 'PERMISSION_SET_CONFLICT',
              },
            },
            { status: 409 },
          );
        return {
          data: {
            key: 'sales',
            title: 'Sales',
            grants: [],
            revision: 'version-1',
          },
        };
      },
    );
    await renderWithApp(
      <Routes>
        <Route path='/settings/roles' element={<RolesPage />}>
          <Route path=':key/edit' element={<RoleForm />} />
        </Route>
      </Routes>,
      {
        route: '/settings/roles/sales/edit',
        plugins: [
          defineClientPlugin({
            packageName: settingsNamespace,
            routes: defineAppRoutes([
              {
                name: 'roles',
                path: '/role-config',
                componentLoader: async () => ({ default: () => null }),
                authz: {
                  resource: {
                    type: 'settings',
                    id: 'authorization.permission-sets',
                  },
                  action: 'read',
                },
              },
            ]),
          })(),
        ],
        namespace: settingsNamespace,
        namespaces,
        services,
        fetch: answerApi(calls),
      },
    );
    const toggle = await screen.findByRole('checkbox', { name: 'Read roles' });
    await waitFor(() =>
      expect(toggle).not.toHaveAttribute('aria-disabled', 'true'),
    );
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
    expect(await screen.findByText(enUS.settings.conflict)).toBeVisible();
    expect(toggle).toBeChecked();
    expect(calls).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        json: expect.objectContaining({
          expectedRevision: 'version-1',
          grants: [
            {
              resource: {
                type: 'settings',
                id: 'authorization.permission-sets',
              },
              actions: [{ action: 'read' }],
            },
          ],
        }),
      }),
    );
  });
});
