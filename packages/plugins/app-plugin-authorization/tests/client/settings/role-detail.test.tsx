// @vitest-environment jsdom
import { answerApi } from '@nocobase/app-testing/client';
import { defineAppRoutes } from '@nocobase/app-client/plugins';
import {
  type PermissionGrant,
  type PermissionSet,
  type PermissionSetAssignment,
} from '../../../client/index.js';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { expect, it, vi } from 'vitest';
import {
  appNamespaces,
  appWords,
  settingsRoutes,
} from '../../helpers/settings-fixture.js';
import { renderSettingsClient as renderWithApp } from '../../helpers/settings-client.js';
import RolesPage from '../../../client/settings/roles.js';
import RoleForm from '../../../client/settings/role-form.js';
import type { PermissionWorkspaceSelection } from '../../../client/settings/workspace-selection.js';
import { authorizationSettingsToken } from '../../../client/tokens.js';
import enUS from '../../../client/locales/en-US.js';

const words = enUS.settings;
const editor = words.permissionEditor;
/** The CRM page's menu title. */
const crmTitle = appWords['en-US'].navigation.home;
const routes = [
  ...settingsRoutes,
  defineAppRoutes([
    {
      name: 'crm',
      path: '/crm',
      navigation: { title: 'navigation.home' },
      authz: { resource: { type: 'page', id: 'crm' }, action: 'access' },
      componentLoader: async () => ({ default: () => null }),
    },
  ]),
];
// Customers are used on the CRM page, whose View it turns on; reports are used on no page.
const selection: PermissionWorkspaceSelection = {
  business: [
    { type: 'composite', id: 'crm.customers', actions: ['view', 'create'] },
    { type: 'composite', id: 'crm.reports', actions: ['view'] },
  ],
};
const scope = {
  key: 'records',
  collection: 'customers',
  title: 'records',
  fields: [],
  recordAccess: ['allRecords', 'ownRecords'],
  defaultValue: 'ownRecords',
};
const options = {
  sections: [
    {
      name: 'business',
      title: 'Business operations',
      order: 100,
      subsections: [
        {
          name: 'crm',
          title: 'CRM',
          resources: [
            {
              type: 'composite',
              id: 'crm.customers',
              title: 'Customers',
              usedOn: ['crm'],
              actions: [
                { name: 'view', title: 'View customers', defaultFor: ['crm'] },
                { name: 'create', title: 'Create customers' },
              ],
              dataScopes: { view: [scope] },
            },
            {
              type: 'composite',
              id: 'crm.reports',
              title: 'Reports',
              actions: [{ name: 'view', title: 'View reports' }],
              dataScopes: { view: [{ ...scope, collection: 'reports' }] },
            },
          ],
        },
      ],
    },
    {
      name: 'administration',
      title: 'Administration',
      order: 0,
      subsections: [
        {
          name: 'authorization',
          title: 'Authorization',
          resources: [
            {
              type: 'settings',
              id: 'authorization.permission-sets',
              title: 'Permission sets',
              actions: [
                { name: 'read', title: 'Read roles' },
                { name: 'update', title: 'Change roles' },
              ],
            },
          ],
        },
      ],
    },
  ],
  recordAccess: [
    { key: 'allRecords', title: 'All records' },
    { key: 'ownRecords', title: 'Own records' },
  ],
  subjectTypes: [
    { type: 'user', title: 'User', selection: { type: 'collection' } },
  ],
  collections: [
    { name: 'customers', title: 'Customers', fields: [] },
    { name: 'reports', title: 'Reports', fields: [] },
  ],
};
const people = [
  { id: 'u1', title: 'Alice' },
  { id: 'u2', title: 'Bob' },
];

function api(
  roles: PermissionSet[],
  assignments: PermissionSetAssignment[] = [],
) {
  return vi.fn(
    ({
      path,
      method,
      json,
    }: {
      path: string;
      method: string;
      json?: {
        grants?: readonly PermissionGrant[];
        subject?: { type: string; id: string };
        ids?: readonly string[];
      };
    }) => {
      if (path === 'authorization/permissions')
        return { data: { unrestricted: true, permissions: [] } };
      if (path === 'authorization/permissionSets/options')
        return { data: options };
      if (path === 'authorization/permissionSets') return { data: roles };
      if (path === 'authorization/permissionSets/subjects/user')
        return { data: people, meta: { page: 1, pageSize: 20, total: 2 } };
      if (path === 'authorization/permissionSets/subjects/user/resolve')
        return {
          data: people.filter((person) => json?.ids?.includes(person.id)),
        };
      const members =
        /^authorization\/permissionSets\/([^/]+)\/assignments(?:\/(.+))?$/.exec(
          path,
        );
      if (members) {
        if (method === 'POST' && json?.subject) {
          const added = {
            id: `a-${json.subject.id}`,
            subject: json.subject,
            permissionSet: decodeURIComponent(members[1]!),
          };
          assignments.push(added);
          return { data: added };
        }
        if (method === 'DELETE') {
          if (assignments.length === 1)
            return Response.json(
              {
                error: {
                  code: 400,
                  status: 'FAILED_PRECONDITION',
                  reason: 'LAST_ASSIGNMENT',
                  message: 'The set must keep an assignment.',
                },
              },
              { status: 400 },
            );
          const index = assignments.findIndex(
            (item) => item.id === decodeURIComponent(members[2]!),
          );
          assignments.splice(index, 1);
          return new Response(null, { status: 204 });
        }
        return {
          data: assignments,
          meta: { total: assignments.length },
        };
      }
      const key = decodeURIComponent(path.split('/').at(-1) ?? '');
      const index = roles.findIndex((role) => role.key === key);
      if (index === -1) return new Response(null, { status: 404 });
      if (method === 'PATCH' && json?.grants)
        roles[index] = { ...roles[index]!, grants: json.grants };
      return { data: roles[index] };
    },
  );
}

function mount(calls: ReturnType<typeof api>) {
  return renderWithApp(
    <Routes>
      <Route path='/settings/roles' element={<RolesPage />}>
        <Route path=':key/edit' element={<RoleForm />} />
      </Route>
    </Routes>,
    {
      route: '/settings/roles/sales/edit',
      namespaces: appNamespaces,
      routes,
      authorization: { workspace: selection },
      fetch: answerApi(calls),
    },
  );
}

const role = (): PermissionSet[] => [
  { key: 'sales', title: 'Sales', grants: [], revision: 'one' },
];

it('turns on the operations a page declares when it is checked and lists where each operation is used', async () => {
  const user = userEvent.setup();
  await mount(api(role()));
  const crm = await screen.findByRole('checkbox', { name: crmTitle });
  await waitFor(() => expect(crm).not.toHaveAttribute('aria-disabled', 'true'));
  await user.click(crm);
  const flash = await screen.findByText(
    editor.defaultsAdded.replace('{{actions}}', '“View customers”'),
  );
  expect(flash).toBeVisible();
  expect(screen.queryByText(editor.opensEmpty)).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', {
      name: editor.operationCount
        .replace('{{enabled}}', '1')
        .replace('{{total}}', '2'),
    }),
  ).toBeVisible();

  await user.click(
    screen.getByRole('tab', { name: new RegExp(editor.objectsTab) }),
  );
  // The pages that list the object.
  const usedOn = document.querySelector<HTMLElement>(
    '[data-slot=permission-object-used-on]',
  );
  expect(usedOn).toHaveTextContent(crmTitle);
  // Reports are used on no page, so they are listed last, under Other operations.
  expect(screen.getByText(editor.otherOperations)).toBeVisible();
  // Checking the page left Customers at View only: its checkbox is partly checked.
  const customers = screen.getByRole('checkbox', {
    name: editor.selectObject.replace('{{object}}', 'Customers'),
  });
  expect(customers).toHaveAttribute('aria-checked', 'mixed');
  expect(
    screen.getByRole('checkbox', { name: 'View customers' }),
  ).toBeChecked();

  // Every operation but high-risk ones in one tap, and off again.
  await user.click(customers);
  expect(customers).toBeChecked();
  await user.click(customers);
  expect(customers).not.toBeChecked();
  expect(
    screen.getByRole('checkbox', { name: 'View customers' }),
  ).not.toBeChecked();

  // With View off the checked page opens empty.
  await user.click(
    screen.getByRole('tab', { name: new RegExp(editor.menusTab) }),
  );
  expect(await screen.findByText(editor.opensEmpty)).toBeVisible();

  // With the page closed, View on says the page is missing.
  await user.click(screen.getByRole('checkbox', { name: crmTitle }));
  await user.click(
    screen.getByRole('tab', { name: new RegExp(editor.objectsTab) }),
  );
  await user.click(screen.getByRole('checkbox', { name: 'View customers' }));
  expect(
    await screen.findByText(
      editor.missingPage.replace('{{pages}}', `“${crmTitle}”`),
    ),
  ).toBeVisible();
});

it('reviews every change before saving and marks high-risk permissions', async () => {
  const user = userEvent.setup();
  const roles = role();
  const calls = api(roles);
  await mount(calls);
  const crm = await screen.findByRole('checkbox', { name: crmTitle });
  await waitFor(() => expect(crm).not.toHaveAttribute('aria-disabled', 'true'));
  await user.click(crm);
  await user.click(
    screen.getByRole('tab', { name: new RegExp(editor.settingsTab) }),
  );
  // A settings page folds its operations away until they are set one by one.
  expect(
    screen.queryByRole('switch', { name: 'Change roles' }),
  ).not.toBeInTheDocument();
  await user.click(
    within(
      screen.getByRole('region', { name: words.permissionManagement }),
    ).getByRole('button', { name: editor.settingsDetails }),
  );
  await user.click(screen.getByRole('switch', { name: 'Change roles' }));
  expect(
    screen.getByText(words.unsavedCountRisky_other.replace('{{count}}', '4')),
  ).toBeVisible();

  await user.click(
    screen.getByRole('button', { name: words.reviewAndSave, exact: true }),
  );
  const dialog = await screen.findByRole('dialog', {
    name: words.review.title,
  });
  expect(within(dialog).getByText(crmTitle)).toBeVisible();
  expect(within(dialog).getByText('Customers · View customers')).toBeVisible();
  const risky = within(dialog)
    .getByText(/· Change roles$/)
    .closest('li');
  expect(risky).toHaveAttribute('data-risk', 'high');
  expect(within(dialog).getByRole('alert')).toHaveTextContent(
    words.review.highRisk_one.replace('{{count}}', '1'),
  );
  // Back to editing keeps the draft and sends nothing.
  await user.click(
    within(dialog).getByRole('button', { name: words.review.back }),
  );
  expect(calls).not.toHaveBeenCalledWith(
    expect.objectContaining({ method: 'PATCH' }),
  );
  await user.click(
    screen.getByRole('button', { name: words.reviewAndSave, exact: true }),
  );
  await user.click(
    await screen.findByRole('button', { name: words.review.confirm }),
  );
  await waitFor(() =>
    expect(roles[0]?.grants).toEqual(
      expect.arrayContaining([
        {
          resource: { type: 'page', id: 'crm' },
          actions: [{ action: 'access' }],
        },
      ]),
    ),
  );
  expect(
    roles[0]?.grants?.find((grant) => grant.resource.id === 'crm.customers')
      ?.actions[0]?.action,
  ).toBe('view');
});

it('adds and removes members at once and keeps the last one', async () => {
  const user = userEvent.setup();
  const assignments: PermissionSetAssignment[] = [
    { id: 'a-u1', subject: { type: 'user', id: 'u1' }, permissionSet: 'sales' },
  ];
  const calls = api(role(), assignments);
  await mount(calls);
  await user.click(
    await screen.findByRole('tab', { name: new RegExp(words.members.tab) }),
  );
  expect(await screen.findByRole('cell', { name: /Alice/ })).toBeVisible();
  // A user member's permissions open in Permission check with the user picked.
  expect(
    screen.getByRole('link', { name: words.members.checkPermissions }),
  ).toHaveAttribute(
    'href',
    expect.stringMatching(/permission-check\?user=u1$/),
  );

  await user.click(screen.getByRole('button', { name: words.members.add }));
  const dialog = await screen.findByRole('dialog', {
    name: words.members.addTitle,
  });
  expect(
    await within(dialog).findByText(words.members.alreadyMember),
  ).toBeVisible();
  await user.click(
    within(dialog).getByRole('button', {
      name: words.members.addMember.replace('{{name}}', 'Bob'),
    }),
  );
  expect(
    await screen.findByText(words.members.added.replace('{{name}}', 'Bob')),
  ).toBeVisible();
  expect(assignments.map((item) => item.subject.id)).toEqual(['u1', 'u2']);
  await user.keyboard('{Escape}');
  expect(await screen.findByRole('cell', { name: /Bob/ })).toBeVisible();
  // Members change apart from the role's draft, which stays unchanged, so there is nothing to save.
  expect(
    screen.queryByRole('button', { name: words.reviewAndSave, exact: true }),
  ).not.toBeInTheDocument();

  await user.click(
    screen.getByRole('button', {
      name: words.members.removeMember.replace('{{name}}', 'Bob'),
    }),
  );
  await waitFor(() => expect(assignments).toHaveLength(1));
  await waitFor(() =>
    expect(screen.queryByRole('cell', { name: /Bob/ })).not.toBeInTheDocument(),
  );
  await user.click(
    screen.getByRole('button', {
      name: words.members.removeMember.replace('{{name}}', 'Alice'),
    }),
  );
  expect(await screen.findByText(words.members.keepOne)).toBeVisible();
  expect(assignments).toHaveLength(1);
});

it('shows a tab another package registers for a role', async () => {
  const user = userEvent.setup();
  const view = await mount(api(role()));
  const settings = view.app.container.resolve(authorizationSettingsToken);
  settings.roleTabs.add({
    key: 'audit',
    title: 'Audit',
    component: async () => ({
      default: ({ permissionSet, editable }) => (
        <p>
          Audit for {permissionSet.key}
          {editable ? ' (editable)' : ''}
        </p>
      ),
    }),
  });
  await user.click(await screen.findByRole('tab', { name: 'Audit' }));
  expect(await screen.findByText('Audit for sales (editable)')).toBeVisible();
});
