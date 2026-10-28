import { renderSettingsClient as renderWithApp } from '../helpers/settings-client.js';
import { answerApi } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, useLocation } from 'react-router';
import { expect, it, vi } from 'vitest';
import UsersPage from '../../client/pages/settings/users.js';
import UserDetail from '../../client/pages/settings/user-detail.js';
import UserForm from '../../client/pages/settings/user-form.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = '@nocobase/user-drawer-test';
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
const original = {
  id: 'alice',
  name: 'Alice',
  username: 'alice',
  email: 'alice@example.test',
  disabledAt: null,
  roleScopes: {},
};
const search = '?q=Ali&status=enabled&page=2&pageSize=20&order=desc';
function Location() {
  const location = useLocation();
  return (
    <output data-testid='location'>
      {location.pathname}
      {location.search}
    </output>
  );
}
function Pages({ base }: { readonly base: string }) {
  return (
    <>
      <Routes>
        <Route path={base} element={<UsersPage />}>
          <Route path='create' element={<UserForm />} />
          <Route path=':userId' element={<UserDetail />}>
            <Route path='edit' element={<UserForm />} />
          </Route>
        </Route>
        <Route path='*' element={<h1>Fallback home</h1>} />
      </Routes>
      <Location />
    </>
  );
}
async function renderUsers(
  base: string,
  child = '',
  unrestricted = true,
  withRole = false,
  actions: string[] = [],
  initialRoles: Record<string, string[]> = {},
  requiredRole = false,
  defaultRole = false,
) {
  let current = { ...original, roleScopes: initialRoles };
  let roleFailure = false;
  const calls = vi.fn(
    ({
      path,
      method,
      json,
    }: {
      path: string;
      method: string;
      json?: {
        name?: string;
        username?: string;
        email?: string;
        roleScopes?: Record<string, string[]>;
      };
    }) => {
      if (path === 'authorization/permissions')
        return {
          data: {
            unrestricted,
            permissions: actions.length
              ? [{ resource: { type: 'user', id: 'alice' }, actions }]
              : [],
          },
        };
      if (path === 'users/options')
        return {
          data: {
            roleScopes: withRole
              ? [
                  {
                    key: 'app',
                    label: 'Application',
                    selection: 'multiple',
                    requiredOnCreate: requiredRole,
                    ...(defaultRole ? { defaultValue: ['member'] } : {}),
                    options: [
                      { value: 'member', label: 'Member' },
                      { value: 'sales', label: 'Sales team' },
                      { value: 'finance', label: 'Finance team' },
                      {
                        value: 'root',
                        label: 'System administrator',
                        assignable: false,
                        removable: false,
                      },
                    ],
                  },
                ]
              : [],
          },
        };
      if (path === 'users/alice') {
        if (method === 'PATCH') {
          if (roleFailure)
            return Response.json(
              {
                error: {
                  code: 'INTERNAL_SERVER_ERROR',
                  message: 'Unavailable',
                },
              },
              { status: 500 },
            );
          current = {
            ...current,
            ...json,
            roleScopes: { ...current.roleScopes, ...json?.roleScopes },
          };
        }
        return { data: current };
      }
      return { data: [current], meta: { total: 41 } };
    },
  );
  const view = await renderWithApp(<Pages base={base} />, {
    route: `${base}${child}${search}`,
    namespace,
    namespaces,
    services,
    fetch: answerApi(calls),
  });
  return {
    ...view,
    calls,
    failRole: () => {
      roleFailure = true;
    },
  };
}

async function selectSales(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole('combobox', { name: 'Application', exact: true }),
  );
  await user.click(
    await screen.findByRole('option', { name: 'Sales team', exact: true }),
  );
  await user.keyboard('{Escape}');
}

it.each(['/users', '/settings/users'])(
  'opens name editing in a drawer with inline account actions and cancels to the same list at %s',
  async (base) => {
    const user = userEvent.setup();
    await renderUsers(base);
    const edit = await screen.findByRole('link', {
      name: 'Alice',
      exact: true,
    });
    expect(edit).toHaveAttribute('href', `${base}/alice/edit${search}`);
    expect(
      screen.getByRole('button', { name: 'Disable', exact: true }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Revoke sessions', exact: true }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Edit Alice' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Actions for Alice' }),
    ).not.toBeInTheDocument();
    if (base === '/users') {
      edit.focus();
      await user.keyboard('{Enter}');
    } else await user.click(edit);
    const panel = await screen.findByRole('dialog', { name: 'Edit user' });
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(panel).toHaveAttribute('data-presentation', 'drawer');
    const name = await within(panel).findByRole('textbox', { name: 'Name *' });
    await waitFor(() => expect(name).toHaveFocus());
    await user.click(
      within(panel).getByRole('button', { name: 'Cancel', exact: true }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('location')).toHaveTextContent(
      `${base}${search}`,
    );
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: enUS.settings.userSearch }),
      ).toHaveFocus(),
    );
    expect(screen.queryByText('Fallback home')).not.toBeInTheDocument();
  },
);

it.each(['/users', '/settings/users'])(
  'validates and saves profile fields from the sole fixed-footer Save at %s',
  async (base) => {
    const user = userEvent.setup();
    const view = await renderUsers(base, '/alice/edit');
    const name = await screen.findByRole('textbox', { name: 'Name *' });
    await waitFor(() => expect(name).toHaveValue('Alice'));
    const save = screen.getByRole('button', { name: 'Save', exact: true });
    expect(
      save.closest('[data-slot="route-overlay-footer"]'),
    ).toBeInTheDocument();
    await user.clear(name);
    await user.click(save);
    expect(await screen.findByText(enUS.settings.required)).toBeVisible();
    expect(
      view.calls.mock.calls.filter(([call]) => call.method === 'PATCH'),
    ).toHaveLength(0);
    await user.type(name, 'Alice updated');
    const form = name.closest('form')!;
    expect(save).toHaveProperty('form', form);
    fireEvent.submit(form);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(view.toasts()).toHaveLength(1);
    expect(view.calls).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'users/alice',
        method: 'PATCH',
        json: {
          name: 'Alice updated',
          username: 'alice',
          email: 'alice@example.test',
        },
      }),
    );
    // Refreshing remounts cells; permission loading can replace the name span with a link.
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-busy', 'false');
      const row = within(table).getByRole('row', {
        name: /alice@example\.test/u,
      });
      const updated = within(row).getByRole('link', {
        name: 'Alice updated',
        exact: true,
      });
      expect(updated).toBeVisible();
      expect(updated).toHaveAttribute('href', `${base}/alice/edit${search}`);
    });
    expect(screen.getByTestId('location')).toHaveTextContent(
      `${base}${search}`,
    );
  },
);

it('redirects legacy URLs and uses a searchable multi-select with one Save for both drafts', async () => {
  const user = userEvent.setup();
  const view = await renderUsers('/users', '/alice', true, true);
  const name = await screen.findByRole('textbox', { name: 'Name *' });
  await waitFor(() => expect(name).toHaveValue('Alice'));
  expect(screen.getByTestId('location')).toHaveTextContent(
    `/users/alice/edit${search}`,
  );
  expect(
    screen.getAllByRole('button', { name: 'Save', exact: true }),
  ).toHaveLength(1);
  await user.type(name, ' updated');
  await user.click(
    screen.getByRole('combobox', { name: 'Application', exact: true }),
  );
  const searchRoles = await screen.findByRole('combobox', {
    name: enUS.settings.searchRoles,
  });
  await user.type(searchRoles, 'Sales');
  expect(
    await screen.findByRole('option', { name: 'Sales team' }),
  ).toBeVisible();
  expect(
    screen.queryByRole('option', { name: 'Finance team' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: 'Sales team' }));
  await user.keyboard('{Escape}');
  expect(
    screen.getByRole('combobox', { name: 'Application', exact: true }),
  ).toHaveTextContent('Sales team');
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(view.calls).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'users/alice',
      method: 'PATCH',
      json: {
        name: 'Alice updated',
        username: 'alice',
        email: 'alice@example.test',
        roleScopes: { app: ['sales'] },
      },
    }),
  );
  expect(
    view.calls.mock.calls.filter(([call]) =>
      ['PATCH', 'PUT'].includes(call.method),
    ),
  ).toHaveLength(1);
});

it('retains both drafts on failed unified save and keeps one discard guard', async () => {
  const user = userEvent.setup();
  const view = await renderUsers('/users', '/alice/edit', true, true);
  view.failRole();
  const name = await screen.findByRole('textbox', { name: 'Name *' });
  await waitFor(() => expect(name).toHaveValue('Alice'));
  await user.type(name, ' draft');
  await selectSales(user);
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  expect(await screen.findByText(enUS.settings.failed)).toBeVisible();
  expect(name).toHaveValue('Alice draft');
  expect(
    screen.getByRole('combobox', { name: 'Application', exact: true }),
  ).toHaveTextContent('Sales team');
  expect(view.toasts()).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: 'Close', exact: true }));
  const confirm = await screen.findByRole('alertdialog');
  await user.click(
    within(confirm).getByRole('button', { name: 'Cancel', exact: true }),
  );
  expect(name).toHaveValue('Alice draft');
  await user.click(screen.getByRole('button', { name: 'Close', exact: true }));
  await user.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: 'Confirm',
      exact: true,
    }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

it('keeps names as plain text and hides account actions for read-only users', async () => {
  await renderUsers('/users', '', false, true, ['read']);
  expect(await screen.findByText('Alice', { exact: true })).toBeVisible();
  expect(
    screen.queryByRole('link', { name: 'Alice', exact: true }),
  ).not.toBeInTheDocument();
  for (const name of ['Disable', 'Enable', 'Revoke sessions'])
    expect(
      screen.queryByRole('button', { name, exact: true }),
    ).not.toBeInTheDocument();
});

it('keeps the editor read-only without management permission', async () => {
  await renderUsers('/users', '/alice/edit', false, true);
  expect(await screen.findByRole('textbox', { name: 'Name *' })).toBeDisabled();
  expect(
    await screen.findByRole('combobox', { name: 'Application', exact: true }),
  ).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: 'Save', exact: true }),
  ).not.toBeInTheDocument();
});

it('lets role-only managers save only roleScopes and prevents protected role selection', async () => {
  const user = userEvent.setup();
  const view = await renderUsers('/users', '', false, true, [
    'read',
    'assign-role',
  ]);
  const edit = await screen.findByRole('link', {
    name: 'Alice',
    exact: true,
  });
  expect(
    screen.queryByRole('button', { name: 'Actions for Alice' }),
  ).not.toBeInTheDocument();
  await user.click(edit);
  expect(await screen.findByRole('textbox', { name: 'Name *' })).toBeDisabled();
  await user.click(
    await screen.findByRole('combobox', { name: 'Application', exact: true }),
  );
  expect(
    await screen.findByRole('option', { name: 'System administrator' }),
  ).toHaveAttribute('aria-disabled', 'true');
  await user.click(screen.getByRole('option', { name: 'Sales team' }));
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(view.calls).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'PATCH',
      json: { roleScopes: { app: ['sales'] } },
    }),
  );
});

it('blocks closing and duplicate submission until the unified save completes', async () => {
  const user = userEvent.setup();
  let current = { ...original };
  let complete!: (value: unknown) => void;
  const pending = new Promise((resolve) => {
    complete = resolve;
  });
  const calls = vi.fn(({ path, method }: { path: string; method: string }) => {
    if (path === 'authorization/permissions')
      return { data: { unrestricted: true, permissions: [] } };
    if (path === 'users/options') return { data: { roleScopes: [] } };
    if (path === 'users/alice' && method === 'PATCH') return pending;
    if (path === 'users/alice') return { data: current };
    return { data: [current], meta: { total: 41 } };
  });
  const view = await renderWithApp(<Pages base='/users' />, {
    route: `/users/alice/edit${search}`,
    namespace,
    namespaces,
    services,
    fetch: answerApi(calls),
  });
  const name = await screen.findByRole('textbox', { name: 'Name *' });
  await waitFor(() => expect(name).toHaveValue('Alice'));
  await user.type(name, ' changed');
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() => expect(name).toBeDisabled());
  expect(
    screen.getByRole('button', { name: enUS.settings.saving }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Close', exact: true }));
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(view.toasts()).toHaveLength(0);
  current = { ...original, name: 'Alice changed' };
  complete({ data: current });
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(
    calls.mock.calls.filter(([call]) => call.method === 'PATCH'),
  ).toHaveLength(1);
});

it('preserves protected and unknown assignments and confirms actual removals before the one Save', async () => {
  const user = userEvent.setup();
  const view = await renderUsers('/users', '/alice/edit', true, true, [], {
    app: ['root', 'sales', 'legacy-role'],
    external: ['retained'],
  });
  const picker = await screen.findByRole('combobox', {
    name: 'Application',
    exact: true,
  });
  expect(picker).toHaveTextContent('legacy-role');
  await user.click(picker);
  expect(
    await screen.findByRole('option', { name: 'System administrator' }),
  ).toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByRole('option', { name: 'legacy-role' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await user.click(screen.getByRole('option', { name: 'Sales team' }));
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  const confirm = await screen.findByRole('alertdialog');
  expect(confirm).toHaveTextContent('Sales team');
  expect(
    view.calls.mock.calls.filter(([call]) => call.method === 'PATCH'),
  ).toHaveLength(0);
  await user.click(
    within(confirm).getByRole('button', { name: 'Save', exact: true }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(view.calls).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'PATCH',
      json: expect.objectContaining({
        roleScopes: { app: ['root', 'legacy-role'] },
      }),
    }),
  );
});

it('focuses and describes the required role dropdown when creating without a role', async () => {
  const user = userEvent.setup();
  const view = await renderUsers('/users', '/create', true, true, [], {}, true);
  await user.type(
    await screen.findByRole('textbox', { name: 'Name *' }),
    'New user',
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Email *' }),
    'new@example.test',
  );
  await user.type(
    screen.getByLabelText(`${enUS.settings.password} *`),
    'long-enough-password',
  );
  await user.click(screen.getByRole('button', { name: 'Create', exact: true }));
  const roles = screen.getByRole('combobox', {
    name: 'Application',
    exact: true,
  });
  await waitFor(() => expect(roles).toHaveFocus());
  expect(roles).toHaveAttribute('aria-invalid', 'true');
  expect(roles).toHaveAccessibleDescription(enUS.settings.required);
  expect(
    view.calls.mock.calls.filter(([call]) => call.method === 'POST'),
  ).toHaveLength(0);
});

it('uses Member only as a creation default and respects explicitly cleared selection', async () => {
  const user = userEvent.setup();
  const view = await renderUsers(
    '/users',
    '/create',
    true,
    true,
    [],
    {},
    false,
    true,
  );
  const roles = await screen.findByRole('combobox', {
    name: 'Application',
    exact: true,
  });
  expect(roles).toHaveTextContent('Member');
  await user.click(roles);
  await user.click(
    await screen.findByRole('option', { name: 'Member', exact: true }),
  );
  await user.keyboard('{Escape}');
  expect(roles).not.toHaveTextContent('Member');
  expect(screen.getByText(enUS.settings.noRoleAccess)).toBeVisible();
  await user.type(screen.getByRole('textbox', { name: 'Name *' }), 'Roleless');
  await user.type(
    screen.getByRole('textbox', { name: 'Email *' }),
    'roleless@example.test',
  );
  await user.type(
    screen.getByLabelText(`${enUS.settings.password} *`),
    'Roleless-test-123!',
  );
  await user.click(screen.getByRole('button', { name: 'Create', exact: true }));
  await waitFor(() =>
    expect(view.calls).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: 'users',
        json: expect.objectContaining({ roleScopes: { app: [] } }),
      }),
    ),
  );
});
