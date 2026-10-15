import agents from '@nocobase/app-plugin-agents/client';
import type { RunWait } from '@nocobase/app-plugin-agents/shared/runs';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  AgentQueueData,
  AgentQueueRow,
} from '../../client/extensions/nocobase-agent-queue/types.js';
import { AgentQueueView } from '../../client/issues/agent-view.js';
import type { IssuesPage } from '../../client/issues/use-issues-page.js';
import locales from '../../client/locales/index.js';

const mocks = vi.hoisted(() => ({
  board: { data: undefined as AgentQueueData | undefined, isFetching: false },
  api: { request: vi.fn() },
}));
vi.mock('../../client/agents/board/api.js', async (original) => ({
  ...(await original<typeof import('../../client/agents/board/api.js')>()),
  useAgentBoard: () => mocks.board,
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => mocks.api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  useViewer: () => ({ userId: 'viewer' }),
}));

afterEach(cleanup);

const quick: RunWait = {
  reason: 'noRunnerOnline',
  position: 1,
  agentPosition: 1,
  until: null,
  tool: null,
  missing: [],
  detail: null,
};

const row = (id: string, position: number): AgentQueueRow => ({
  agentId: 'coder',
  state: 'queued',
  run: {
    id: `run-${id}`,
    status: 'queued',
    since: new Date().toISOString(),
    runnerName: null,
    mayStart: false,
  },
  queue: { ...quick, position, agentPosition: position },
  blockedBy: null,
  waiting: null,
  idle: null,
  issue: {
    id,
    identifier: `PM-${position}`,
    title: `Work ${id}`,
    blockedCount: 0,
  },
  mine: true,
  others: [],
});

const board: AgentQueueData = {
  agents: {
    coder: {
      id: 'coder',
      name: 'Coder',
      avatar: null,
      tool: 'claude',
      archived: false,
      online: false,
      active: 0,
      maxConcurrentRuns: 1,
    },
  },
  rows: [row('a', 1), row('b', 2)],
  summary: { runners: { online: 0, busy: 0 } },
  truncated: false,
  generatedAt: new Date().toISOString(),
};

async function show() {
  const plugin = agents();
  const i18n = await createTestI18nRuntime({
    application: { namespace: 'studio', resources: locales },
    namespaces: { [plugin.packageName]: plugin.locales! },
  });
  mocks.board.data = board;
  const page = {
    filters: {},
    params: new URLSearchParams(),
    filtered: false,
  } as IssuesPage;
  render(
    <TestI18nProvider runtime={i18n} namespace='studio'>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AgentQueueView page={page} issueHref={(id) => `/issues/${id}`} />
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
}

describe('the Agent queue’s exact wait', () => {
  it('reads the reason only for the row unfolded, once', async () => {
    mocks.api.request.mockReset().mockResolvedValue({
      data: {
        ...quick,
        reason: 'concurrencyFull',
        params: { active: 1, limit: 1 },
      },
    });
    await show();
    const toggles = screen.getAllByRole('button', { name: 'Why it waits' });
    expect(toggles).toHaveLength(2);
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'false');
    // Folded rows read nothing: the list's short reason is all they show.
    expect(mocks.api.request).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(toggles[0]!);
    });
    expect(
      await screen.findByTestId('agent-queue-why-detail'),
    ).toHaveTextContent(/1\/1/u);
    expect(mocks.api.request).toHaveBeenCalledTimes(1);
    expect(mocks.api.request.mock.calls[0]![0]).toMatchObject({
      path: 'agentBoard/issues/a/agents/coder/wait',
    });
    expect(
      screen.getByRole('button', { name: 'Hide why it waits' }),
    ).toHaveAttribute('aria-expanded', 'true');

    // Folding and unfolding again keeps the answer it has.
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Hide why it waits' }),
      );
    });
    await act(async () => {
      fireEvent.click(
        screen.getAllByRole('button', { name: 'Why it waits' })[0]!,
      );
    });
    expect(mocks.api.request).toHaveBeenCalledTimes(1);
  });
});
