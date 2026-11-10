import { PageBreadcrumbProvider } from '@nocobase/app-client';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { answerApi, type ApiCall } from '@nocobase/app-testing/client';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';
import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import SkillProjectDetailPage from '../../client/pages/skill-projects/detail.js';
import SkillProjectEditPage from '../../client/pages/skill-projects/edit.js';
import SkillProjectsPage from '../../client/pages/skill-projects/index.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import applicationRoutes from '../../client/routes.js';
import { renderSettingsClient } from '../helpers/settings-client.js';

const namespace = 'skill-projects-changes-test';
const namespaces = {
  [namespace]: {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  },
};
const routes = resolveAppClientContributions([
  { packageName: namespace, source: 'application', routes: applicationRoutes },
]).routes;

interface Project {
  id: string;
  name: string;
}
type Answer = (call: ApiCall, key: string | null) => unknown;

/** A small stand-in for the projects API that records every call. */
function server(names: string[]) {
  let rows: Project[] = names.map((name, index) => ({
    id: `p${String(index + 1).padStart(2, '0')}`,
    name,
  }));
  const calls: { method: string; path: string; key: string | null }[] = [];
  const override: { answer?: Answer } = {};
  const missing = () =>
    Response.json(
      {
        error: {
          status: 'NOT_FOUND',
          reason: 'PROJECT_NOT_FOUND',
          message: 'Missing',
        },
      },
      { status: 404 },
    );
  const handle = (call: ApiCall) => {
    const id = call.path.split('/')[1];
    if (call.path === 'skillProjects' && call.method === 'GET') {
      const q = String(call.query?.q ?? '');
      const found = rows
        .filter((row) => row.name.includes(q))
        .sort((a, b) =>
          call.query?.sort === 'name'
            ? (call.query.order === 'desc' ? -1 : 1) *
              a.name.localeCompare(b.name)
            : a.id.localeCompare(b.id),
        );
      return { data: found, meta: { total: found.length } };
    }
    if (call.path === 'skillProjects/summary')
      return { data: { total: rows.length } };
    if (call.path === 'skillProjects' && call.method === 'POST') {
      const created = {
        id: `p${rows.length + 1}`,
        name: (call.json as { name: string }).name,
      };
      rows = [...rows, created];
      return { data: created };
    }
    const row = rows.find((candidate) => candidate.id === id);
    if (!row) return missing();
    if (call.method === 'PATCH') {
      const saved = { ...row, name: (call.json as { name: string }).name };
      rows = rows.map((candidate) => (candidate.id === id ? saved : candidate));
      return { data: saved };
    }
    if (call.method === 'DELETE') {
      rows = rows.filter((candidate) => candidate.id !== id);
      return { data: { id } };
    }
    return { data: row };
  };
  const transport = answerApi(async (call) => {
    const key = pendingKey;
    calls.push({ method: call.method, path: call.path, key });
    const answer = override.answer?.(call, key);
    return answer === undefined ? handle(call) : answer;
  });
  let pendingKey: string | null = null;
  const fetch = ((request: Request) => {
    pendingKey = request.headers.get('Idempotency-Key');
    return transport(request);
  }) as typeof globalThis.fetch;
  return {
    fetch,
    calls,
    override,
    count: (method: string, path: string) =>
      calls.filter((call) => call.method === method && call.path === path)
        .length,
  };
}

function Location() {
  const location = useLocation();
  return (
    <output data-testid='location'>
      {location.pathname + location.search}
    </output>
  );
}

const mount = (api: ReturnType<typeof server>, route: string) =>
  renderSettingsClient(
    <RouteTreeProvider routes={routes}>
      <PageBreadcrumbProvider>
        <Breadcrumbs />
        <Location />
        <Routes>
          <Route path='/skill-projects' element={<SkillProjectsPage />}>
            <Route path='new' element={<SkillProjectEditPage />} />
            <Route path=':projectId/edit' element={<SkillProjectEditPage />} />
            <Route
              path=':projectId/details'
              element={<SkillProjectDetailPage />}
            >
              <Route path='edit' element={<SkillProjectEditPage />} />
            </Route>
          </Route>
        </Routes>
      </PageBreadcrumbProvider>
    </RouteTreeProvider>,
    { route, namespace, namespaces, fetch: api.fetch },
  );

const total = () => screen.getByTestId('projects-total');
const location = () => screen.getByTestId('location').textContent;

it('shows a created project in the list and the total without waiting for a return read', async () => {
  const api = server(['Alpha']);
  const view = await mount(api, '/skill-projects');
  await screen.findByText('Alpha');
  await waitFor(() => expect(total()).toHaveTextContent('1'));
  await userEvent.click(screen.getByRole('button', { name: 'Create project' }));
  await userEvent.type(
    await screen.findByRole('textbox', { name: 'Name' }),
    'Beta',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Create' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(await screen.findByText('Beta')).toBeVisible();
  await waitFor(() => expect(total()).toHaveTextContent('2'));
  expect(api.count('POST', 'skillProjects')).toBe(1);
  expect(view.toasts()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: 'success', title: 'Created “Beta”.' }),
    ]),
  );
});

it('updates the open detail from the save response, then the searched, sorted second page on return', async () => {
  const names = Array.from(
    { length: 12 },
    (_, index) => `Project ${String(index + 1).padStart(2, '0')}`,
  );
  const api = server(names);
  const source = '/skill-projects?q=Project&sort=name&order=desc&page=2';
  await mount(api, source);
  // Descending by name, page 2 holds Project 02 and Project 01.
  await userEvent.click(
    await screen.findByRole('link', { name: 'Project 02' }),
  );
  await screen.findByRole('heading', { name: 'Project 02' });
  const detailReads = api.count('GET', 'skillProjects/p02');
  await userEvent.click(
    screen.getAllByRole('button', { name: 'Edit' }).find((link) =>
      // The link keeps the list's query, so a reload of the edit dialog still knows the list.
      new URL(link.getAttribute('href') ?? '', 'http://app').pathname.endsWith(
        '/details/edit',
      ),
    )!,
  );
  const name = await screen.findByRole('textbox', { name: 'Name' });
  await userEvent.clear(name);
  await userEvent.type(name, 'Project 02 renamed');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByRole('heading', { name: 'Project 02 renamed' });
  // The edit dialog read the record once; the detail took the response.
  expect(api.count('GET', 'skillProjects/p02')).toBe(detailReads + 1);
  const listReads = api.count('GET', 'skillProjects');
  expect(api.count('GET', 'skillProjects/summary')).toBe(1);
  await userEvent.click(
    within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole(
      'link',
      { name: 'Projects' },
    ),
  );
  await screen.findByRole('link', { name: 'Project 02 renamed' });
  expect(location()).toBe(source);
  expect(screen.getByText('Page 2 of 2')).toBeVisible();
  expect(
    screen.getByRole('searchbox', { name: 'Search projects' }),
  ).toHaveValue('Project');
  // One verification read of each view on return, none while covered.
  expect(api.count('GET', 'skillProjects')).toBe(listReads + 1);
  await waitFor(() =>
    expect(api.count('GET', 'skillProjects/summary')).toBe(2),
  );
});

it('returns a deleted detail to its source list, drops the row and count, and corrects an emptied page', async () => {
  const names = Array.from(
    { length: 11 },
    (_, index) => `Project ${String(index + 1).padStart(2, '0')}`,
  );
  const api = server(names);
  const view = await mount(api, '/skill-projects?page=2');
  await userEvent.click(
    await screen.findByRole('link', { name: 'Project 11' }),
  );
  await screen.findByRole('heading', { name: 'Project 11' });
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  const dialog = await screen.findByRole('alertdialog');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
  await waitFor(() => expect(location()).toBe('/skill-projects?page=1'));
  await screen.findByText('Project 01');
  expect(screen.queryByText('Project 11')).not.toBeInTheDocument();
  expect(screen.getByText('Page 1 of 1')).toBeVisible();
  await waitFor(() => expect(total()).toHaveTextContent('10'));
  expect(api.count('DELETE', 'skillProjects/p11')).toBe(1);
  // The deleted detail is never read again.
  expect(api.count('GET', 'skillProjects/p11')).toBe(1);
  expect(view.toasts()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'success',
        title: 'Deleted “Project 11”.',
      }),
    ]),
  );
});

it('opens a detail URL directly, deletes it and returns to the default list', async () => {
  const api = server(['Alpha', 'Beta']);
  await mount(api, '/skill-projects/p01/details');
  await screen.findByRole('heading', { name: 'Alpha' });
  // The covered list has not been read.
  expect(api.count('GET', 'skillProjects')).toBe(0);
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: 'Delete',
    }),
  );
  await waitFor(() => expect(location()).toBe('/skill-projects'));
  await screen.findByText('Beta');
  expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  expect(api.count('GET', 'skillProjects')).toBe(1);
});

it.each([
  [
    403,
    'You do not have access to these projects. Ask an administrator for access.',
  ],
  [409, 'Unable to delete this project. Try again.'],
])(
  'keeps the record and shows no success after a rejected delete (%s)',
  async (status, message) => {
    const api = server(['Alpha']);
    api.override.answer = (call) =>
      call.method === 'DELETE'
        ? Response.json(
            { error: { status: 'DENIED', reason: 'TEST', message: 'No' } },
            { status },
          )
        : undefined;
    const view = await mount(api, '/skill-projects/p01/details');
    await screen.findByRole('heading', { name: 'Alpha' });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' }),
    );
    expect(await within(dialog).findByText(message)).toBeVisible();
    expect(location()).toBe('/skill-projects/p01/details');
    expect(
      screen.getByRole('heading', { name: 'Alpha', hidden: true }),
    ).toBeInTheDocument();
    expect(view.toasts()).toEqual([]);
  },
);

it('re-reads after an unknown delete result, never resubmits on its own, and retries with the same key', async () => {
  const api = server(['Alpha', 'Beta']);
  let lost = true;
  api.override.answer = (call) => {
    if (call.method !== 'DELETE' || !lost) return undefined;
    lost = false;
    return Response.json(
      { error: { status: 'INTERNAL', reason: 'LOST', message: 'Lost' } },
      { status: 500 },
    );
  };
  const view = await mount(api, '/skill-projects/p01/details');
  await screen.findByRole('heading', { name: 'Alpha' });
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  const dialog = await screen.findByRole('alertdialog');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
  expect(
    await within(dialog).findByText(enUS.skillProjects.deleteUncertain),
  ).toBeVisible();
  // The record is read again to show what actually happened.
  await waitFor(() => expect(api.count('GET', 'skillProjects/p01')).toBe(2));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  expect(api.count('DELETE', 'skillProjects/p01')).toBe(1);
  expect(view.toasts()).toEqual([]);
  await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
  await waitFor(() => expect(location()).toBe('/skill-projects'));
  const deletes = api.calls.filter((call) => call.method === 'DELETE');
  expect(deletes).toHaveLength(2);
  expect(deletes[1]!.key).toBe(deletes[0]!.key);
  await screen.findByText('Beta');
  expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
});

it('treats a delete of an already removed record as done and returns to the list', async () => {
  const api = server(['Alpha', 'Beta']);
  await mount(api, '/skill-projects/p01/details');
  await screen.findByRole('heading', { name: 'Alpha' });
  api.override.answer = (call) =>
    call.method === 'DELETE'
      ? Response.json(
          {
            error: {
              status: 'NOT_FOUND',
              reason: 'PROJECT_NOT_FOUND',
              message: 'Missing',
            },
          },
          { status: 404 },
        )
      : undefined;
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: 'Delete',
    }),
  );
  await waitFor(() => expect(location()).toBe('/skill-projects'));
});
