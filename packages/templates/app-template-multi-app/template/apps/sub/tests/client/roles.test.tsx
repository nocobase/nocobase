import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, useNavigate } from 'react-router';
import { expect, it, vi } from 'vitest';
import RolesPage from '../../client/pages/settings/roles.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
const settingsNamespace = '@nocobase/compact-role-test';
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

it('keeps the standard role table sorted, searchable and linked to the current query', async () => {
  const user = userEvent.setup();
  await renderWithApp(
    <Routes>
      <Route path='/settings/roles' element={<RolesPage />} />
    </Routes>,
    {
      route: '/settings/roles',
      namespace: settingsNamespace,
      namespaces,
      services,
      fetch: answerApi(({ path }) =>
        path === 'authorization/permissions'
          ? { data: { unrestricted: false, permissions: [] } }
          : {
              data: [
                { key: 'team', title: 'NocoBase team', grants: [] },
                { key: 'cp-customer', title: 'Customer', grants: [] },
                {
                  key: 'member',
                  title: 'Member',
                  grants: [],
                  protection: { allow: ['update'] },
                },
              ],
            },
      ),
    },
  );
  await screen.findByTitle('Customer');
  const region = screen.getByRole('region', {
    name: 'Roles and permissions',
  });
  const table = within(region).getByRole('table');
  expect(within(table).getAllByRole('columnheader')).toHaveLength(3);
  expect(
    within(table)
      .getAllByRole('link')
      .map((link) => link.textContent),
  ).toEqual(['Customer', 'Member', 'NocoBase team']);
  expect(
    screen.queryByRole('heading', { name: 'Customer' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'New role' }),
  ).not.toBeInTheDocument();
  await user.type(
    screen.getByRole('textbox', { name: 'Search role names' }),
    'Customer',
  );
  await waitFor(() => {
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(within(table).getAllByRole('link')).toHaveLength(1);
  });
  expect(screen.getByTitle('Customer').closest('a')).toHaveAttribute(
    'href',
    '/settings/roles/cp-customer/edit?q=Customer',
  );
});

function Navigate({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button type='button' onClick={() => void navigate(to)}>
      {label}
    </button>
  );
}

it('announces a slow retry after a refresh failure once, from the retry button', async () => {
  const user = userEvent.setup();
  const roles = { data: [{ key: 'team', title: 'NocoBase team', grants: [] }] };
  let reads = 0;
  let finish!: () => void;
  const slow = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await renderWithApp(
    <>
      <Routes>
        <Route path='/settings/roles' element={<RolesPage />}>
          <Route
            path='covered'
            element={<Navigate to='/settings/roles' label='Back to roles' />}
          />
        </Route>
      </Routes>
      <Navigate to='/settings/roles/covered' label='Cover roles' />
    </>,
    {
      route: '/settings/roles',
      namespace: settingsNamespace,
      namespaces,
      services,
      fetch: answerApi(async ({ path }) => {
        if (path === 'authorization/permissions')
          return { data: { unrestricted: true, permissions: [] } };
        reads += 1;
        if (reads === 2)
          return Response.json(
            { error: { status: 'INTERNAL', message: 'Unavailable' } },
            { status: 500 },
          );
        if (reads === 3) await slow;
        return roles;
      }),
    },
  );
  await screen.findByTitle('NocoBase team');
  // Returning from a covering route reads the list again; that read fails.
  await user.click(screen.getByRole('button', { name: 'Cover roles' }));
  await user.click(
    await screen.findByRole('button', { name: 'Back to roles' }),
  );
  await screen.findByText(enUS.listFeedback.refreshFailed);
  vi.useFakeTimers();
  try {
    await act(async () => {
      screen.getByRole('button', { name: enUS.listFeedback.retry }).click();
    });
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: enUS.listFeedback.retrying }),
    ).toBeDisabled();
    expect(screen.getByTitle('NocoBase team')).toBeVisible();
    await act(async () => {
      finish();
      await vi.advanceTimersByTimeAsync(0);
    });
  } finally {
    vi.useRealTimers();
  }
  await waitFor(() =>
    expect(
      screen.queryByText(enUS.listFeedback.refreshFailed),
    ).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
