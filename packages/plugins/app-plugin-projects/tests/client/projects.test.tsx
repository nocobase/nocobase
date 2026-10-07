import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProjectResource } from '../../shared/projects.js';
import {
  BUILTIN_STATUSES,
  type WorkflowListItem,
} from '../../shared/workflows.js';
import { api, clientMocks, me, resetApi } from './fake-client.js';
import { renderAt } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { useProjectResources, useProjectWorkflow, useResourceValidation } =
  await import('../../client/projects.js');
const { default: NewProjectPage } =
  await import('../../client/pages/projects/new.js');

afterEach(cleanup);

const repo: ProjectResource = {
  id: 'r1',
  projectId: 'p1',
  type: 'gitRepo',
  url: 'https://github.com/acme/app.git',
  defaultRef: null,
  runnerId: null,
  path: null,
  label: null,
  initPrompt: null,
  position: 0,
};

const directory: ProjectResource = {
  id: 'r2',
  projectId: 'p1',
  type: 'directory',
  url: null,
  defaultRef: null,
  runnerId: 'rn1',
  path: '/srv/data',
  label: null,
  initPrompt: null,
  position: 1,
};

const workflow: WorkflowListItem = {
  id: 'wf1',
  name: 'Release train',
  description: null,
  isDefault: true,
  builtInKey: null,
  definition: { states: BUILTIN_STATUSES, transitions: [] },
  revision: 1,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
  projectCount: 1,
};

function wrapper({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const blank = {
  type: 'gitRepo',
  url: '',
  defaultRef: '',
  runnerId: '',
  path: '',
  label: '',
  initPrompt: '',
} as const;

describe("a project's working directories", () => {
  it('sorts them by position, the primary first', () => {
    resetApi({});
    const { result } = renderHook(
      () => useProjectResources('p1', [directory, repo]),
      { wrapper },
    );
    expect(result.current.sorted.map((resource) => resource.id)).toEqual([
      'r1',
      'r2',
    ]);
  });

  it('saves an edited repository with empty fields as none', async () => {
    resetApi({ 'PATCH projects/p1/resources/r1': () => ({ data: repo }) });
    const { result } = renderHook(() => useProjectResources('p1', [repo]), {
      wrapper,
    });
    await act(() =>
      result.current.save(
        { ...blank, url: repo.url ?? '', label: 'App' },
        repo,
      ),
    );
    expect(api.calls.at(-1)?.json).toEqual({
      url: repo.url,
      defaultRef: null,
      label: 'App',
      initPrompt: null,
    });
  });

  it('adds a git repository and a directory on a runner, trimmed', async () => {
    resetApi({ 'POST projects/p1/resources': () => ({ data: repo }) });
    const { result } = renderHook(() => useProjectResources('p1', []), {
      wrapper,
    });
    await act(() =>
      result.current.save(
        {
          ...blank,
          url: 'https://github.com/acme/app.git',
          initPrompt: ' Run pnpm install. ',
        },
        null,
      ),
    );
    expect(api.calls.at(-1)?.json).toEqual({
      type: 'gitRepo',
      url: 'https://github.com/acme/app.git',
      defaultRef: null,
      label: null,
      initPrompt: 'Run pnpm install.',
    });
    await act(() =>
      result.current.save(
        { ...blank, type: 'directory', runnerId: 'rn1', path: '/srv/data' },
        null,
      ),
    );
    expect(api.calls.at(-1)?.json).toEqual({
      type: 'directory',
      runnerId: 'rn1',
      path: '/srv/data',
      label: null,
      initPrompt: null,
    });
  });

  it("checks the form in the plugin's words", () => {
    const { result } = renderHook(() => useResourceValidation());
    const validate = result.current;
    expect(validate(blank)).toEqual({ url: 'resources.urlRequired' });
    expect(validate({ ...blank, url: 'not a url' })).toEqual({
      url: 'resources.urlInvalid',
    });
    expect(validate({ ...blank, type: 'directory' })).toEqual({
      runnerId: 'resources.runnerRequired',
      path: 'resources.pathRequired',
    });
    expect(
      validate({ ...blank, type: 'directory', runnerId: 'rn1', path: 'srv' }),
    ).toEqual({ path: 'resources.pathInvalid' });
  });
});

describe("a project's workflow", () => {
  it('names the default workflow for a project without one, and saves choosing it as none', async () => {
    resetApi({ 'projects/workflows': () => ({ data: [workflow] }) });
    const { result } = renderHook(
      () => useProjectWorkflow({ workflowId: null }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.name).toBe('Release train'));
    expect(result.current.value).toBe('wf1');
    expect(result.current.noneLabel).toBeUndefined();
    expect(result.current.toWorkflowId('wf1')).toBeUndefined();
  });

  it('names the built-in statuses while no workflow is the default', async () => {
    resetApi({ 'projects/workflows': () => ({ data: [] }) });
    const { result } = renderHook(
      () => useProjectWorkflow({ workflowId: null }),
      { wrapper },
    );
    await waitFor(() =>
      expect(result.current.name).toBe('workflows.builtInStatuses'),
    );
    expect(result.current.noneLabel).toBe('workflows.builtInStatuses');
  });
});

describe('a new project while no workflow is the default', () => {
  it('offers the built-in statuses as the workflow of a new project', async () => {
    resetApi({
      'projects/me': () => ({ data: me('admin') }),
      'projects/members': () => ({ data: [] }),
      'projects/workflows': () => ({ data: [] }),
    });
    renderAt('/projects/new', [
      { path: '/projects/new', element: <NewProjectPage /> },
    ]);
    await waitFor(() =>
      expect(screen.getByLabelText('projects.workflow').textContent).toContain(
        'workflows.builtInStatuses',
      ),
    );
  });
});

describe('new project', () => {
  it('asks before discarding a name being typed', async () => {
    resetApi({
      'projects/me': () => ({ data: me('admin') }),
      'projects/members': () => ({ data: [] }),
      'projects/workflows': () => ({ data: [workflow] }),
    });
    renderAt('/projects/new', [
      { path: '/projects', element: <p>list</p> },
      { path: '/projects/new', element: <NewProjectPage /> },
    ]);
    fireEvent.change(await screen.findByLabelText('projectForm.name'), {
      target: { value: 'Apollo' },
    });
    fireEvent.click(screen.getByText('actions.cancel'));
    await screen.findByText('unsavedChanges.title');
  });
});
