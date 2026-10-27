import { renderSettingsClient as renderWithApp } from '../helpers/settings-client.js';
import { answerApi } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, useLocation } from 'react-router';
import { expect, it, vi } from 'vitest';
import UsersPage from '../../client/pages/settings/users.js';
import UserDetail from '../../client/pages/settings/user-detail.js';
import UserForm from '../../client/pages/settings/user-form.js';
import RolesPage from '../../client/pages/settings/roles.js';
import { BackButton } from '../../client/components/back-button.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
const namespace = '@nocobase/continuity-test';
const namespaces = {
  [namespace]: {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  },
};
const services = (app: ClientApplication) =>
  app.container.instance(
    authorizationClientToken,
    new AuthorizationClient(app.container.resolve(apiClientToken)),
  );
const options = {
  data: {
    roleScopes: [
      {
        key: 'app',
        label: 'Application',
        selection: 'multiple',
        requiredOnCreate: false,
        options: [{ value: 'sales', label: 'Sales team' }],
      },
    ],
  },
};
const row = {
  id: 'alice',
  name: 'Alice',
  username: 'alice',
  email: 'alice@example.test',
  disabledAt: null,
  roleScopes: { app: ['sales', 'retired-role'] },
};
function Location() {
  const location = useLocation();
  return (
    <output data-testid='location'>
      {location.pathname}
      {location.search}
    </output>
  );
}

it('uses role labels and paired server filters, retaining the source and ordering when clearing filters', async () => {
  const calls = vi.fn(({ path }: { path: string }) =>
    path === 'authorization/permissions'
      ? { data: { unrestricted: false, permissions: [] } }
      : path === 'users/options'
        ? options
        : { data: [row], meta: { total: 41 } },
  );
  const source = '/settings/processes/loan?tab=definition#review';
  await renderWithApp(
    <>
      <UsersPage />
      <Location />
    </>,
    {
      route: `/settings/users?roleScope=app&role=sales&page=2&pageSize=20&order=desc&returnTo=${encodeURIComponent(source)}`,
      namespace,
      namespaces,
      services,
      fetch: answerApi(calls),
    },
  );
  expect(await screen.findByText('Sales team, retired-role')).toBeVisible();
  expect(
    screen.getByRole('link', { name: 'Return to previous page' }),
  ).toHaveAttribute('href', source);
  expect(screen.getByText('Alice', { exact: true })).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Alice' })).not.toBeInTheDocument();
  expect(calls).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'users',
      query: expect.objectContaining({
        roleScope: 'app',
        role: 'sales',
        page: '2',
        order: 'desc',
      }),
    }),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  await waitFor(() =>
    expect(screen.getByTestId('location').textContent).not.toContain(
      'roleScope=',
    ),
  );
  const after = screen.getByTestId('location').textContent!;
  expect(after).toContain('pageSize=20');
  expect(after).toContain('order=desc');
  expect(after).toContain('returnTo=');
  await waitFor(() =>
    expect(calls).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'users',
        query: { page: '1', pageSize: '20', sort: 'name', order: 'desc' },
      }),
    ),
  );
});

it('does not silently discard an incomplete role filter or expose an external return link', async () => {
  const calls = vi.fn(
    ({ path, query }: { path: string; query?: Record<string, string> }) => {
      if (path === 'authorization/permissions')
        return { data: { unrestricted: false, permissions: [] } };
      if (path === 'users/options') return options;
      if (query?.role)
        return Response.json(
          { error: { code: 'INVALID_ARGUMENT', message: 'Invalid filter' } },
          { status: 400 },
        );
      return { data: [row], meta: { total: 1 } };
    },
  );
  await renderWithApp(<UsersPage />, {
    route: '/settings/users?role=sales&returnTo=https%3A%2F%2Foutside.test',
    namespace,
    namespaces,
    services,
    fetch: answerApi(calls),
  });
  expect(
    await screen.findByText(enUS.settings.roleFilterIncomplete),
  ).toBeVisible();
  await waitFor(() =>
    expect(calls).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'users',
        query: expect.objectContaining({ role: 'sales' }),
      }),
    ),
  );
  expect(screen.queryByRole('link', { name: 'Alice' })).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Return to previous page' }),
  ).not.toBeInTheDocument();
  expect(
    calls.mock.calls
      .filter(([call]) => call.path === 'users')
      .every(([call]) => call.query?.role === 'sales'),
  ).toBe(true);
});

it('resolves localized role descriptors through their namespace without rewriting unknown assignments', async () => {
  const localized = {
    data: {
      roleScopes: [
        {
          ...options.data.roleScopes[0],
          options: [
            {
              value: 'sales',
              label: 'Fallback',
              labelI18nKey: 'settings.roles',
              labelI18nNs: namespace,
            },
          ],
        },
      ],
    },
  };
  await renderWithApp(<UsersPage />, {
    locale: 'zh-CN',
    namespace,
    namespaces,
    services,
    fetch: answerApi(({ path }) =>
      path === 'authorization/permissions'
        ? { data: { unrestricted: false, permissions: [] } }
        : path === 'users/options'
          ? localized
          : { data: [row], meta: { total: 1 } },
    ),
  });
  expect(
    await screen.findByText(`${zhCN.settings.roles}, retired-role`),
  ).toBeVisible();
});

it.each(['/settings/users', '/users'])(
  'keeps a failed edit draft, updates the actual user on retry, and closes to the same filtered list at %s',
  async (base) => {
    const user = userEvent.setup();
    let current = row;
    let fail = true;
    const calls = vi.fn(
      ({
        path,
        method,
        json,
      }: {
        path: string;
        method: string;
        json?: { name: string };
      }) => {
        if (path === 'authorization/permissions')
          return { data: { unrestricted: true, permissions: [] } };
        if (path === 'users/options') return options;
        if (path === 'users/alice' && method === 'PATCH') {
          if (fail) {
            fail = false;
            return Response.json(
              {
                error: {
                  code: 'INTERNAL_SERVER_ERROR',
                  message: 'Unavailable',
                },
              },
              { status: 500 },
            );
          }
          current = { ...current, name: json!.name };
          return { data: current };
        }
        if (path === 'users/alice') return { data: current };
        return { data: [current], meta: { total: 41 } };
      },
    );
    const search = '?page=2&pageSize=20&roleScope=app&role=sales';
    await renderWithApp(
      <>
        <Routes>
          <Route path={base} element={<UsersPage />}>
            <Route path=':userId' element={<UserDetail />}>
              <Route path='edit' element={<UserForm />} />
            </Route>
          </Route>
        </Routes>
        <Location />
      </>,
      {
        route: `${base}/alice/edit${search}`,
        namespace,
        namespaces,
        services,
        fetch: answerApi(calls),
      },
    );
    const name = await screen.findByRole('textbox', { name: 'Name *' });
    await waitFor(() => expect(name).toHaveValue('Alice'));
    await user.clear(name);
    await user.type(name, 'Alice updated');
    await user.click(
      screen.getByRole('button', {
        name: 'Save',
        exact: true,
      }),
    );
    expect(await screen.findByText(enUS.settings.failed)).toBeVisible();
    expect(name).toHaveValue('Alice updated');
    expect(screen.getByTestId('location')).toHaveTextContent('/edit');
    await user.click(
      screen.getByRole('button', {
        name: 'Save',
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        `${base}${search}`,
      ),
    );
    await waitFor(() =>
      expect(screen.getByText('Alice updated', { exact: true })).toBeVisible(),
    );
  },
);

it('restores a controlled role table from URL after unmounting a detail view', async () => {
  const roles = Array.from({ length: 25 }, (_, i) => ({
    key: `role-${i}`,
    title: `Role ${String(i).padStart(2, '0')}`,
    grants: [],
  }));
  const user = userEvent.setup();
  await renderWithApp(
    <>
      <Routes>
        <Route path='/settings/roles' element={<RolesPage />} />
        <Route
          path='/settings/roles/:id/edit'
          element={
            <BackButton
              to={{
                pathname: '/settings/roles',
                search: '?page=2&pageSize=10&sort=title&order=desc',
              }}
            />
          }
        />
      </Routes>
      <Location />
    </>,
    {
      route: '/settings/roles?page=2&pageSize=10&sort=title&order=desc',
      namespace,
      namespaces,
      services,
      fetch: answerApi(({ path }) =>
        path === 'authorization/permissions'
          ? { data: { unrestricted: false, permissions: [] } }
          : { data: roles },
      ),
    },
  );
  const link = await screen.findByRole('link', {
    name: 'Role 14',
    exact: true,
  });
  expect(screen.getByText('Page 2 of 3')).toBeVisible();
  expect(
    within(screen.getAllByRole('row')[1]!).getByText('Role 14'),
  ).toBeVisible();
  await user.click(link);
  await user.click(screen.getByRole('link', { name: 'Back' }));
  expect(
    await screen.findByRole('link', { name: 'Role 14', exact: true }),
  ).toBeVisible();
  expect(screen.getByText('Page 2 of 3')).toBeVisible();
});

it('keeps loaded users visible when role labels fail and provides retry without an empty actions menu', async () => {
  await renderWithApp(<UsersPage />, {
    namespace,
    namespaces,
    services,
    fetch: answerApi(({ path }) =>
      path === 'authorization/permissions'
        ? { data: { unrestricted: false, permissions: [] } }
        : path === 'users/options'
          ? Response.json(
              {
                error: {
                  code: 'INTERNAL_SERVER_ERROR',
                  message: 'Unavailable',
                },
              },
              { status: 500 },
            )
          : { data: [row], meta: { total: 1 } },
    ),
  });
  expect(await screen.findByText('Alice', { exact: true })).toBeVisible();
  expect(await screen.findByText('sales, retired-role')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Actions for Alice' }),
  ).not.toBeInTheDocument();
});

it('refreshes a filtered list after disabling a user, corrects an empty last page and restores search focus', async () => {
  let disabled = false;
  const user = userEvent.setup();
  await renderWithApp(
    <>
      <Routes>
        <Route path='/settings/users' element={<UsersPage />} />
      </Routes>
      <Location />
    </>,
    {
      route: '/settings/users?status=enabled&page=2&pageSize=20',
      namespace,
      namespaces,
      services,
      fetch: answerApi(({ path }) => {
        if (path === 'authorization/permissions')
          return { data: { unrestricted: true, permissions: [] } };
        if (path === 'users/options') return options;
        if (path === 'users/alice/disable') {
          disabled = true;
          return { data: { ...row, disabledAt: '2026-10-21T00:00:00Z' } };
        }
        return {
          data: disabled ? [] : [row],
          meta: { total: disabled ? 20 : 21 },
        };
      }),
    },
  );
  await user.click(
    await screen.findByRole('button', { name: 'Disable', exact: true }),
  );
  await user.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Disable',
      exact: true,
    }),
  );
  await waitFor(() =>
    expect(
      screen.queryByText('Alice', { exact: true }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(screen.getByTestId('location')).toHaveTextContent('page=1'),
  );
  expect(screen.getByTestId('location')).toHaveTextContent('status=enabled');
  await waitFor(() =>
    expect(
      screen.getByRole('textbox', { name: enUS.settings.userSearch }),
    ).toHaveFocus(),
  );
});
