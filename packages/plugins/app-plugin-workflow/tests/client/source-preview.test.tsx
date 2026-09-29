/** @vitest-environment jsdom */
import { I18nProvider } from '@nocobase/i18n/client';
import { Toast } from '@base-ui/react/toast';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import {
  WorkflowDetailPage,
  WorkflowListPage,
} from '../../client/workflow-management/pages.js';
import * as parameterForm from '../../client/workflow-management/parameter-form.js';
import { workflowApi } from '../../client/workflow-management/data.js';
import clientLocales from '../../client/locales/index.js';
import { createWorkflowI18nRuntime } from '../i18n.js';
import { version } from './version-fixtures.js';
import { openMenu } from './menu.js';
import { WORKFLOW_SETTING_PATHS } from '../../client/route-contracts.js';
vi.mock('../../client/workflow-management/workflow-canvas.js', () => ({
  WorkflowCanvas: () => <div>Canvas</div>,
}));
const runtime = await createWorkflowI18nRuntime(clientLocales);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function Location(): React.ReactElement {
  return <output data-testid='location'>{useLocation().pathname}</output>;
}
function open(path: string): ReturnType<typeof render> {
  return render(
    <Toast.Provider>
      <I18nProvider runtime={runtime}>
        <MemoryRouter initialEntries={[path]}>
          <Location />
          <Routes>
            <Route
              path={`${WORKFLOW_SETTING_PATHS.workflows}/:id`}
              element={<WorkflowDetailPage />}
            />
            <Route
              path={WORKFLOW_SETTING_PATHS.workflows}
              element={<WorkflowListPage />}
            />
          </Routes>
        </MemoryRouter>
      </I18nProvider>
    </Toast.Provider>,
  );
}
it.each(['Parameter settings', 'Run manually'])(
  'prompts before %s on an unmaterialized hash detail, including after HMR',
  async (action) => {
    const first = version({
      id: null,
      hash: 'a'.repeat(64),
      title: 'First source',
    });
    const fixed = vi.spyOn(workflowApi, 'workflow').mockResolvedValue(first);
    vi.spyOn(workflowApi, 'revisions').mockResolvedValue([first]);
    const execute = vi.spyOn(workflowApi, 'execute');
    const loader = vi.spyOn(parameterForm, 'loadWorkflowParameterForm');
    open(`${WORKFLOW_SETTING_PATHS.workflows}/${first.hash}`);
    await screen.findByRole('heading', { name: 'First source' });
    await openMenu('More actions');
    fireEvent.click(await screen.findByRole('menuitem', { name: action }));
    await screen.findByRole('dialog', { name: 'Enable this version first' });
    act(() =>
      window.dispatchEvent(new CustomEvent('nocobase:workflow-source-updated')),
    );
    expect(screen.getByTestId('location').textContent).toBe(
      `${WORKFLOW_SETTING_PATHS.workflows}/${first.hash}`,
    );
    await screen.findByRole('dialog', { name: 'Enable this version first' });
    expect(execute).not.toHaveBeenCalled();
    expect(loader).not.toHaveBeenCalled();
    expect(fixed).toHaveBeenCalledTimes(1);
  },
);
it.each(['Parameter settings', 'Run'])(
  'prompts before %s from an unmaterialized list row without fetching forms',
  async (action) => {
    vi.spyOn(workflowApi, 'workflowPage').mockResolvedValue({
      data: [version({ id: null, hash: 'a'.repeat(64) })],
      meta: { page: 1, pageSize: 20, total: 1 },
    });
    const fixed = vi.spyOn(workflowApi, 'workflow');
    const execute = vi.spyOn(workflowApi, 'execute');
    const loader = vi.spyOn(parameterForm, 'loadWorkflowParameterForm');
    open(WORKFLOW_SETTING_PATHS.workflows);
    await screen.findByRole('link', { name: 'Flow' });
    await openMenu('More actions');
    fireEvent.click(await screen.findByRole('menuitem', { name: action }));
    await screen.findByRole('dialog', { name: 'Enable this version first' });
    expect(fixed).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
    expect(loader).not.toHaveBeenCalled();
  },
);
it('keeps an unpublished hash URL pinned to its candidate', async () => {
  const candidate = version({ id: null, version: null, hash: 'a'.repeat(64) });
  const fixed = vi.spyOn(workflowApi, 'workflow').mockResolvedValue(candidate);
  const revisions = vi
    .spyOn(workflowApi, 'revisions')
    .mockResolvedValue([candidate]);
  const path = `${WORKFLOW_SETTING_PATHS.workflows}/${candidate.hash}`;
  open(path);
  await screen.findByRole('heading', { name: 'Flow' });
  act(() =>
    window.dispatchEvent(new CustomEvent('nocobase:workflow-source-updated')),
  );
  await waitFor(() =>
    expect(screen.getByTestId('location').textContent).toBe(path),
  );
  expect(fixed).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(revisions).toHaveBeenCalledTimes(2));
});
it('keeps candidate revisions with the same key addressable by distinct hashes', async () => {
  const first = version({ id: null, version: null, hash: 'a'.repeat(64) });
  const second = version({ id: null, version: null, hash: 'b'.repeat(64) });
  const fixed = vi
    .spyOn(workflowApi, 'workflow')
    .mockImplementation(async (id) => (id === second.hash ? second : first));
  vi.spyOn(workflowApi, 'revisions').mockResolvedValue([first, second]);
  open(`${WORKFLOW_SETTING_PATHS.workflows}/${first.hash}`);
  await screen.findByRole('heading', { name: 'Flow' });
  await openMenu('Version');
  const versions = screen
    .getAllByRole('menuitem')
    .filter(
      (item) => !item.classList.contains('workflow-version-compare-action'),
    );
  fireEvent.click(versions[1]);
  await waitFor(() =>
    expect(screen.getByTestId('location').textContent).toBe(
      `${WORKFLOW_SETTING_PATHS.workflows}/${second.hash}`,
    ),
  );
  expect(fixed).toHaveBeenCalledWith(second.hash);
});
it('keeps materialized detail URLs pinned during source updates', async () => {
  const published = version({ id: '42' });
  const fixed = vi.spyOn(workflowApi, 'workflow').mockResolvedValue(published);
  vi.spyOn(workflowApi, 'revisions').mockResolvedValue([published]);
  const path = `${WORKFLOW_SETTING_PATHS.workflows}/42`;
  open(path);
  await screen.findByRole('heading', { name: 'Flow' });
  act(() =>
    window.dispatchEvent(new CustomEvent('nocobase:workflow-source-updated')),
  );
  expect(fixed).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('location').textContent).toBe(path);
});
it('provides a route back to the list for an expired hash without guessing another workflow', async () => {
  vi.spyOn(workflowApi, 'workflow').mockRejectedValue(
    new Error('The workflow request is invalid.'),
  );
  vi.spyOn(workflowApi, 'revisions').mockResolvedValue([]);
  open(`${WORKFLOW_SETTING_PATHS.workflows}/${'a'.repeat(64)}`);
  expect((await screen.findByRole('alert')).textContent).toContain(
    'source has changed',
  );
  expect(
    screen
      .getByRole('link', { name: 'Back to workflows' })
      .getAttribute('href'),
  ).toBe(WORKFLOW_SETTING_PATHS.workflows);
});

it('navigates to the materialized id after enabling the displayed revision', async () => {
  const candidate = version({ id: null, version: null, hash: 'a'.repeat(64) });
  const published = version({
    ...candidate,
    id: '42',
    version: 'version-1',
    current: true,
    enabled: true,
  });
  vi.spyOn(workflowApi, 'workflow').mockImplementation(async (id) =>
    id === candidate.hash ? candidate : published,
  );
  vi.spyOn(workflowApi, 'revisions').mockResolvedValue([published]);
  const enable = vi.spyOn(workflowApi, 'enable').mockResolvedValue(published);
  const path = `${WORKFLOW_SETTING_PATHS.workflows}/${candidate.hash}`;
  open(path);
  fireEvent.click(await screen.findByRole('switch', { name: 'Enable Flow' }));
  await waitFor(() =>
    expect(screen.getByTestId('location').textContent).toBe(
      `${WORKFLOW_SETTING_PATHS.workflows}/42`,
    ),
  );
  expect(enable).toHaveBeenCalledWith(candidate.hash);
});
it('links unpublished rows and pending revisions by hash while keeping published rows pinned', async () => {
  vi.spyOn(workflowApi, 'workflowPage').mockResolvedValue({
    data: [
      version({ id: null, key: 'draft', title: 'Draft', hash: 'a'.repeat(64) }),
      version({
        id: '42',
        key: 'published',
        title: 'Published',
        pendingArtifact: { hash: 'b'.repeat(64), title: 'New' },
      }),
    ],
    meta: { page: 1, pageSize: 20, total: 2 },
  });
  open(WORKFLOW_SETTING_PATHS.workflows);
  expect(
    (await screen.findByRole('link', { name: 'Draft' })).getAttribute('href'),
  ).toBe(`${WORKFLOW_SETTING_PATHS.workflows}/${'a'.repeat(64)}`);
  expect(
    screen.getByRole('link', { name: 'Published' }).getAttribute('href'),
  ).toBe(`${WORKFLOW_SETTING_PATHS.workflows}/42`);
  expect(
    screen
      .getByRole('link', { name: 'New version available' })
      .getAttribute('href'),
  ).toBe(`${WORKFLOW_SETTING_PATHS.workflows}/${'b'.repeat(64)}`);
});

it('runs a previously materialized disabled version without requiring parameter configuration', async () => {
  const published = version({ id: '42', enabled: false, hasParameters: true });
  vi.spyOn(workflowApi, 'workflow').mockResolvedValue(published);
  vi.spyOn(workflowApi, 'revisions').mockResolvedValue([published]);
  const execute = vi
    .spyOn(workflowApi, 'execute')
    .mockRejectedValue(new Error('test execution'));
  open(`${WORKFLOW_SETTING_PATHS.workflows}/42`);
  await screen.findByRole('heading', { name: 'Flow' });
  await openMenu('More actions');
  fireEvent.click(
    await screen.findByRole('menuitem', { name: 'Run manually' }),
  );
  await waitFor(() =>
    expect(execute).toHaveBeenCalledWith('42', {}, expect.any(String)),
  );
  expect(
    screen.queryByRole('dialog', { name: 'Enable this version first' }),
  ).toBeNull();
});
it('opens the returned id when enabling an unmaterialized list row', async () => {
  const candidate = version({ id: null, hash: 'a'.repeat(64) });
  const published = version({ id: '42', enabled: true });
  vi.spyOn(workflowApi, 'workflowPage').mockResolvedValue({
    data: [candidate],
    meta: { page: 1, pageSize: 20, total: 1 },
  });
  vi.spyOn(workflowApi, 'workflow').mockResolvedValue(published);
  vi.spyOn(workflowApi, 'revisions').mockResolvedValue([published]);
  vi.spyOn(workflowApi, 'enable').mockResolvedValue(published);
  open(WORKFLOW_SETTING_PATHS.workflows);
  fireEvent.click(await screen.findByRole('switch', { name: 'Enable Flow' }));
  await waitFor(() =>
    expect(screen.getByTestId('location').textContent).toBe(
      `${WORKFLOW_SETTING_PATHS.workflows}/42`,
    ),
  );
});
