import { answerApi } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes, useNavigate } from 'react-router';
import { expect, it, vi } from 'vitest';
import { renderSettingsClient } from '../helpers/settings-client.js';
import UsersPage from '../../client/pages/settings/users.js';
import UserForm from '../../client/pages/settings/user-form.js';
import RolesPage from '../../client/pages/settings/roles.js';
import enUS from '../../client/locales/en-US.js';

const namespace = '@nocobase/idle-list-test';
const services = (app: ClientApplication) =>
  app.container.instance(
    authorizationClientToken,
    new AuthorizationClient(app.container.resolve(apiClientToken)),
  );
function ReturnToRoles() {
  const navigate = useNavigate();
  return (
    <button onClick={() => void navigate('/settings/roles')}>
      Return to roles
    </button>
  );
}

it.each(['users', 'roles'] as const)(
  'keeps a cold %s child route silent and starts real loading on return',
  async (kind) => {
    const listPath =
      kind === 'users' ? 'users' : 'authorization/permissionSets';
    let finish!: (value: unknown) => void;
    const response = new Promise((resolve) => {
      finish = resolve;
    });
    const calls = vi.fn(({ path }: { path: string }) => {
      if (path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (path === 'users/options') return { data: { roleScopes: [] } };
      if (path === listPath) return response;
      return new Response(null, { status: 404 });
    });
    await renderSettingsClient(
      <Routes>
        <Route path='/settings/users' element={<UsersPage />}>
          <Route path='create' element={<UserForm />} />
        </Route>
        <Route path='/settings/roles' element={<RolesPage />}>
          <Route path='create' element={<ReturnToRoles />} />
        </Route>
      </Routes>,
      {
        route: `/settings/${kind}/create`,
        namespace,
        namespaces: {
          [namespace]: { 'en-US': async () => ({ default: enUS }) },
        },
        services,
        fetch: answerApi(calls),
      },
    );
    // The real Users form is interactive; Roles uses the real list with a nested route.
    const close = await screen.findByRole('button', {
      name: kind === 'users' ? 'Cancel' : 'Return to roles',
      exact: true,
    });
    vi.useFakeTimers();
    try {
      await act(() => vi.advanceTimersByTimeAsync(10_000));
      expect(
        calls.mock.calls.filter(([call]) => call.path === listPath),
      ).toHaveLength(0);
      expect(document.querySelector('[data-slot="loading"]')).toBeNull();
      expect(screen.queryByText(enUS.pendingFeedback.longWait)).toBeNull();
      expect(screen.queryByText(enUS.listFeedback.empty)).toBeNull();
      await act(async () => {
        fireEvent.click(close);
      });
      expect(
        calls.mock.calls.filter(([call]) => call.path === listPath),
      ).toHaveLength(1);
      await act(() => vi.advanceTimersByTimeAsync(299));
      expect(screen.queryByRole('status')).toBeNull();
      await act(() => vi.advanceTimersByTimeAsync(1));
      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(screen.getByRole('status')).toHaveTextContent(
        enUS.listFeedback.loading,
      );
      await act(async () => {
        finish(
          kind === 'users'
            ? {
                data: [
                  {
                    id: 'alice',
                    name: 'Alice',
                    username: 'alice',
                    email: 'alice@example.test',
                    roleScopes: {},
                    disabledAt: null,
                  },
                ],
                meta: { total: 1 },
              }
            : { data: [{ key: 'team', title: 'Team', grants: [] }] },
        );
        await response;
      });
    } finally {
      finish({ data: [], meta: { total: 0 } });
      vi.useRealTimers();
    }
    await waitFor(() =>
      expect(
        screen.getByText(kind === 'users' ? 'Alice' : 'Team', { exact: true }),
      ).toBeVisible(),
    );
    expect(screen.queryByRole('status')).toBeNull();
  },
);
