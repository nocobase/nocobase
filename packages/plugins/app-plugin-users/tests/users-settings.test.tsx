import { renderSettingsClient as renderWithApp } from './helpers/settings-client.js';
import { answerApi } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, useNavigate } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import UserForm from '../client/pages/users/user-form.js';
import UsersPage from '../client/pages/users/users.js';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';
const settingsNamespace = '@nocobase/app-plugin-users';
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

describe('User management pages', () => {
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
      name: enUS.management.userSearch,
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
      name: enUS.management.userSearch,
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
    expect(
      (await screen.findAllByText(enUS.management.failed))[0],
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Create', exact: true }),
    ).toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'Retry' }).length,
    ).toBeGreaterThan(0);
  });
});
