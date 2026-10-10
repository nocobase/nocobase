import { ApiClientError } from '@nocobase/app-client';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import agentEn from '../../../../plugins/app-plugin-agents/client/locales/en-US.js';
import agentZh from '../../../../plugins/app-plugin-agents/client/locales/zh-CN.js';
import en from '../../client/locales/en-US.js';
import zh from '../../client/locales/zh-CN.js';
import {
  IssueRunPanel,
  IssueLiveRun,
  IssueRunRow,
  IssueRunTranscript,
} from '../../client/agents/issue-runs.js';
import { useIssueRunsState } from '../../client/agents/use-issue-runs.js';
import { RouteDialog } from '../../client/components/route-dialog.js';
import { runReturnFocus } from '../../client/agents/run-focus.js';

const mocks = vi.hoisted(() => ({
  runs: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn(),
  retry: vi.fn(),
  detail: null as Record<string, unknown> | null,
}));
vi.mock('@nocobase/app-plugin-agents/client/runs', () => ({
  useAgentsApi: () => ({ runs: mocks.runs }),
  useAgentNames: () => () => 'Long agent name that stays fully readable',
  useStopRun: () => ({ mutate: mocks.stop }),
  useWorkspaceReset: () => ({ mutate: mocks.reset, isPending: false }),
  useRetryRun: () => ({ mutate: mocks.retry, isPending: false }),
  useRunBrief: () => ({}),
  useRunWithTranscript: () => ({
    run: { data: mocks.detail },
    events: [],
    failed: false,
    trigger: null,
  }),
}));
vi.mock('@nocobase/app-plugin-agents/client/kit', () => ({
  AgentAvatar: () => null,
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
}));
const issue = {
  id: 'example',
  revision: 1,
  executor: { type: 'agent', id: 'agent' },
} as IssueDetail;
const run = (id = 'run', status = 'completed') => ({
  id,
  agentId: 'agent',
  status,
  model: 'configured-model',
  actualModels: ['reported-model'],
  createdAt: '2026-01-01T09:00:00Z',
  startedAt: '2026-01-01T09:01:00Z',
  finishedAt: status === 'completed' ? '2026-01-01T09:02:00Z' : null,
  cancelRequestedAt: null,
});
const error = (status: number) =>
  new ApiClientError('Private server error', {
    status,
    method: 'GET',
    url: '/agents/runs',
  });
async function show(
  options: {
    locale?: 'en-US' | 'zh-CN';
    detail?: IssueDetail;
    consumers?: boolean;
    transcript?: boolean;
  } = {},
) {
  const locale = options.locale ?? 'en-US';
  const runtime = await createTestI18nRuntime({
    locale,
    application: {
      namespace: 'studio',
      resources: locale === 'en-US' ? en : zh,
    },
    namespaces: {
      '@nocobase/app-plugin-agents': locale === 'en-US' ? agentEn : agentZh,
    },
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const detail = options.detail ?? issue;
  function Page() {
    return (
      <>
        <IssueRunPanel issue={detail} />
        {options.consumers ? (
          <>
            <IssueLiveRun issue={detail} />
            <IssueRunRow issue={detail} runId='run' />
          </>
        ) : null}
        <Outlet />
      </>
    );
  }
  const view = render(
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/issues/example']}>
          <Routes>
            <Route path='/issues/example' element={<Page />}>
              <Route
                path='runs/:id'
                element={
                  <RouteDialog title='Transcript' finalFocus={runReturnFocus}>
                    {options.transcript ? (
                      <IssueRunTranscript runId='run' />
                    ) : (
                      'Transcript body'
                    )}
                  </RouteDialog>
                }
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
  return { ...view, client };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.runs.mockResolvedValue([run()]);
  mocks.detail = {
    ...run(),
    status: 'failed',
    inputs: [],
    maxAttempts: 1,
    modelService: null,
    tool: null,
  };
});

describe('issue execution history', () => {
  it.each(['en-US', 'zh-CN'] as const)(
    'shows models and distinguishable transcript links in %s',
    async (locale) => {
      mocks.runs.mockResolvedValue([
        run('first'),
        { ...run('second'), createdAt: '2026-01-02T09:00:00Z' },
      ]);
      await show({ locale });
      const links = await screen.findAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAccessibleName(/Long agent name.*reported-model/u);
      expect(links[0]?.getAttribute('aria-label')).not.toBe(
        links[1]?.getAttribute('aria-label'),
      );
      expect(links[0]).not.toHaveTextContent('configured-model');
      expect(links[0]).toHaveTextContent(
        locale === 'en-US' ? 'Completed' : '已完成',
      );
    },
  );
  it('labels configured and unknown models without claiming they were reported', async () => {
    mocks.runs.mockResolvedValue([
      { ...run('configured'), actualModels: [] },
      { ...run('unknown'), actualModels: [], model: null },
    ]);
    await show();
    expect(
      await screen.findByText('Configured model: configured-model'),
    ).toBeVisible();
    expect(screen.getByText('Model not reported')).toBeVisible();
  });
  it('shows a named loading state before data arrives', async () => {
    mocks.runs.mockReturnValue(new Promise(() => {}));
    await show();
    expect(
      screen.getByRole('status', { name: 'Loading execution log…' }),
    ).toBeVisible();
    expect(
      screen.getByRole('region', { name: 'Execution log' }),
    ).toHaveAttribute('aria-busy', 'true');
  });
  it('shows the empty agent state', async () => {
    mocks.runs.mockResolvedValue([]);
    await show();
    expect(await screen.findByText('No runs yet.')).toBeVisible();
  });
  it('hides an empty successful non-agent history', async () => {
    mocks.runs.mockResolvedValue([]);
    await show({ detail: { ...issue, executor: null } });
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Execution log' }),
      ).toBeNull(),
    );
  });
  it('retains a non-agent history when there are records', async () => {
    await show({ detail: { ...issue, executor: null } });
    expect(await screen.findByRole('link')).toBeVisible();
  });
  it('offers retry on an initial error and recovers', async () => {
    mocks.runs.mockRejectedValueOnce(error(500));
    await show();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load',
    );
    expect(screen.queryByText('Private server error')).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('link')).toBeVisible();
  });
  it('preserves records and focus when a background refresh fails', async () => {
    const { client } = await show();
    const link = await screen.findByRole('link');
    link.focus();
    mocks.runs.mockRejectedValueOnce(error(500));
    await act(() =>
      client.invalidateQueries({ queryKey: ['studio', 'issue-runs'] }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Showing the last loaded records',
    );
    expect(link).toHaveFocus();
    expect(link).toBeVisible();
  });
  it.each([401, 403, 404])(
    'hides cached history and summaries on %s',
    async (status) => {
      mocks.runs.mockResolvedValue([run('run', 'running')]);
      const { client } = await show({ consumers: true });
      await screen.findByTestId('run-run');
      mocks.runs.mockRejectedValue(error(status));
      await act(() =>
        client.invalidateQueries({ queryKey: ['studio', 'issue-runs'] }),
      );
      expect(await screen.findByRole('alert')).toBeVisible();
      expect(
        screen.queryByText('Long agent name that stays fully readable'),
      ).toBeNull();
      expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
      expect(screen.queryByTestId('run-run')).toBeNull();
      if (status === 401)
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
    },
  );
  it('keeps denied cache empty through a later transient error and recovers after success', async () => {
    const { client } = await show();
    await screen.findByRole('link');
    mocks.runs.mockRejectedValue(error(403));
    await act(() =>
      client.invalidateQueries({ queryKey: ['studio', 'issue-runs'] }),
    );
    await screen.findByRole('alert');
    mocks.runs.mockRejectedValue(error(500));
    await act(() =>
      client.invalidateQueries({ queryKey: ['studio', 'issue-runs'] }),
    );
    expect(screen.queryByRole('link')).toBeNull();
    mocks.runs.mockResolvedValue([run()]);
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('link')).toBeVisible();
  });
  it('refreshes once per revision and explicit refresh signal with several consumers', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    function Consumer({
      revision,
      signal,
    }: {
      revision: number;
      signal?: number;
    }) {
      const state = useIssueRunsState({ ...issue, revision }, signal);
      return <span>{state.runs.length}</span>;
    }
    const tree = (revision: number, signal: number) => (
      <QueryClientProvider client={client}>
        <Consumer revision={revision} signal={signal} />
        <Consumer revision={revision} />
      </QueryClientProvider>
    );
    const view = render(tree(1, 0));
    await waitFor(() => expect(screen.getAllByText('1')).toHaveLength(2));
    expect(mocks.runs).toHaveBeenCalledTimes(1);
    view.rerender(tree(2, 0));
    await waitFor(() => expect(mocks.runs).toHaveBeenCalledTimes(2));
    view.rerender(tree(2, 1));
    await waitFor(() => expect(mocks.runs).toHaveBeenCalledTimes(3));
  });
  it('polls open runs and stops polling completed runs', async () => {
    mocks.runs
      .mockResolvedValueOnce([run('run', 'running')])
      .mockResolvedValue([run()]);
    const { client } = await show();
    await screen.findByRole('button', { name: 'Stop' });
    await waitFor(() => expect(mocks.runs).toHaveBeenCalledTimes(2), {
      timeout: 3500,
    });
    await new Promise((resolve) => setTimeout(resolve, 2200));
    expect(mocks.runs).toHaveBeenCalledTimes(2);
    client.clear();
  });
  it('shares one initial list request across consumers', async () => {
    await show({ consumers: true });
    await screen.findByTestId('run-run');
    expect(mocks.runs).toHaveBeenCalledTimes(1);
  });
  it('clears conflicting agent and status filters in all runs', async () => {
    mocks.runs.mockResolvedValue([
      run('one'),
      { ...run('two', 'failed'), agentId: 'second' },
      run('three'),
      run('four'),
    ]);
    await show();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'View all 4' }));
    screen.getByRole('combobox', { name: 'Agent' }).focus();
    await user.keyboard('{ArrowDown}');
    await user.click(
      (
        await screen.findAllByRole('option', {
          name: 'Long agent name that stays fully readable',
        })
      )[0]!,
    );
    screen.getByRole('combobox', { name: 'Status' }).focus();
    await user.keyboard('{ArrowDown}');
    await user.click(await screen.findByRole('option', { name: 'Failed' }));
    expect(screen.getByText('No runs match these filters.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByTestId('all-runs').querySelectorAll('a')).toHaveLength(
      4,
    );
  });
  it('returns keyboard focus to the direct transcript trigger', async () => {
    await show();
    const user = userEvent.setup();
    const link = await screen.findByRole('link');
    link.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(link).toHaveFocus());
  });
  it.each([
    ['title', false],
    ['activity', false],
    ['title', true],
    ['activity', true],
  ] as const)(
    'returns focus to the current %s entry after a prior sidebar opening: %s',
    async (entry, priorSidebar) => {
      mocks.runs.mockResolvedValue([run('run', 'running')]);
      await show({ consumers: true });
      const user = userEvent.setup();
      const sidebar = (await screen.findByTestId('run-run')).querySelector(
        'a',
      )!;
      if (priorSidebar) {
        sidebar.focus();
        await user.keyboard('{Enter}');
        await screen.findByText('Transcript body');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(sidebar).toHaveFocus());
      }
      const trigger =
        entry === 'title'
          ? screen.getByTestId('run-live').closest('a')!
          : screen.getByTestId('run-row-run').querySelector('a')!;
      trigger.focus();
      await user.keyboard('{Enter}');
      await screen.findByText('Transcript body');
      await user.keyboard('{Escape}');
      await waitFor(() => expect(trigger).toHaveFocus());
    },
  );
  it('returns focus to View all after choosing a transcript there', async () => {
    mocks.runs.mockResolvedValue([
      run('one'),
      run('two'),
      run('three'),
      run('four'),
    ]);
    await show();
    const user = userEvent.setup();
    const all = await screen.findByRole('button', { name: 'View all 4' });
    await user.click(all);
    const list = await screen.findByTestId('all-runs');
    await user.click(list.querySelector('a')!);
    await screen.findByText('Transcript body');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(all).toHaveFocus());
  });
  it('falls back to the history heading if polling removes the trigger', async () => {
    const { client } = await show({
      detail: { ...issue, executor: { type: 'user', id: 'user' } },
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('link'));
    await screen.findByText('Transcript body');
    mocks.runs.mockResolvedValue([]);
    await act(() =>
      client.invalidateQueries({ queryKey: ['studio', 'issue-runs'] }),
    );
    await waitFor(() => expect(screen.queryByRole('link')).toBeNull());
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Execution log' }),
      ).toHaveFocus(),
    );
  });
  it('returns focus after stop cancellation and refreshes after confirmation', async () => {
    mocks.runs.mockResolvedValue([run('run', 'running')]);
    await show();
    const user = userEvent.setup();
    const stop = await screen.findByRole('button', { name: 'Stop' });
    await user.click(stop);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(stop).toHaveFocus());
    await user.click(stop);
    await user.click(
      screen
        .getByRole('alertdialog')
        .querySelector('[data-slot="alert-dialog-action"]')!,
    );
    const call = mocks.stop.mock.calls[0]!;
    mocks.runs.mockResolvedValue([]);
    await act(() => call[1].onSuccess());
    await waitFor(() => expect(mocks.runs).toHaveBeenCalledTimes(2));
  });
  it('refreshes the Studio query after retrying from the transcript', async () => {
    await show({ transcript: true });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('link'));
    await user.click(await screen.findByRole('button', { name: 'Retry' }));
    const call = mocks.retry.mock.calls[0]!;
    await act(() => call[1].onSuccess({ id: 'next-run' }));
    await waitFor(() => expect(mocks.runs).toHaveBeenCalledTimes(2));
  });
  it('returns focus after cleanup cancellation and refreshes on success', async () => {
    await show();
    const user = userEvent.setup();
    const reset = await screen.findByRole('button', {
      name: 'Clean working directory',
    });
    await user.click(reset);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(reset).toHaveFocus());
    await user.click(reset);
    await user.click(
      screen
        .getByRole('alertdialog')
        .querySelector('[data-slot="alert-dialog-action"]')!,
    );
    const call = mocks.reset.mock.calls[0]!;
    await act(() => call[1].onSuccess());
    await waitFor(() => expect(mocks.runs).toHaveBeenCalledTimes(2));
  });
});
