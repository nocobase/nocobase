import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import { Link, Route, Routes } from 'react-router';
import { useState } from 'react';
import { RequiredRoleSetup } from '../../client/components/required-role-setup.js';
import {
  inspectRequiredRoles,
  requiredRoleSetupId,
  requiredRoleSetupLink,
} from '../../client/lib/required-role-setup.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = '@nocobase/setup-test';
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
const role = {
  scope: 'app',
  role: 'finance',
  title: 'Finance reviewer',
  description: 'Assign an enabled reviewer before finance review can run.',
};
const roles = [role];
const registered = {
  roleScopes: [
    {
      key: 'app',
      label: 'App roles',
      selection: 'multiple' as const,
      hasAuthenticatedDefaultAccess: true,
      requiredOnCreate: false,
      options: [{ value: 'finance', label: 'Finance' }],
    },
  ],
};
const id = requiredRoleSetupId(role);

it('reads only enabled members in the exact registered scope and deduplicates required roles', async () => {
  const client = {
    options: vi.fn().mockResolvedValue(registered),
    list: vi.fn().mockResolvedValue({ total: 0 }),
  };
  expect(await inspectRequiredRoles(client, [role, role])).toEqual({
    [id]: { status: 'missing', canConfigure: true },
  });
  expect(client.options).toHaveBeenCalledTimes(1);
  expect(client.list).toHaveBeenCalledTimes(1);
  expect(client.list).toHaveBeenCalledWith({
    roleScope: 'app',
    role: 'finance',
    status: 'enabled',
    page: 1,
    pageSize: 1,
  });
  client.list.mockResolvedValue({ total: 1 });
  expect((await inspectRequiredRoles(client, roles))[id]?.status).toBe('ready');
});

it.each(['unknown-role', 'unknown-scope', 'default-only-role'])(
  'does not misreport %s as missing membership',
  async (kind) => {
    const requirement =
      kind === 'unknown-role'
        ? { ...role, role: 'deleted' }
        : kind === 'unknown-scope'
          ? { ...role, scope: 'deleted' }
          : { ...role, role: 'authenticated-member' };
    const client = {
      options: vi.fn().mockResolvedValue({
        roleScopes: registered.roleScopes.map((scope) => ({
          ...scope,
          hasAuthenticatedDefaultAccess: true,
        })),
      }),
      list: vi.fn(),
    };
    expect(
      (await inspectRequiredRoles(client, [requirement]))[
        requiredRoleSetupId(requirement)
      ],
    ).toEqual({ status: 'unknown', reason: 'invalid' });
    expect(client.list).not.toHaveBeenCalled();
  },
);

it.each([undefined, -1, Number.NaN])(
  'treats malformed totals %s as unknown',
  async (total) => {
    const client = {
      options: vi.fn().mockResolvedValue(registered),
      list: vi.fn().mockResolvedValue({ total }),
    };
    expect((await inspectRequiredRoles(client, roles))[id]?.status).toBe(
      'unknown',
    );
  },
);

it('keeps partial inspection success and cannot configure a non-assignable missing role', async () => {
  const other = { ...role, role: 'manager' };
  const client = {
    options: vi.fn().mockResolvedValue({
      roleScopes: [
        {
          ...registered.roleScopes[0],
          options: [
            { value: 'finance', label: 'Finance', assignable: false },
            { value: 'manager', label: 'Manager' },
          ],
        },
      ],
    }),
    list: vi
      .fn()
      .mockImplementation(({ role: key }: { role: string }) =>
        key === 'finance'
          ? Promise.resolve({ total: 0 })
          : Promise.reject({ status: 403, message: 'private-server-detail' }),
      ),
  };
  expect(await inspectRequiredRoles(client, [role, other])).toEqual({
    [id]: { status: 'missing', canConfigure: false },
    [requiredRoleSetupId(other)]: { status: 'unknown', reason: 'forbidden' },
  });
});

it('does not read metadata for an empty declaration and validates the return destination', async () => {
  const client = { options: vi.fn(), list: vi.fn() };
  expect(await inspectRequiredRoles(client, [])).toEqual({});
  expect(client.options).not.toHaveBeenCalled();
  const url = new URL(
    requiredRoleSetupLink(role, '/processes/expense?tab=definition#review'),
    'https://app.test',
  );
  expect(Object.fromEntries(url.searchParams)).toEqual({
    roleScope: 'app',
    role: 'finance',
    status: 'enabled',
    returnTo: '/processes/expense?tab=definition#review',
  });
  expect(requiredRoleSetupLink(role, '//outside.test')).not.toContain(
    'returnTo',
  );
});

it('checks real API-client results, links to scoped management and rechecks on return and explicit refresh', async () => {
  let total = 0;
  const calls = vi.fn(
    ({ path, query }: { path: string; query?: Record<string, string> }) => {
      if (path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (path === 'users/options') return { data: registered };
      if (path === 'users') {
        expect(query).toMatchObject({
          status: 'enabled',
          roleScope: 'app',
          role: 'finance',
          pageSize: '1',
        });
        return { data: [], meta: { total, page: 1, pageSize: 1 } };
      }
      throw new Error(`Unexpected request: ${path}`);
    },
  );
  await renderWithApp(
    <Routes>
      <Route path='/process' element={<RequiredRoleSetup roles={roles} />} />
      <Route
        path='/settings/users'
        element={
          <Link to='/process?name=travel#review'>Return to workflow</Link>
        }
      />
    </Routes>,
    {
      route: '/process?name=travel#review',
      namespace,
      namespaces,
      services,
      fetch: answerApi(calls),
    },
  );
  const action = await screen.findByRole('link', {
    name: 'Manage Finance reviewer members',
  });
  expect(action).toHaveAttribute(
    'href',
    requiredRoleSetupLink(role, '/process?name=travel#review'),
  );
  await userEvent.click(action);
  total = 1;
  const beforeReturn = calls.mock.calls.filter(
    ([request]) => request.path === 'users',
  ).length;
  await userEvent.click(
    screen.getByRole('link', { name: 'Return to workflow' }),
  );
  await waitFor(() => {
    expect(
      calls.mock.calls.filter(([request]) => request.path === 'users').length,
    ).toBeGreaterThan(beforeReturn);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
  total = 0;
  fireEvent(window, new Event('focus'));
  await screen.findByRole('link', { name: 'Manage Finance reviewer members' });
  total = 1;
  const refresh = screen.getByRole('button', { name: 'Check again' });
  await userEvent.click(refresh);
  expect(
    await screen.findByText('The checked prerequisites are ready.'),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: 'Check again' })).toBe(refresh);
  expect(
    calls.mock.calls.every(
      ([request]) => !('method' in request) || request.method === 'GET',
    ),
  ).toBe(true);
});

it.each([false, true])(
  'never requests member data when access is %s or a declaration is absent',
  async (empty) => {
    const calls = vi.fn(({ path }: { path: string }) =>
      path === 'authorization/permissions'
        ? { data: { unrestricted: false, permissions: [] } }
        : (() => {
            throw new Error('No member reads permitted');
          })(),
    );
    const view = await renderWithApp(
      <RequiredRoleSetup roles={empty ? [] : roles} />,
      { namespace, namespaces, services, fetch: answerApi(calls) },
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(view.container).toBeEmptyDOMElement();
    expect(
      calls.mock.calls.some(([request]) => request.path.startsWith('users')),
    ).toBe(false);
  },
);

it('allows read-only inspection without offering role assignment', async () => {
  await renderWithApp(<RequiredRoleSetup roles={roles} />, {
    namespace,
    namespaces,
    services,
    fetch: answerApi(({ path }) =>
      path === 'authorization/permissions'
        ? {
            data: {
              unrestricted: false,
              permissions: [
                { resource: { type: 'user', id: '*' }, actions: ['read'] },
              ],
            },
          }
        : path === 'users/options'
          ? { data: registered }
          : { data: [], meta: { total: 0 } },
    ),
  });
  expect(await screen.findByText(role.description)).toBeVisible();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

it('uses short action copy for long role labels and rechecks the mounted feature after a successful inline save', async () => {
  let total = 0;
  const longRole = {
    ...role,
    title: 'Department finance reviewer '.repeat(12),
  };
  const requirements = [longRole];
  function Feature() {
    const [revision, setRevision] = useState(0);
    return (
      <>
        <button
          onClick={() => {
            total = 1;
            setRevision((value) => value + 1);
          }}
        >
          Save configuration fixture
        </button>
        <RequiredRoleSetup roles={requirements} refreshKey={String(revision)} />
      </>
    );
  }
  await renderWithApp(<Feature />, {
    namespace,
    namespaces,
    services,
    fetch: answerApi(({ path }) =>
      path === 'authorization/permissions'
        ? { data: { unrestricted: true, permissions: [] } }
        : path === 'users/options'
          ? { data: registered }
          : { data: [], meta: { total } },
    ),
  });
  const link = await screen.findByRole('link');
  expect(link.textContent).toBe('Manage members');
  expect(link).toHaveAttribute(
    'aria-label',
    `Manage ${longRole.title} members`,
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Save configuration fixture' }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('region')).not.toBeInTheDocument(),
  );
  expect(
    screen.queryByText('Checking current configuration…'),
  ).not.toBeInTheDocument();
});

it.each([
  null,
  {},
  { roleScopes: null },
  { roleScopes: [{ key: 'app', options: null }] },
])(
  'treats incompatible role metadata as an invalid check without reading users',
  async (metadata) => {
    const client = {
      options: vi.fn().mockResolvedValue(metadata),
      list: vi.fn(),
    };
    expect((await inspectRequiredRoles(client, roles))[id]).toEqual({
      status: 'unknown',
      reason: 'invalid',
    });
    expect(client.list).not.toHaveBeenCalled();
  },
);

it('ignores malformed unrelated metadata while checking a valid declared role', async () => {
  const client = {
    options: vi.fn().mockResolvedValue({
      roleScopes: [
        null,
        {
          ...registered.roleScopes[0],
          options: [null, ...registered.roleScopes[0]!.options],
        },
      ],
    }),
    list: vi.fn().mockResolvedValue({ total: 1 }),
  };
  expect((await inspectRequiredRoles(client, roles))[id]?.status).toBe('ready');
  expect(client.list).toHaveBeenCalledTimes(1);
});
