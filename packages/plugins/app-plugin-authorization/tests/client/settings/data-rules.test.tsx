// @vitest-environment jsdom
import { answerApi } from '@nocobase/app-testing/client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';

import type { AuthorizationOptionsResponse } from '../../../client/index.js';
import enUS from '../../../client/locales/en-US.js';
import RestrictionRules from '../../../client/settings/restriction-rules.js';
import SharingRules from '../../../client/settings/sharing-rules.js';
import { renderSettingsClient as renderWithApp } from '../../helpers/settings-client.js';

const words = enUS.settings;
const scope = {
  key: 'projects',
  title: 'Projects',
  collection: 'projects',
  fields: ['name'],
  recordAccess: ['allRecords', 'own'],
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
              actions: [{ name: 'view', title: 'View' }],
              dataScopes: { view: [scope] },
            },
          ],
        },
      ],
    },
  ],
  recordAccess: [
    { key: 'allRecords', title: 'All records', collections: ['projects'] },
    { key: 'own', title: 'Own records', collections: ['projects'] },
  ],
  subjectTypes: [
    { type: 'user', title: 'Users', selection: { type: 'collection' } },
    {
      type: 'authenticated',
      title: 'Signed-in users',
      selection: { type: 'fixed', id: '*' },
    },
  ],
  collections: [],
};
const users = [
  { id: 'u1', title: 'Alice', description: 'alice@example.com' },
  { id: 'u2', title: 'Bob' },
];
const restriction = {
  key: 'interns',
  title: 'Interns see their own projects',
  resource: { type: 'composite', id: 'projects' },
  actions: [
    {
      action: 'view',
      scopeKey: 'projects',
      selection: { type: 'recordAccess', key: 'own' },
    },
  ],
  subjects: [{ type: 'user', id: 'u2' }],
  reason: 'Training period',
};

function Where() {
  const location = useLocation();
  return <output data-testid='where'>{location.search}</output>;
}

/** Answers a rule surface, its catalog and its user directory, recording each write. */
function surface(
  path: string,
  initial: readonly unknown[],
  writes: { method: string; path: string; json?: unknown }[],
) {
  let rules = [...initial];
  return answerApi((request) => {
    if (request.path === 'authorization/permissions')
      return { data: { unrestricted: true, permissions: [] } };
    if (request.path === `authorization/${path}/options`)
      return { data: catalog };
    if (request.path === `authorization/${path}/subjects/user`)
      return { data: users, meta: { total: users.length } };
    if (request.path === `authorization/${path}/subjects/user/resolve`)
      return {
        data: users.filter((user) =>
          (Reflect.get(request.json as object, 'ids') as string[]).includes(
            user.id,
          ),
        ),
      };
    if (request.method && request.method !== 'GET') {
      writes.push({
        method: request.method,
        path: request.path,
        json: request.json,
      });
      if (request.method === 'POST') {
        rules = [...rules, request.json];
        return Response.json({ data: request.json }, { status: 201 });
      }
      if (request.method === 'PATCH') {
        const next = { ...restriction, ...(request.json as object) };
        rules = [next];
        return { data: next };
      }
      rules = [];
      return new Response(null, { status: 204 });
    }
    return { data: rules, meta: { total: rules.length } };
  });
}

it('creates a sharing rule in a side sheet, naming who it shares with and never offering every record', async () => {
  const user = userEvent.setup();
  const writes: { method: string; path: string; json?: unknown }[] = [];
  await renderWithApp(
    <>
      <Routes>
        <Route path='/rules' element={<SharingRules />} />
      </Routes>
      <Where />
    </>,
    { route: '/rules', fetch: surface('sharingRules', [], writes) },
  );
  await user.click(
    await screen.findByRole('button', { name: words.sharingRules.new }),
  );
  const sheet = await screen.findByRole('dialog', {
    name: words.sharingRules.new,
  });
  await user.type(
    within(sheet).getByRole('textbox', { name: words.sharingRules.name }),
    'Team projects',
  );
  await user.type(
    within(sheet).getByRole('textbox', { name: `${words.key} *` }),
    'team-projects',
  );
  await user.click(
    within(sheet).getByRole('combobox', {
      name: `${words.defaultAccess.resource} *`,
    }),
  );
  await user.click(await screen.findByRole('option', { name: 'Projects' }));
  await user.click(
    within(sheet).getByRole('combobox', { name: 'View · Projects' }),
  );
  expect(
    screen.queryByRole('option', { name: 'All records' }),
  ).not.toBeInTheDocument();
  await user.click(await screen.findByRole('option', { name: 'Own records' }));
  // Saving without anyone to share with is refused before any request.
  await user.click(within(sheet).getByRole('button', { name: words.save }));
  expect(
    await within(sheet).findByText(words.sharingRules.subjectsRequired),
  ).toBeVisible();
  expect(writes).toEqual([]);
  await user.click(
    within(sheet).getByRole('button', { name: words.ruleSubjects.addSubject }),
  );
  const picker = await screen.findByRole('dialog', {
    name: words.ruleSubjects.addSubjectTitle,
  });
  await user.click(
    await within(picker).findByRole('button', { name: 'Add Alice' }),
  );
  await user.keyboard('{Escape}');
  await waitFor(() => expect(picker).not.toBeInTheDocument());
  await within(sheet).findByText('Alice');
  expect(
    within(sheet).getByText(
      'Share Projects (View · Projects: Own records) with Alice',
    ),
  ).toBeVisible();
  await user.type(
    within(sheet).getByRole('textbox', { name: words.sharingRules.reason }),
    'Same team',
  );
  await user.click(within(sheet).getByRole('button', { name: words.save }));
  await waitFor(() =>
    expect(writes).toEqual([
      {
        method: 'POST',
        path: 'authorization/sharingRules',
        json: {
          key: 'team-projects',
          resource: { type: 'composite', id: 'projects' },
          actions: [
            {
              action: 'view',
              scopeKey: 'projects',
              selection: { type: 'recordAccess', key: 'own' },
            },
          ],
          subjects: [{ type: 'user', id: 'u1' }],
          title: 'Team projects',
          reason: 'Same team',
        },
      },
    ]),
  );
  await waitFor(() => expect(sheet).not.toBeInTheDocument());
  expect(
    await screen.findByRole('link', { name: 'Team projects' }),
  ).toBeVisible();
  expect(screen.getByTestId('where')).toHaveTextContent('');
});

it('edits a restriction rule and asks once before discarding a draft', async () => {
  const user = userEvent.setup();
  const writes: { method: string; path: string; json?: unknown }[] = [];
  await renderWithApp(
    <>
      <Routes>
        <Route path='/rules' element={<RestrictionRules />} />
      </Routes>
      <Where />
    </>,
    {
      route: '/rules?edit=interns',
      fetch: surface('restrictionRules', [restriction], writes),
    },
  );
  const sheet = await screen.findByRole('dialog', {
    name: words.restrictionRules.edit,
  });
  expect(
    await within(sheet).findByText(
      'Bob reach at most View · Projects: Own records of Projects',
    ),
  ).toBeVisible();
  const reason = within(sheet).getByRole('textbox', {
    name: words.restrictionRules.reason,
  });
  await user.clear(reason);
  await user.click(within(sheet).getByRole('button', { name: words.cancel }));
  // One question, not one from the sheet and another from the page.
  const confirm = await screen.findByRole('alertdialog');
  expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
  await user.click(within(confirm).getByRole('button', { name: words.cancel }));
  expect(sheet).toBeInTheDocument();
  await user.click(within(sheet).getByRole('button', { name: words.save }));
  await waitFor(() =>
    expect(writes).toEqual([
      {
        method: 'PATCH',
        path: 'authorization/restrictionRules/interns',
        json: {
          actions: restriction.actions,
          subjects: restriction.subjects,
          title: restriction.title,
          reason: null,
        },
      },
    ]),
  );
  await waitFor(() => expect(sheet).not.toBeInTheDocument());
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(screen.getByTestId('where')).toHaveTextContent('');
});

it('deletes a restriction rule from its sheet after confirmation', async () => {
  const user = userEvent.setup();
  const writes: { method: string; path: string; json?: unknown }[] = [];
  await renderWithApp(
    <Routes>
      <Route path='/rules' element={<RestrictionRules />} />
    </Routes>,
    {
      route: '/rules?edit=interns',
      fetch: surface('restrictionRules', [restriction], writes),
    },
  );
  const sheet = await screen.findByRole('dialog', {
    name: words.restrictionRules.edit,
  });
  await user.click(
    within(sheet).getByRole('button', { name: words.defaultAccess.delete }),
  );
  const confirm = await screen.findByRole('alertdialog');
  expect(writes).toEqual([]);
  await user.click(
    within(confirm).getByRole('button', { name: words.defaultAccess.delete }),
  );
  await waitFor(() =>
    expect(writes).toEqual([
      { method: 'DELETE', path: 'authorization/restrictionRules/interns' },
    ]),
  );
  await waitFor(() => expect(sheet).not.toBeInTheDocument());
  expect(await screen.findByText(enUS.listFeedback.empty)).toBeVisible();
});
