import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Routes, Route } from 'react-router';
import UsersPage from '../../client/pages/settings/users.js';
import RolesPage from '../../client/pages/settings/roles.js';
import { SettingsError } from '../../client/pages/settings/shared.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = '@nocobase/settings-feedback-test';
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
const userRow = {
  id: 'alice',
  name: 'Alice',
  email: 'alice@example.test',
  disabledAt: null as string | null,
  roleScopes: {},
};
const options = { data: { roleScopes: [] } };

describe.each([
  ['en-US', enUS],
  ['zh-CN', zhCN],
] as const)('%s', (language, copy) => {
  it.each(['users', 'roles'] as const)(
    'explains the next step for a read-only empty %s list',
    async (kind) => {
      await renderWithApp(
        <Routes>
          <Route
            path={`/settings/${kind}`}
            element={kind === 'users' ? <UsersPage /> : <RolesPage />}
          />
        </Routes>,
        {
          route: `/settings/${kind}`,
          locale: language,
          namespace,
          namespaces,
          services,
          fetch: answerApi(({ path }) => {
            if (path === 'authorization/permissions')
              return { data: { unrestricted: false, permissions: [] } };
            if (path === 'users/options') return options;
            return { data: [], meta: { total: 0 } };
          }),
        },
      );
      expect(
        await screen.findByText(
          kind === 'users'
            ? copy.settings.usersReadOnlyEmpty
            : copy.settings.rolesReadOnlyEmpty,
        ),
      ).toBeVisible();
      expect(
        screen.queryByRole('button', {
          name:
            kind === 'users' ? copy.settings.newUser : copy.settings.newRole,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(copy.settings.noResults),
      ).not.toBeInTheDocument();
    },
  );

  it.each(['users', 'roles'] as const)(
    'keeps a single creation entry for an authorized empty %s list',
    async (kind) => {
      await renderWithApp(
        <Routes>
          <Route
            path={`/settings/${kind}`}
            element={kind === 'users' ? <UsersPage /> : <RolesPage />}
          />
        </Routes>,
        {
          route: `/settings/${kind}`,
          locale: language,
          namespace,
          namespaces,
          services,
          fetch: answerApi(({ path }) => {
            if (path === 'authorization/permissions')
              return { data: { unrestricted: true, permissions: [] } };
            if (path === 'users/options') return options;
            return { data: [], meta: { total: 0 } };
          }),
        },
      );
      expect(
        await screen.findByRole('button', {
          name:
            kind === 'users' ? copy.settings.newUser : copy.settings.newRole,
        }),
      ).toHaveAttribute('href', `/settings/${kind}/create`);
      expect(
        screen.getAllByRole('button', {
          name:
            kind === 'users' ? copy.settings.newUser : copy.settings.newRole,
        }),
      ).toHaveLength(1);
      expect(
        screen.queryByText(
          kind === 'users'
            ? copy.settings.usersReadOnlyEmpty
            : copy.settings.rolesReadOnlyEmpty,
        ),
      ).not.toBeInTheDocument();
    },
  );

  it('guides correction of invalid input without replaying it or exposing raw errors', async () => {
    const retry = vi.fn();
    await renderWithApp(
      <SettingsError
        error={{ status: 400, message: 'secret database details' }}
        retry={retry}
      />,
      {
        locale: language,
        namespace,
        namespaces,
      },
    );
    expect(screen.getByText(copy.settings.invalidRequest)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: copy.settings.retry }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('secret database details'),
    ).not.toBeInTheDocument();
    expect(retry).not.toHaveBeenCalled();
  });

  it('keeps a retry for temporary failures and performs it only on demand', async () => {
    const retry = vi.fn();
    await renderWithApp(
      <SettingsError error={{ status: 503 }} retry={retry} />,
      {
        locale: language,
        namespace,
        namespaces,
      },
    );
    expect(screen.getByText(copy.settings.failed)).toBeVisible();
    expect(retry).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: copy.settings.retry }),
    );
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('does not describe every conflict as a role edit or offer a blind retry', async () => {
    await renderWithApp(
      <SettingsError error={{ status: 409 }} retry={vi.fn()} />,
      {
        locale: language,
        namespace,
        namespaces,
      },
    );
    expect(screen.getByText(copy.settings.conflict)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: copy.settings.retry }),
    ).not.toBeInTheDocument();
  });
});

it.each(['disable', 'enable', 'revokeSessions'] as const)(
  'reports a completed %s action only after the server succeeds',
  async (action) => {
    let complete!: (value: unknown) => void;
    const response = new Promise((resolve) => {
      complete = resolve;
    });
    const endpoint = action;
    const calls = vi.fn(({ path }: { path: string }) => {
      if (path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (path === 'users/options') return options;
      if (path === `users/alice/${endpoint}`) return response;
      return {
        data: [
          {
            ...userRow,
            disabledAt: action === 'enable' ? '2026-10-21T00:00:00Z' : null,
          },
        ],
        meta: { total: 1 },
      };
    });
    const view = await renderWithApp(<UsersPage />, {
      route: '/settings/users',
      namespace,
      namespaces,
      services,
      fetch: answerApi(calls),
    });
    await userEvent.click(
      await screen.findByRole('button', {
        name: enUS.settings[action],
        exact: true,
      }),
    );
    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(
      within(dialog).getByRole('button', {
        name: enUS.settings[action],
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(calls).toHaveBeenCalledWith(
        expect.objectContaining({ path: `users/alice/${endpoint}` }),
      ),
    );
    expect(view.toasts()).toHaveLength(0);
    expect(
      within(dialog).getByRole('button', { name: enUS.settings.saving }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: enUS.settings.cancel }),
    ).toBeDisabled();
    complete(
      action === 'revokeSessions'
        ? { data: null }
        : {
            data: {
              ...userRow,
              disabledAt: action === 'disable' ? '2026-10-21T00:00:00Z' : null,
            },
          },
    );
    await waitFor(() =>
      expect(view.toasts()).toMatchObject([
        {
          type: 'success',
          title: enUS.settings.userActionSaved[action].replace(
            '{{name}}',
            'Alice',
          ),
        },
      ]),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(
      calls.mock.calls.filter(
        ([call]) => call.path === `users/alice/${endpoint}`,
      ),
    ).toHaveLength(1);
  },
);

it('keeps a failed account action in its dialog with no success toast', async () => {
  const view = await renderWithApp(<UsersPage />, {
    route: '/settings/users',
    namespace,
    namespaces,
    services,
    fetch: answerApi(({ path }) => {
      if (path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (path === 'users/options') return options;
      if (path === 'users/alice/disable')
        return Response.json(
          { error: { code: 'FORBIDDEN', message: 'internal details' } },
          { status: 403 },
        );
      return { data: [userRow], meta: { total: 1 } };
    }),
  });
  await userEvent.click(
    await screen.findByRole('button', { name: 'Disable', exact: true }),
  );
  const dialog = await screen.findByRole('alertdialog');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Disable', exact: true }),
  );
  expect(await within(dialog).findByText(enUS.settings.denied)).toBeVisible();
  expect(view.toasts()).toHaveLength(0);
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeEnabled();
  expect(screen.queryByText('internal details')).not.toBeInTheDocument();
});
