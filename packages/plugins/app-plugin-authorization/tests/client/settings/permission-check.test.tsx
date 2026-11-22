// @vitest-environment jsdom
import { answerApi } from '@nocobase/app-testing/client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { expect, it } from 'vitest';

import type { AuthorizationOptionsResponse } from '../../../client/index.js';
import enUS from '../../../client/locales/en-US.js';
import PermissionCheckPage from '../../../client/settings/permission-check.js';
import { renderSettingsClient as renderWithApp } from '../../helpers/settings-client.js';

const words = enUS.settings.permissionCheck;
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
                { name: 'view', title: 'view' },
                { name: 'delete', title: 'delete' },
              ],
            },
          ],
        },
      ],
    },
  ],
  recordAccess: [],
  subjectTypes: [],
  collections: [],
};
const permit = {
  effect: 'permit',
  reasons: [
    {
      code: 'GRANT_MATCHED',
      message: 'permission-sets:sales allows projects.view',
      details: { source: { plugin: 'permission-sets', id: 'sales' } },
    },
    // The same role matching through a second grant is still one source.
    {
      code: 'GRANT_MATCHED',
      message: 'permission-sets:sales allows the projects page',
      details: { source: { plugin: 'permission-sets', id: 'sales' } },
    },
  ],
};
const deny = {
  effect: 'deny',
  reasons: [{ code: 'NO_MATCHING_GRANT', message: 'No grant allows it' }],
};
const sharing = {
  key: 'everyone-projects',
  title: 'Everyone sees shared projects',
  resource: { type: 'composite', id: 'projects' },
  actions: [{ action: 'view', selection: { type: 'all' } }],
  subjects: [{ type: 'authenticated', id: '*' }],
};

function fetch(writes: string[]) {
  return answerApi((request) => {
    if (request.method && request.method !== 'GET')
      if (!request.path.startsWith('authorization/inspector/'))
        writes.push(request.path);
    switch (request.path) {
      case 'authorization/permissions':
        return { data: { unrestricted: true, permissions: [] } };
      case 'authorization/inspector/options':
        return { data: catalog };
      case 'authorization/inspector/subjects/user':
        return {
          data: [
            { id: 'u1', title: 'Alice', description: 'alice@example.com' },
          ],
          meta: { total: 1 },
        };
      case 'authorization/inspector/subjects/user/resolve':
        return { data: [{ id: 'u1', title: 'Alice' }] };
      case 'authorization/inspector/configuredAccess':
        return {
          data: {
            unrestricted: false,
            types: [],
            resources: [],
            identity: { subjects: [{ type: 'authenticated', id: '*' }] },
            sets: [
              {
                key: 'sales',
                title: 'Sales',
                sources: [{ type: 'user', id: 'u1' }],
              },
            ],
          },
        };
      case 'authorization/inspector/batchDecide': {
        const checks = Reflect.get(request.json as object, 'checks') as {
          resource: unknown;
          action: string;
        }[];
        return {
          data: checks.map((check) => ({
            ...check,
            decision: check.action === 'view' ? permit : deny,
          })),
        };
      }
      case 'authorization/inspector/decide':
        return {
          data:
            Reflect.get(request.json as object, 'action') === 'view'
              ? permit
              : deny,
        };
      case 'authorization/defaultAccess':
        return Response.json(
          { error: { code: 'NOT_FOUND', message: 'Not found' } },
          { status: 404 },
        );
      case 'authorization/sharingRules':
        return { data: [sharing], meta: { total: 1 } };
      case 'authorization/restrictionRules':
        return { data: [], meta: { total: 0 } };
      default:
        throw new Error(`Unexpected request ${request.path}`);
    }
  });
}

function page() {
  return (
    <Routes>
      <Route path='/permission-check' element={<PermissionCheckPage />} />
    </Routes>
  );
}

it('lists what a chosen user may do and the role each permission comes from', async () => {
  const user = userEvent.setup();
  const writes: string[] = [];
  await renderWithApp(page(), {
    route: '/permission-check',
    fetch: fetch(writes),
  });
  await user.click(await screen.findByRole('button', { name: /Alice/ }));
  const roles = await screen.findByText('Sales', {
    selector: '[data-slot=checked-roles] *',
  });
  expect(roles).toBeVisible();
  await waitFor(() =>
    expect(document.querySelector('[data-slot=allowed-list]')).not.toBeNull(),
  );
  const allowed = document.querySelector('[data-slot=allowed-list]');
  expect(allowed).toHaveTextContent('Projects');
  expect(allowed).toHaveTextContent('view');
  expect(allowed).toHaveTextContent('from Sales');
  expect(allowed).not.toHaveTextContent('delete');
  expect(writes).toEqual([]);
});

it('checks one operation step by step, linking the rules that take part', async () => {
  const user = userEvent.setup();
  const writes: string[] = [];
  await renderWithApp(page(), {
    route:
      '/permission-check?user=u1&mode=check&resource=composite%3Aprojects&action=view',
    fetch: fetch(writes),
  });
  const verdict = await screen.findByRole('status');
  await waitFor(() =>
    expect(verdict).toHaveTextContent('Can “view” on Projects'),
  );
  expect(verdict).toHaveAttribute('data-effect', 'permit');
  const steps = screen
    .getAllByRole('listitem')
    .filter((item) => item.matches('[data-slot=permission-step]'));
  expect(steps).toHaveLength(4);
  expect(steps[0]).toHaveTextContent('Allowed by Sales');
  // Each role is named once and opens in Roles.
  expect(within(steps[0]!).getAllByRole('link')).toHaveLength(1);
  expect(
    within(steps[0]!).getByRole('link', { name: 'Sales' }),
  ).toHaveAttribute('href', '/roles/sales/edit');
  await waitFor(() => expect(steps[1]).toHaveTextContent(words.notInstalled));
  const link = await within(steps[2]!).findByRole('link', {
    name: sharing.title,
  });
  expect(link).toHaveAttribute(
    'href',
    '/default-access?rule=sharing-rules&edit=everyone-projects',
  );
  await waitFor(() => expect(steps[3]).toHaveTextContent(words.noRules));

  await user.click(screen.getByRole('combobox', { name: words.action }));
  await user.click(await screen.findByRole('option', { name: 'delete' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'Cannot “delete” on Projects',
    ),
  );
  expect(writes).toEqual([]);
});
