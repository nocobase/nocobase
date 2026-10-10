import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import projectsEnUS from '../../../../plugins/app-plugin-projects/client/locales/en-US.js';
import ProjectDetailPage from '../../client/pages/projects/detail/index.js';
import { ProjectReleases } from '../../client/projects/detail/releases.js';
import type { PreviewListItem } from '../../shared/previews.js';

const mocks = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn(), close: vi.fn() },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => mocks.api,
  useToaster: () => mocks.toaster,
  usePageBreadcrumb: () => undefined,
}));
vi.mock('@nocobase/app-plugin-projects/client/projects', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/projects')
  >()),
  useProjectDetail: () => ({
    data: {
      id: 'shared',
      name: 'Shared repository',
      status: 'planned',
      visibility: 'everyone',
      members: [],
      lead: null,
      startDate: null,
      dueDate: null,
      issueCounts: { total: 0, done: 0, started: 0, cancelled: 0 },
    },
  }),
  useProjectStatuses: () => ({ data: [] }),
  useProjectWorkflow: () => ({ name: 'Default' }),
  useDeleteProject: () => vi.fn(),
  canManageProject: () => false,
  canCreateIssues: () => false,
  canDeleteProjects: () => false,
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  useViewer: () => ({}),
  usePageContextSource: () => undefined,
  useNewIssueShortcut: () => undefined,
}));
vi.mock('../../client/agents/ask-agent.js', () => ({ AskAgent: () => null }));

const preview: PreviewListItem = {
  id: 'preview-old-directory',
  resourceId: 'old-directory',
  issueId: null,
  identifier: null,
  title: null,
  canDestroy: true,
  repo: 'acme/app',
  number: 7,
  targetAppId: 'web',
  targetAppName: 'Web',
  appId: 'app-pr-7',
  environmentId: 'preview',
  status: 'ready',
  url: '/app-pr-7/',
  pullRequest: {
    repo: 'acme/app',
    number: 7,
    title: 'Manual change',
    url: 'https://github.com/acme/app/pull/7',
    state: 'open',
  },
  sha: null,
  deployedSha: null,
  build: null,
  releaseId: null,
  deploymentId: null,
  error: null,
  missingVariables: [],
  runtime: { state: 'running', lastAccessedAt: null },
  admin: null,
  createdAt: '',
  updatedAt: '',
};
let items: PreviewListItem[];
let fails = false;
beforeEach(() => {
  items = [preview];
  fails = false;
  mocks.api.request.mockReset();
  mocks.toaster.show.mockReset();
  mocks.api.request.mockImplementation(
    async ({ path, method }: { path: string; method?: string }) => {
      if (method === 'POST') {
        if (fails) throw new Error('failed');
        items = [];
        return { data: {} };
      }
      if (path.endsWith('unreleasedIssues'))
        return {
          data: {
            projectId: 'shared',
            hasProduction: false,
            hasPreview: items.length > 0,
            items: [],
          },
        };
      if (path.endsWith('environments'))
        return { data: { projectId: 'shared', items: [] } };
      if (path === 'previews') return { data: items };
      throw new Error(`Unexpected path ${path}`);
    },
  );
});
function Location() {
  return <output aria-label='Current URL'>{useLocation().pathname}</output>;
}
async function show(path = '/projects/shared/overview') {
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'studio', resources: enUS },
    namespaces: { '@nocobase/app-plugin-projects': projectsEnUS },
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Location />
          <Routes>
            <Route path='/projects/:projectId' element={<ProjectDetailPage />}>
              <Route path='overview' element={<div>Project overview</div>} />
              <Route path='releases' element={<ProjectReleases />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
}
async function confirm() {
  fireEvent.click(
    await screen.findByRole('button', { name: 'Actions for acme/app #7' }),
  );
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Destroy' }));
  expect(await screen.findByRole('alertdialog')).toHaveTextContent(
    'App "app-pr-7" and its data will be deleted',
  );
}
it('opens repository previews without production, keeps the active tab after cleanup and removes the entry on leaving', async () => {
  await show();
  fireEvent.click(await screen.findByRole('tab', { name: 'Releases' }));
  expect(
    await screen.findByRole('link', { name: 'Manual change' }),
  ).toHaveAttribute('href', preview.pullRequest!.url);
  await confirm();
  fireEvent.click(screen.getByRole('button', { name: 'Destroy' }));
  expect(await screen.findByText('No previews')).toBeInTheDocument();
  expect(screen.getByLabelText('Current URL')).toHaveTextContent(
    '/projects/shared/releases',
  );
  expect(screen.getByRole('tab', { name: 'Releases' })).toBeInTheDocument();
  await waitFor(() =>
    expect(
      mocks.api.request.mock.calls.filter(([arg]) =>
        arg.path.endsWith('unreleasedIssues'),
      ).length,
    ).toBeGreaterThan(1),
  );
  expect(
    mocks.api.request.mock.calls.filter(([arg]) => arg.path === 'previews')
      .length,
  ).toBeGreaterThan(1);
  fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('tab', { name: 'Releases' }),
    ).not.toBeInTheDocument(),
  );
});
it('redirects a fresh empty releases URL to overview', async () => {
  items = [];
  await show('/projects/shared/releases');
  expect(await screen.findByText('Project overview')).toBeInTheDocument();
  expect(screen.getByLabelText('Current URL')).toHaveTextContent(
    '/projects/shared/overview',
  );
});
it('cancels cleanup and keeps the row with feedback after a failed request', async () => {
  fails = true;
  await show('/projects/shared/releases');
  await confirm();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(
    mocks.api.request.mock.calls.some(([arg]) => arg.method === 'POST'),
  ).toBe(false);
  await confirm();
  fireEvent.click(screen.getByRole('button', { name: 'Destroy' }));
  await waitFor(() =>
    expect(mocks.toaster.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
    ),
  );
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
});
it('hides cleanup without App delete permission', async () => {
  items = [{ ...preview, canDestroy: false }];
  await show('/projects/shared/releases');
  expect(
    await screen.findByRole('link', { name: 'Manual change' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Actions for acme/app #7' }),
  ).not.toBeInTheDocument();
});

it('shows linked issue previews and unlinked PR previews in separate groups with PR state', async () => {
  items = [
    preview,
    {
      ...preview,
      id: 'linked-preview',
      issueId: 'issue-1',
      identifier: 'APP-1',
      title: 'Linked change',
    },
  ];
  await show('/projects/shared/releases');
  expect(
    await screen.findByRole('link', { name: 'Manual change' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'APP-1' })).toHaveAttribute(
    'href',
    '/issues/APP-1',
  );
  expect(screen.getByText('Linked change')).toBeInTheDocument();
  expect(
    screen.getByText('Pull requests without a linked issue · 1'),
  ).toBeInTheDocument();
  expect(screen.getByText('Open')).toBeInTheDocument();
});
