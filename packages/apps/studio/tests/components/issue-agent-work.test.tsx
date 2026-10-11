import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { AgentWorkMark } from '../../client/issues/agent-work-mark.js';
import { IssueMarks } from '../../client/issues/issue-marks.js';
import { IssueCard } from '../../client/components/issue-card.js';
import {
  IssueTable,
  type IssueTableRow,
} from '../../client/components/issue-table.js';
import {
  ISSUE_AGENT_WORK_POLL_MS,
  useIssueAgentWork,
} from '../../client/issues/use-agent-work.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  stop: vi.fn(),
  callbacks: [] as (() => void)[],
}));
const api = { request: mocks.request };
vi.mock('../../client/git/pull-requests.js', () => ({
  PullRequestMarkBadge: () => null,
}));
vi.mock('../../client/deploys/marks.js', () => ({
  DeployMarkTags: () => null,
}));
const realtime = {
  subscribe: (_topic: string, callback: () => void) => {
    mocks.callbacks.push(callback);
    return mocks.stop;
  },
  onOpen: (callback: () => void) => {
    mocks.callbacks.push(callback);
    return mocks.stop;
  },
};
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useService: () => realtime,
}));

type Issue = Pick<IssueListItem, 'id' | 'executor'>;
const issue = (id = 'i1', agentId = 'a1'): Issue => ({
  id,
  executor: { type: 'agent', id: agentId },
});
const working = (issueId = 'i1', agentId = 'a1', active = true) => ({
  issueId,
  agentId,
  working: active,
});

function View({ issues, scope = 'all' }: { issues: Issue[]; scope?: string }) {
  const work = useIssueAgentWork(issues, scope);
  return (
    <>
      {issues
        .filter((item) => work.has(item.id))
        .map((item) => (
          <AgentWorkMark key={item.id} name={work.get(item.id)!} />
        ))}
    </>
  );
}

async function setup(locale: 'en-US' | 'zh-CN' = 'en-US') {
  const runtime = await createTestI18nRuntime({
    locale,
    application: {
      namespace: packageMetadata.name,
      resources: locale === 'en-US' ? enUS : zhCN,
    },
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestI18nProvider runtime={runtime} namespace={packageMetadata.name}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </TestI18nProvider>
  );
  return { Wrapper, client };
}
const settle = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
};
const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
  await settle();
};

beforeEach(() => {
  vi.useFakeTimers();
  mocks.request.mockReset().mockResolvedValue({ data: [] });
  mocks.stop.mockClear();
  mocks.callbacks.length = 0;
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  });
  focusManager.setFocused(true);
});
afterEach(() => {
  vi.useRealTimers();
  focusManager.setFocused(undefined);
});

describe('issue work marks and refresh', () => {
  it('uses the same mark in cards and table rows without consuming selection or sorting', async () => {
    const { Wrapper } = await setup();
    const select = vi.fn();
    const sort = vi.fn();
    const row: IssueTableRow = {
      id: 'i1',
      identifier: 'PM-252',
      title: 'Agent work',
      priority: 'medium',
      labels: [],
      status: null,
      owner: null,
      executor: null,
      updatedAt: '2026-10-10T00:00:00Z',
    };
    render(
      <>
        <IssueCard
          issue={row}
          onSelect={select}
          marks={
            <IssueMarks
              issue={{ id: row.id, revision: 1 }}
              placement='card'
              workingAgentName='Coder'
            />
          }
        />
        <IssueTable
          rows={[row]}
          onRowClick={select}
          onSortChange={sort}
          rowMarks={() => (
            <IssueMarks
              issue={{ id: row.id, revision: 1 }}
              placement='row'
              workingAgentName='Coder'
            />
          )}
        />
      </>,
      { wrapper: Wrapper },
    );
    const marks = screen.getAllByRole('status', {
      name: 'Coder is working on this issue',
    });
    expect(marks).toHaveLength(2);
    expect(marks[0]?.closest('[data-issue-marks]')).toHaveAttribute(
      'data-issue-marks',
      'card',
    );
    expect(marks[1]?.closest('[data-issue-marks]')).toHaveAttribute(
      'data-issue-marks',
      'row',
    );
    fireEvent.click(screen.getByRole('button', { name: 'PM-252 Agent work' }));
    fireEvent.click(marks[1]!);
    expect(select).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'ID' }));
    expect(sort).toHaveBeenCalledWith({
      column: 'identifier',
      direction: 'desc',
    });
  });
  it.each(['en-US', 'zh-CN'] as const)(
    'shows a passive, named work mark in %s',
    async (locale) => {
      const { Wrapper } = await setup(locale);
      mocks.request.mockResolvedValue({ data: [working()] });
      const { container } = render(<View issues={[issue()]} />, {
        wrapper: Wrapper,
      });
      await settle();
      expect(screen.getByRole('status')).toHaveTextContent(
        locale === 'en-US' ? 'Agent working' : 'Agent 工作中',
      );
      expect(screen.getByRole('status')).toHaveAttribute(
        'title',
        locale === 'en-US'
          ? 'a1 is working on this issue'
          : 'a1 正在处理这条议题',
      );
      expect(container.querySelector('svg')).toHaveClass(
        'motion-reduce:animate-none',
      );
      expect(container.querySelector('button, a')).toBeNull();
    },
  );

  it('polls while idle, shows start/end, hides a failed refresh and retries next interval', async () => {
    const { Wrapper } = await setup();
    render(<View issues={[issue()]} />, { wrapper: Wrapper });
    await settle();
    expect(screen.queryByRole('status')).toBeNull();
    mocks.request.mockResolvedValue({ data: [working()] });
    await advance(ISSUE_AGENT_WORK_POLL_MS);
    expect(screen.getByRole('status')).toBeInTheDocument();
    mocks.request.mockRejectedValue(new Error('Network unavailable'));
    await advance(ISSUE_AGENT_WORK_POLL_MS);
    expect(screen.queryByRole('status')).toBeNull();
    mocks.request.mockResolvedValue({ data: [working()] });
    await advance(ISSUE_AGENT_WORK_POLL_MS);
    expect(screen.getByRole('status')).toBeInTheDocument();
    mocks.request.mockResolvedValue({ data: [working('i1', 'a1', false)] });
    await advance(ISSUE_AGENT_WORK_POLL_MS);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('batches loaded pages and clears marks when executor or filter changes', async () => {
    const { Wrapper } = await setup();
    mocks.request.mockResolvedValue({ data: [working()] });
    const view = render(<View issues={[issue()]} />, { wrapper: Wrapper });
    await settle();
    expect(screen.getByRole('status')).toBeInTheDocument();
    const issues = Array.from({ length: 205 }, (_, index) =>
      issue(`i${index}`),
    );
    mocks.request.mockClear();
    view.rerender(<View issues={issues} />);
    await settle();
    expect(mocks.request).toHaveBeenCalledTimes(3);
    expect(
      mocks.request.mock.calls.map(([options]) => options.json.issueIds.length),
    ).toEqual([100, 100, 5]);
    mocks.request.mockImplementation(() => new Promise(() => {}));
    view.rerender(<View issues={[issue('i1', 'a2')]} />);
    expect(screen.queryByRole('status')).toBeNull();
    view.rerender(<View issues={[issue()]} scope='filtered' />);
    expect(screen.queryByRole('status')).toBeNull();
    const signal = mocks.request.mock.calls.at(-1)![0].signal as AbortSignal;
    view.unmount();
    expect(signal.aborted).toBe(true);
  });

  it('pauses in the background, refreshes on return, coalesces events and cleans up', async () => {
    const { Wrapper } = await setup();
    const view = render(<View issues={[issue()]} />, { wrapper: Wrapper });
    await settle();
    const before = mocks.request.mock.calls.length;
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await advance(30_000);
    expect(mocks.request).toHaveBeenCalledTimes(before);
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await advance(301);
    expect(mocks.request.mock.calls.length).toBeGreaterThan(before);
    mocks.request.mockClear();
    await act(async () => {
      for (const callback of mocks.callbacks) callback();
    });
    await advance(301);
    expect(mocks.request).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(mocks.stop).toHaveBeenCalledTimes(3);
    mocks.request.mockClear();
    await advance(30_000);
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
