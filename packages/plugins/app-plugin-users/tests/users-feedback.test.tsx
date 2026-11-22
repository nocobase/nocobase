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
import UsersPage from '../client/pages/users/users.js';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';

const namespace = '@nocobase/app-plugin-users';
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
  it.each(['users'] as const)(
    'keeps the compact empty status and hides creation for a read-only %s list',
    async (kind) => {
      await renderWithApp(
        <Routes>
          <Route path={`/settings/${kind}`} element={<UsersPage />} />
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
      expect((await screen.findByRole('status')).textContent).toBe(
        copy.listFeedback.empty,
      );
      expect(
        screen.queryByRole('button', {
          name: copy.management.newUser,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(copy.listFeedback.noResults),
      ).not.toBeInTheDocument();
    },
  );

  it.each(['users'] as const)(
    'keeps a single creation entry for an authorized empty %s list',
    async (kind) => {
      await renderWithApp(
        <Routes>
          <Route path={`/settings/${kind}`} element={<UsersPage />} />
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
          name: copy.management.newUser,
        }),
      ).toHaveAttribute('href', `/settings/${kind}/create`);
      expect(
        screen.getAllByRole('button', {
          name: copy.management.newUser,
        }),
      ).toHaveLength(1);
      expect(screen.getByRole('status').textContent).toBe(
        copy.listFeedback.empty,
      );
    },
  );
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
    // Account actions sit in the row's "⋮" menu (T1.5).
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Actions for Alice',
        expanded: false,
      }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', {
        name: enUS.management[action],
        exact: true,
      }),
    );
    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(
      within(dialog).getByRole('button', {
        name: enUS.management[action],
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
      within(dialog).getByRole('button', { name: enUS.management.saving }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: enUS.management.cancel }),
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
          title: enUS.management.userActionSaved[action].replace(
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
    await screen.findByRole('button', {
      name: 'Actions for Alice',
      expanded: false,
    }),
  );
  await userEvent.click(
    await screen.findByRole('menuitem', { name: 'Disable', exact: true }),
  );
  const dialog = await screen.findByRole('alertdialog');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Disable', exact: true }),
  );
  expect(await within(dialog).findByText(enUS.management.denied)).toBeVisible();
  expect(view.toasts()).toHaveLength(0);
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeEnabled();
  expect(screen.queryByText('internal details')).not.toBeInTheDocument();
});
