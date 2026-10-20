import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
  type AuthorizationOptionsResponse,
} from '@nocobase/app-plugin-authorization/client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { expect, it, vi } from 'vitest';
import Page from '../../client/pages/settings/default-access.js';
import Form from '../../client/pages/settings/default-access-form.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
const namespace = '@nocobase/default-access-test';
const services = (app: ClientApplication) =>
  app.container.instance(
    authorizationClientToken,
    new AuthorizationClient(app.container.resolve(apiClientToken)),
  );
const namespaces = {
  [namespace]: {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  },
};
const catalog: AuthorizationOptionsResponse = {
  sections: [
    {
      name: 'business',
      title: 'Business',
      order: 0,
      subsections: [
        {
          name: 'projects',
          title: 'Projects',
          resources: [
            {
              type: 'composite',
              id: 'projects',
              title: 'Projects',
              actions: [
                { name: 'view', title: 'View' },
                { name: 'edit', title: 'Edit' },
              ],
              dataScopes: {
                view: [
                  {
                    key: 'projects',
                    title: 'Projects',
                    collection: 'projects',
                    fields: ['name'],
                    recordAccess: ['own', 'customFilter'],
                  },
                ],
                edit: [
                  {
                    key: 'projects',
                    title: 'Projects',
                    collection: 'projects',
                    fields: ['name'],
                    recordAccess: ['own', 'customFilter'],
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  recordAccess: [
    { key: 'own', title: 'Own records', collections: ['projects'] },
    { key: 'customFilter', title: 'Custom filter', collections: ['projects'] },
  ],
  subjectTypes: [],
  collections: [],
};
const existing = {
  key: 'project-default',
  resource: { type: 'composite', id: 'projects' },
  actions: [
    {
      action: 'view',
      scopeKey: 'projects',
      selection: {
        type: 'recordAccess',
        key: 'customFilter',
        params: { filter: { $and: [{ name: { $eq: 'Original' } }] } },
      },
    },
    {
      action: 'edit',
      scopeKey: 'projects',
      selection: { type: 'recordAccess', key: 'own' },
    },
  ],
};
function tree() {
  return (
    <Routes>
      <Route path='/default-access' element={<Page />}>
        <Route path='create' element={<Form />} />
        <Route path=':key/edit' element={<Form />} />
      </Route>
    </Routes>
  );
}

it('loads and inspects existing scopes without writes, preserving nested filters on opening and cancelling', async () => {
  const user = userEvent.setup();
  const calls = vi.fn(({ path }: { path: string }) =>
    path === 'authorization/permissions'
      ? { data: { unrestricted: true, permissions: [] } }
      : path.endsWith('/options')
        ? { data: catalog }
        : { data: [existing] },
  );
  await renderWithApp(tree(), {
    route: '/default-access/project-default/edit?q=Projects',
    namespace,
    namespaces,
    services,
    fetch: answerApi(calls),
  });
  expect(await screen.findByRole('textbox', { name: 'Key *' })).toHaveValue(
    existing.key,
  );
  await screen.findByRole('combobox', { name: 'Edit · Projects' });
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('textbox', { name: 'Key *' }),
    ).not.toBeInTheDocument(),
  );
  expect(
    calls.mock.calls.every(
      ([request]) =>
        !('method' in request) || Reflect.get(request, 'method') === 'GET',
    ),
  ).toBe(true);
  expect(
    screen.getByRole('textbox', { name: 'Search business objects or keys' }),
  ).toHaveValue('Projects');
});
it('patches only the chosen scope and keeps the advanced filter in the other action', async () => {
  const user = userEvent.setup();
  let saved: unknown;
  const calls = vi.fn(
    (request: { path: string; method?: string; json?: unknown }) => {
      if (request.path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (request.path.endsWith('/options')) return { data: catalog };
      if (request.method === 'PATCH') {
        saved = request.json;
        return { data: existing };
      }
      return { data: [existing] };
    },
  );
  await renderWithApp(tree(), {
    route: '/default-access/project-default/edit',
    namespace,
    namespaces,
    services,
    fetch: answerApi(calls),
  });
  await user.click(
    await screen.findByRole('combobox', { name: 'Edit · Projects' }),
  );
  await user.click(await screen.findByRole('option', { name: 'All records' }));
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(saved).toEqual({
      actions: [
        existing.actions[0],
        { action: 'edit', scopeKey: 'projects', selection: { type: 'all' } },
      ],
    }),
  );
});
it('supports read-only inspection and does not show write or delete actions without permission', async () => {
  await renderWithApp(tree(), {
    route: '/default-access/project-default/edit',
    namespace,
    namespaces,
    services,
    fetch: answerApi(({ path }) =>
      path === 'authorization/permissions'
        ? { data: { unrestricted: false, permissions: [] } }
        : path.endsWith('/options')
          ? { data: catalog }
          : { data: [existing] },
    ),
  });
  expect(
    await screen.findByRole('combobox', { name: 'Edit · Projects' }),
  ).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: 'Save' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'New default scope' }),
  ).not.toBeInTheDocument();
});
it('shows unknown rules read-only and refuses overwriting a rule changed after loading', async () => {
  const user = userEvent.setup();
  let count = 0;
  let writes = 0;
  await renderWithApp(tree(), {
    route: '/default-access/project-default/edit',
    namespace,
    namespaces,
    services,
    fetch: answerApi(({ path, method }) => {
      if (path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (path.endsWith('/options')) return { data: catalog };
      if (method === 'PATCH') writes++;
      count++;
      return { data: [count > 2 ? { ...existing, actions: [] } : existing] };
    }),
  });
  await user.click(
    await screen.findByRole('combobox', { name: 'Edit · Projects' }),
  );
  await user.click(await screen.findByRole('option', { name: 'All records' }));
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(
    await screen.findByText(enUS.settings.defaultAccess.changed),
  ).toBeVisible();
  expect(writes).toBe(0);
});
it('keeps unavailable catalog selections visible and read-only rather than creating a replacement rule', async () => {
  await renderWithApp(tree(), {
    route: '/default-access/project-default/edit',
    namespace,
    namespaces,
    services,
    fetch: answerApi(({ path }) =>
      path === 'authorization/permissions'
        ? { data: { unrestricted: true, permissions: [] } }
        : path.endsWith('/options')
          ? { data: { ...catalog, sections: [] } }
          : { data: [existing] },
    ),
  });
  expect(
    await screen.findByText(enUS.settings.defaultAccess.unsupported),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(screen.getByRole('textbox', { name: 'Key *' })).toHaveValue(
    existing.key,
  );
});

it.each(['en-US', 'zh-CN'])(
  'creates an explicitly configured rule in %s without adding all-records grants',
  async (locale) => {
    const copy = locale === 'zh-CN' ? zhCN : enUS;
    const user = userEvent.setup();
    let rules: unknown[] = [];
    let saved: unknown;
    await renderWithApp(tree(), {
      route: '/default-access/create',
      locale,
      namespace,
      namespaces,
      services,
      fetch: answerApi((request) => {
        if (request.path === 'authorization/permissions')
          return { data: { unrestricted: true, permissions: [] } };
        if (request.path.endsWith('/options')) return { data: catalog };
        if (request.method === 'POST') {
          saved = request.json;
          rules = [request.json];
          return { data: request.json };
        }
        return { data: rules };
      }),
    });
    await user.type(
      await screen.findByRole('textbox', { name: `${copy.settings.key} *` }),
      'new-baseline',
    );
    await user.click(
      screen.getByRole('combobox', {
        name: `${copy.settings.defaultAccess.resource} *`,
      }),
    );
    await user.click(await screen.findByRole('option', { name: 'Projects' }));
    await user.click(screen.getByRole('button', { name: copy.settings.save }));
    await waitFor(() =>
      expect(saved).toEqual({
        key: 'new-baseline',
        resource: { type: 'composite', id: 'projects' },
        actions: [],
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Projects' })).toBeVisible(),
    );
  },
);
it('keeps failed deletion in its confirmation and deletes only after explicit confirmation', async () => {
  const user = userEvent.setup();
  let rules = [existing];
  let deletes = 0;
  await renderWithApp(tree(), {
    route: '/default-access',
    namespace,
    namespaces,
    services,
    fetch: answerApi((request) => {
      if (request.path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (request.path.endsWith('/options')) return { data: catalog };
      if (request.method === 'DELETE') {
        deletes++;
        if (deletes === 1)
          return Response.json(
            { error: { message: 'Private server detail' } },
            { status: 500 },
          );
        rules = [];
        return new Response(null, { status: 204 });
      }
      return { data: rules };
    }),
  });
  await user.click(
    await screen.findByRole('button', { name: 'Actions for Projects' }),
  );
  await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  expect(deletes).toBe(0);
  await user.click(screen.getByRole('button', { name: 'Delete', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    enUS.settings.failed,
  );
  expect(screen.getByRole('alertdialog')).toBeVisible();
  expect(screen.queryByText('Private server detail')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Delete', exact: true }));
  await screen.findByText(enUS.settings.defaultAccess.empty);
  expect(deletes).toBe(2);
});
it('retains the create draft when the server rejects a duplicate and shows a contextual error', async () => {
  const user = userEvent.setup();
  await renderWithApp(tree(), {
    route: '/default-access/create',
    namespace,
    namespaces,
    services,
    fetch: answerApi((request) =>
      request.path === 'authorization/permissions'
        ? { data: { unrestricted: true, permissions: [] } }
        : request.path.endsWith('/options')
          ? { data: catalog }
          : request.method === 'POST'
            ? Response.json(
                { error: { reason: 'DEFAULT_ACCESS_CONFLICT' } },
                { status: 409 },
              )
            : { data: [] },
    ),
  });
  await user.type(
    await screen.findByRole('textbox', { name: 'Key *' }),
    'new-rule',
  );
  await user.click(screen.getByRole('combobox', { name: 'Business object *' }));
  await user.click(await screen.findByRole('option', { name: 'Projects' }));
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(
    await screen.findByText(enUS.settings.defaultAccess.duplicate),
  ).toBeVisible();
  expect(screen.getByRole('textbox', { name: 'Key *' })).toHaveValue(
    'new-rule',
  );
});

it('configures custom conditions in a temporary draft and cancels without saving or replacing the previous scope', async () => {
  const user = userEvent.setup();
  const calls = vi.fn((request: { path: string; method?: string }) =>
    request.path === 'authorization/permissions'
      ? { data: { unrestricted: true, permissions: [] } }
      : request.path.endsWith('/options')
        ? { data: catalog }
        : { data: [existing] },
  );
  await renderWithApp(tree(), {
    route: '/default-access/project-default/edit',
    namespace,
    namespaces,
    services,
    fetch: answerApi(calls),
  });
  await user.click(
    await screen.findByRole('combobox', { name: 'Edit · Projects' }),
  );
  await user.click(
    await screen.findByRole('option', { name: 'Custom filter' }),
  );
  await screen.findByText('Configure record filter');
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toBeDisabled();
  const dialog = screen.getByRole('dialog');
  await user.click(
    within(dialog).getByRole('button', { name: 'Cancel', exact: true }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(
    screen.getByRole('combobox', { name: 'Edit · Projects' }),
  ).toHaveTextContent('Own records');
  expect(calls.mock.calls.every(([request]) => request.method === 'GET')).toBe(
    true,
  );
});

it('validates a missing key on submit and focuses its inline error without sending a create', async () => {
  const user = userEvent.setup();
  let writes = 0;
  await renderWithApp(tree(), {
    route: '/default-access/create',
    namespace,
    namespaces,
    services,
    fetch: answerApi((request) => {
      if (request.method === 'POST') writes++;
      return request.path === 'authorization/permissions'
        ? { data: { unrestricted: true, permissions: [] } }
        : request.path.endsWith('/options')
          ? { data: catalog }
          : { data: [] };
    }),
  });
  await user.click(
    await screen.findByRole('combobox', { name: 'Business object *' }),
  );
  await user.click(await screen.findByRole('option', { name: 'Projects' }));
  expect(
    screen.queryByText(enUS.settings.defaultAccess.keyRequired),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(
    await screen.findByText(enUS.settings.defaultAccess.keyRequired),
  ).toBeVisible();
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Key *' })).toHaveFocus(),
  );
  expect(writes).toBe(0);
});
it('refuses deleting a changed rule and refreshes the list for explicit re-confirmation', async () => {
  const user = userEvent.setup();
  let reads = 0;
  let writes = 0;
  await renderWithApp(tree(), {
    route: '/default-access',
    namespace,
    namespaces,
    services,
    fetch: answerApi((request) => {
      if (request.path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (request.path.endsWith('/options')) return { data: catalog };
      if (request.method === 'DELETE') writes++;
      reads++;
      return { data: [reads > 1 ? { ...existing, actions: [] } : existing] };
    }),
  });
  await user.click(
    await screen.findByRole('button', { name: 'Actions for Projects' }),
  );
  await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  await user.click(screen.getByRole('button', { name: 'Delete', exact: true }));
  expect(
    await screen.findByText(enUS.settings.defaultAccess.deleteChanged),
  ).toBeVisible();
  expect(writes).toBe(0);
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

it('disables New rule with a reason when every available resource is already configured', async () => {
  await renderWithApp(tree(), {
    route: '/default-access',
    namespace,
    namespaces,
    services,
    fetch: answerApi(({ path }) =>
      path === 'authorization/permissions'
        ? { data: { unrestricted: true, permissions: [] } }
        : path.endsWith('/options')
          ? { data: catalog }
          : { data: [existing] },
    ),
  });
  expect(
    await screen.findByText(enUS.settings.defaultAccess.noResourcesShort),
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'New default scope' }),
  ).toBeDisabled();
  expect(
    screen.queryByRole('link', { name: 'New default scope' }),
  ).not.toBeInTheDocument();
});
it('maps a server scope validation error to the affected selector and focuses it while retaining the draft', async () => {
  const user = userEvent.setup();
  await renderWithApp(tree(), {
    route: '/default-access/project-default/edit',
    namespace,
    namespaces,
    services,
    fetch: answerApi((request) =>
      request.path === 'authorization/permissions'
        ? { data: { unrestricted: true, permissions: [] } }
        : request.path.endsWith('/options')
          ? { data: catalog }
          : request.method === 'PATCH'
            ? Response.json(
                {
                  error: {
                    reason: 'INVALID_AUTHORIZATION_INPUT',
                    fieldViolations: [
                      {
                        field: 'actions.1.selection.key',
                        description: 'Private detail',
                      },
                    ],
                  },
                },
                { status: 400 },
              )
            : { data: [existing] },
    ),
  });
  await user.click(
    await screen.findByRole('combobox', { name: 'Edit · Projects' }),
  );
  await user.click(await screen.findByRole('option', { name: 'All records' }));
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(
    await screen.findByText(enUS.settings.defaultAccess.scopeInvalid),
  ).toBeVisible();
  const scope = screen.getByRole('combobox', { name: 'Edit · Projects' });
  expect(scope).toHaveAttribute('aria-invalid', 'true');
  await waitFor(() => expect(scope).toHaveFocus());
  expect(scope).toHaveTextContent('All records');
  expect(screen.queryByText('Private detail')).not.toBeInTheDocument();
});
