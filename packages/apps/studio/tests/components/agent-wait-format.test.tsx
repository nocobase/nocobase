import agents from '@nocobase/app-plugin-agents/client';
import type { RunWait } from '@nocobase/app-plugin-agents/shared/runs';
import { IntakeWaitFormatContext } from '@nocobase/app-plugin-projects/client/kit';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useContext, type ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { AgentIntakeWaitFormat } from '../../client/agents/intake-wait-format.js';
import { runnersRenderer } from '../../client/inbox/contributions/runners.js';
import {
  RUNNERS_NAMESPACE,
  runnersResources,
} from '../../client/inbox/contributions/runners.locales.js';
import type { InboxEntry } from '../../client/extensions/nocobase-inbox/model.js';
import { AgentQueue } from '../../client/extensions/nocobase-agent-queue/agent-queue.js';
import type {
  AgentQueueData,
  AgentQueueWait,
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

const board = (wait: AgentQueueWait): AgentQueueData => ({
  agents: {
    coder: {
      id: 'coder',
      name: 'Coder',
      avatar: null,
      tool: 'claude',
      archived: false,
      online: false,
      active: 0,
      maxConcurrentRuns: 2,
    },
  },
  rows: [
    {
      agentId: 'coder',
      state: 'queued',
      run: null,
      queue: wait,
      blockedBy: null,
      waiting: null,
      idle: null,
      issue: {
        id: 'issue',
        identifier: 'PM-1',
        title: 'Work',
        blockedCount: 0,
      },
      mine: true,
      others: [],
    },
  ],
  summary: { runners: { online: 0, busy: 0 } },
  truncated: false,
  generatedAt: new Date().toISOString(),
});
const teamWait: RunWait = {
  reason: 'secretsNotAllowed',
  params: { variables: ['NPM_TOKEN'] },
  position: 1,
  agentPosition: 1,
  until: null,
  tool: null,
  missing: [],
  detail: null,
};

async function runtime(strict = true) {
  const plugin = agents();
  return createTestI18nRuntime({
    application: { namespace: 'studio', resources: locales },
    namespaces: {
      [plugin.packageName]: plugin.locales!,
      [RUNNERS_NAMESPACE]: {
        'en-US': () => Promise.resolve({ default: runnersResources['en-US'] }),
        'zh-CN': () => Promise.resolve({ default: runnersResources['zh-CN'] }),
      },
    },
    strict,
  });
}

function IntakeWaitProbe({
  wait,
}: {
  readonly wait: AgentQueueWait;
}): ReactElement {
  const format = useContext(IntakeWaitFormatContext);
  return <p>{format?.(wait)}</p>;
}

function RunnerNoticeProbe(): ReactElement {
  const words = runnersRenderer.useWording();
  const entry = {
    notice: {
      type: 'run_secrets_not_allowed',
      subject: { type: 'run', id: 'run1' },
      data: { variables: 'NPM_TOKEN' },
    },
  } as InboxEntry;
  const text = words.text(entry, null);
  return <p>{text.sentence}</p>;
}

describe('Studio wait descriptions', () => {
  it('translates team-only variable inbox notices with the same wait formatter', async () => {
    const i18n = await runtime();
    render(
      <TestI18nProvider runtime={i18n} namespace={RUNNERS_NAMESPACE}>
        <RunnerNoticeProbe />
      </TestI18nProvider>,
    );
    expect(
      screen.getByText(
        'Needs a team runtime: NPM_TOKEN is for team runtimes only',
      ),
    ).toBeInTheDocument();
    await act(() => i18n.changeLanguage('zh-CN'));
    expect(
      screen.getByText('需要团队运行环境：NPM_TOKEN 仅限团队运行环境'),
    ).toBeInTheDocument();
  });
  it('accepts plugin waits and safely renders a future reason without a formatter', () => {
    expectTypeOf<RunWait>().toMatchTypeOf<AgentQueueWait>();
    render(
      <AgentQueue
        data={board({ reason: 'futureReason', position: 1, agentPosition: 1 })}
        viewerId={null}
        issueHref={(issue) => `/issues/${issue.id}`}
      />,
    );
    expect(screen.getByText('futureReason')).toBeInTheDocument();
  });

  it('words team-only secrets in the actual queue view and updates when the language changes', async () => {
    const i18n = await runtime();
    mocks.board.data = board(teamWait);
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
    const badge = screen.getByText(
      'Needs a team runtime: NPM_TOKEN is for team runtimes only',
    );
    expect(badge.closest('[class*="amber"]')).not.toBeNull();
    await act(() => i18n.changeLanguage('zh-CN'));
    expect(
      screen.getByText('需要团队运行环境：NPM_TOKEN 仅限团队运行环境'),
    ).toBeInTheDocument();
  });

  it('provides localized parameterized intake waits, Studio overrides, and unknown-reason fallback', async () => {
    // Future reason codes deliberately have no translation key in this version.
    const i18n = await runtime(false);
    const show = (wait: AgentQueueWait) => (
      <TestI18nProvider runtime={i18n} namespace='studio'>
        <AgentIntakeWaitFormat>
          <IntakeWaitProbe wait={wait} />
        </AgentIntakeWaitFormat>
      </TestI18nProvider>
    );
    const view = render(show(teamWait));
    expect(
      screen.getByText(
        'Needs a team runtime: NPM_TOKEN is for team runtimes only',
      ),
    ).toBeInTheDocument();
    await act(() => i18n.changeLanguage('zh-CN'));
    expect(
      screen.getByText('需要团队运行环境：NPM_TOKEN 仅限团队运行环境'),
    ).toBeInTheDocument();
    view.rerender(
      show({
        ...teamWait,
        reason: 'toolSlotsFull',
        params: { tool: 'claude', used: 2, limit: 2 },
      }),
    );
    expect(
      screen.getByText('等待 claude 的槽位：合适的运行环境上都已占满（2/2）'),
    ).toBeInTheDocument();
    view.rerender(show({ ...teamWait, reason: 'futureReason' }));
    expect(screen.getByText('排队中（futureReason）')).toBeInTheDocument();
  });
});
