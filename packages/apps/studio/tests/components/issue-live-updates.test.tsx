import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { api, pmApi, threadRequest } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  pmApi: { issue: vi.fn() },
  threadRequest: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  usePmApi: () => pmApi,
}));

const { useLiveIssue, IDLE_POLL_MS, WAKE_POLL_MS, WAKE_WINDOW_MS } =
  await import('../../client/pages/issues/detail/use-live-issue.js');
const { useIssueRuns } = await import('../../client/agents/use-issue-runs.js');
const { wakeIssue } = await import('../../client/issues/live/wake.js');
const { useIssueTimeline } =
  await import('@nocobase/app-plugin-projects/client/issues');

let sequence = 0;
let detail: IssueDetail;
let serverRuns: Run[];
let client: QueryClient;
let olderThreads: IssueDetail['threads'];

function comment(id: string): IssueDetail['threads'][number]['root'] {
  return {
    id,
    issueId: detail.id,
    authorType: 'agent',
    authorId: 'a1',
    authorName: 'Agent',
    kind: 'comment',
    content: id,
    note: false,
    parentId: null,
    rootId: id,
    via: null,
    createdAt: '2026-10-09T00:00:00Z',
    editedAt: null,
    deleted: false,
    reactions: [],
    resolvedAt: null,
    resolvedById: null,
    resolvedByName: null,
    attachments: [],
  };
}

function issue(id: string): IssueDetail {
  return {
    id,
    number: 100,
    identifier: `PM-${id}`,
    title: 'Live issue',
    description: '',
    statusKey: 'todo',
    priority: 'medium',
    ownerUserId: 'u1',
    executor: null,
    parentIssueId: null,
    stage: null,
    projectId: null,
    startDate: null,
    dueDate: null,
    revision: 1,
    createdById: 'u1',
    createdAt: '2026-10-09T00:00:00Z',
    updatedAt: '2026-10-09T00:00:00Z',
    lastActivityAt: '2026-10-09T00:00:00Z',
    deletedAt: null,
    owner: null,
    executorName: null,
    project: null,
    labels: [],
    subtaskCount: 0,
    blockedCount: 0,
    parent: null,
    statuses: [],
    activities: [],
    activitiesNextCursor: null,
    threads: [],
    threadsNextCursor: null,
    subscribers: [],
    attachments: [],
    checklist: null,
    pendingApproval: null,
    recentApprovals: [],
    subtasks: [],
    blockedBy: [],
    blocks: [],
    relatedTo: [],
    blockers: [],
    hiddenBlockerCount: 0,
  };
}

function run(status: Run['status'] = 'running'): Run {
  return {
    id: `r-${detail.id}`,
    agentId: 'a1',
    agentType: 'runner',
    runnerId: null,
    tool: null,
    modelService: null,
    model: null,
    effort: null,
    status,
    priority: 0,
    attempt: 1,
    maxAttempts: 1,
    retryOfRunId: null,
    parentRunId: null,
    subject: { kind: 'issue', id: detail.id },
    threadScope: 'issue',
    actorUserId: 'u1',
    ownerUserId: 'u1',
    requires: [],
    acceptsInput: true,
    availableAt: null,
    leaseExpiresAt: null,
    dispatchedAt: null,
    startedAt: null,
    finishedAt: null,
    lastActivityAt: null,
    cancelRequestedAt: null,
    failureReason: null,
    failureDetail: null,
    summary: null,
    createdAt: '2026-10-09T00:00:00Z',
    updatedAt: '2026-10-09T00:00:00Z',
  };
}

function Harness({ initial }: { readonly initial: IssueDetail }) {
  const key = ['pm', 'issue', initial.identifier] as const;
  const query = useQuery({
    queryKey: key,
    queryFn: () => pmApi.issue(initial.identifier) as Promise<IssueDetail>,
  });
  const shown = query.data ?? initial;
  const runs = useLiveIssue(shown, initial.identifier, key);
  const siblingRuns = useIssueRuns(shown);
  const timeline = useIssueTimeline(shown, runs);
  return (
    <>
      <output aria-label='Activity runs'>
        {runs.map((item) => item.status).join(',')}
      </output>
      <output aria-label='Run panel'>
        {siblingRuns.map((item) => item.status).join(',')}
      </output>
      <output aria-label='Issue status'>{shown.statusKey}</output>
      {timeline.entries
        .filter((entry) => entry.kind === 'thread')
        .map(({ thread }) => (
          <div key={thread.root.id}>
            <p>{thread.root.content}</p>
            {thread.replies.map((reply) => (
              <p key={reply.id}>{reply.content}</p>
            ))}
          </div>
        ))}
      {timeline.hasOlder ? (
        <button onClick={timeline.loadOlder}>Load older</button>
      ) : null}
    </>
  );
}

async function flush(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
  await flush();
}

async function show() {
  const view = render(
    <QueryClientProvider client={client}>
      <Harness initial={detail} />
    </QueryClientProvider>,
  );
  await flush();
  await flush();
  return view;
}

async function invalidate(issueId = detail.identifier): Promise<void> {
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['pm', 'issue', issueId] });
  });
  await flush();
}

/** The viewer did something here that starts an agent's work, such as handing the issue over. */
async function startWork(): Promise<void> {
  await act(async () => {
    wakeIssue(detail.id);
  });
  await flush();
}

function delayRunResponses(ms: number): void {
  api.request.mockImplementation(() => {
    const data = [...serverRuns];
    return new Promise((resolve) => {
      setTimeout(() => resolve({ data, meta: {} }), ms);
    });
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  detail = issue(String(++sequence));
  serverRuns = [];
  olderThreads = [];
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  client.setQueryData(['pm', 'issue', detail.identifier], detail);
  threadRequest
    .mockReset()
    .mockImplementation(async () => ({ data: olderThreads, meta: {} }));
  api.request
    .mockReset()
    .mockImplementation(async ({ path }: { path: string }) => {
      if (path.endsWith('/comments')) return threadRequest();
      return { data: serverRuns, meta: {} };
    });
  pmApi.issue.mockReset().mockImplementation(async () => detail);
});

afterEach(() => {
  cleanup();
  client.clear();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('live issue updates with the real subject run cache', () => {
  it('discovers work immediately after the viewer starts work here, without an issue edit', async () => {
    await show();
    expect(screen.getByLabelText('Activity runs')).toBeEmptyDOMElement();
    serverRuns = [run()];
    await startWork();
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
    expect(screen.getByLabelText('Run panel')).toHaveTextContent('running');
    expect(api.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        path: 'agents/runs',
        query: { subjectKind: 'issue', subjectId: detail.id },
      }),
    );
    expect(detail.revision).toBe(1);
  });

  it('finds delayed wakeups during the short polling window', async () => {
    await show();
    await startWork();
    await advance(1000);
    serverRuns = [run()];
    await advance(WAKE_POLL_MS);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
  });

  it('returns to idle polling after the wake window when no agent wakes', async () => {
    await show();
    await startWork();
    await advance(WAKE_WINDOW_MS);
    const calls = api.request.mock.calls.length;
    await advance(WAKE_POLL_MS);
    expect(api.request).toHaveBeenCalledTimes(calls);
    serverRuns = [run()];
    await advance(IDLE_POLL_MS);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
  });

  it('discovers externally triggered work from an idle page, without an issue edit', async () => {
    await show();
    expect(IDLE_POLL_MS).toBe(60_000);
    const runReads = () =>
      api.request.mock.calls.filter(
        ([request]) => request.path === 'agents/runs',
      ).length;
    const calls = runReads();
    serverRuns = [run()];
    await advance(59_000);
    expect(runReads()).toBe(calls);
    expect(screen.getByLabelText('Activity runs')).not.toHaveTextContent(
      'running',
    );
    await advance(1000);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
    expect(detail.revision).toBe(1);
  });

  it('shares a slow idle refresh until externally triggered work becomes visible', async () => {
    await show();
    api.request.mockClear();
    delayRunResponses(IDLE_POLL_MS + 1000);
    serverRuns = [run()];
    await advance(IDLE_POLL_MS);
    await advance(IDLE_POLL_MS);
    await advance(1000);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
    expect(screen.getByLabelText('Run panel')).toHaveTextContent('running');
    expect(api.request).toHaveBeenCalledTimes(1);
  });

  it('lets a slow wakeup response finish during accelerated polling', async () => {
    await show();
    api.request.mockClear();
    delayRunResponses(6500);
    serverRuns = [run()];
    await startWork();
    await advance(2000);
    await advance(2000);
    await advance(2000);
    expect(screen.getByLabelText('Activity runs')).toBeEmptyDOMElement();
    expect(api.request).toHaveBeenCalledTimes(1);
    await advance(500);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
    expect(screen.getByLabelText('Run panel')).toHaveTextContent('running');
    expect(api.request).toHaveBeenCalledTimes(1);
  });

  it('shows a completed run and its result when run responses exceed the polling interval', async () => {
    serverRuns = [run()];
    await show();
    delayRunResponses(6000);
    serverRuns = [run('completed')];
    detail = {
      ...detail,
      statusKey: 'in_review',
      threads: [
        {
          root: { ...comment('slow-result'), content: 'Slow run finished' },
          replies: [],
        },
      ],
    };
    await advance(5000);
    await advance(5000);
    await advance(1000);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent(
      'completed',
    );
    expect(screen.getByLabelText('Run panel')).toHaveTextContent('completed');
    expect(screen.getByText('Slow run finished')).toBeTruthy();
    expect(screen.getByLabelText('Issue status')).toHaveTextContent(
      'in_review',
    );
  });

  it('keeps discovering work when a wakeup reuses an older empty response', async () => {
    await show();
    api.request.mockClear();
    const delay = WAKE_POLL_MS * 2 + 500;
    delayRunResponses(delay);
    await advance(IDLE_POLL_MS);
    serverRuns = [run()];
    await startWork();
    // The request already in flight captured the empty list before the comment woke work.
    await advance(WAKE_POLL_MS);
    await advance(WAKE_POLL_MS);
    await advance(delay - WAKE_POLL_MS * 2);
    expect(screen.getByLabelText('Activity runs')).toBeEmptyDOMElement();
    expect(api.request).toHaveBeenCalledTimes(1);
    for (let tick = 0; tick < 5; tick++) await advance(WAKE_POLL_MS);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
    expect(screen.getByLabelText('Run panel')).toHaveTextContent('running');
  });

  it('refreshes loaded older threads without realtime, including after a run has ended', async () => {
    detail = {
      ...detail,
      threads: Array.from({ length: 30 }, (_, index) => ({
        root: comment(`recent-${index}`),
        replies: [],
      })),
      threadsNextCursor: 'older-cursor',
    };
    client.setQueryData(['pm', 'issue', detail.identifier], detail);
    olderThreads = [{ root: comment('old root'), replies: [] }];
    const view = await show();
    await advance(5000);
    // Polling must not request pages the reader has not loaded.
    expect(threadRequest).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Load older' }));
    await flush();
    expect(screen.getByText('old root')).toBeTruthy();
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `projects/issues/${detail.id}/comments`,
        query: { pageSize: 30, pageToken: 'older-cursor' },
      }),
    );

    serverRuns = [run()];
    await startWork();
    const addReply = (content: string) => {
      olderThreads = [
        {
          root: comment('old root'),
          replies: [
            ...olderThreads[0]!.replies,
            { ...comment(content), parentId: 'old root', rootId: 'old root' },
          ],
        },
      ];
    };
    addReply('Agent finished in the older thread');
    serverRuns = [run('completed')];
    await advance(2000);
    expect(screen.getByText('Agent finished in the older thread')).toBeTruthy();
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent(
      'completed',
    );

    // A later external reply cannot rely on another run transition or a changed root cursor.
    addReply('A later reply');
    await advance(5000);
    expect(screen.getByText('A later reply')).toBeTruthy();
    expect(detail.threadsNextCursor).toBe('older-cursor');
    const calls = threadRequest.mock.calls.length;
    view.unmount();
    await advance(10_000);
    expect(threadRequest).toHaveBeenCalledTimes(calls);
  });

  it('preserves slow older-thread requests and pauses them in a hidden tab', async () => {
    detail = {
      ...detail,
      threads: Array.from({ length: 30 }, (_, index) => ({
        root: comment(`recent-${index}`),
        replies: [],
      })),
      threadsNextCursor: 'older-cursor',
    };
    client.setQueryData(['pm', 'issue', detail.identifier], detail);
    olderThreads = [{ root: comment('old root'), replies: [] }];
    await show();
    fireEvent.click(screen.getByRole('button', { name: 'Load older' }));
    await flush();
    threadRequest.mockClear();
    threadRequest.mockImplementation(() => {
      const data = olderThreads;
      return new Promise((resolve) =>
        setTimeout(() => resolve({ data, meta: {} }), IDLE_POLL_MS + 1000),
      );
    });
    olderThreads = [
      {
        root: comment('old root'),
        replies: [
          {
            ...comment('Slow reply'),
            parentId: 'old root',
            rootId: 'old root',
          },
        ],
      },
    ];
    await advance(IDLE_POLL_MS);
    await advance(IDLE_POLL_MS);
    expect(threadRequest).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Slow reply')).toBeNull();
    await advance(1000);
    expect(screen.getByText('Slow reply')).toBeTruthy();

    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    visibility.mockReturnValue('hidden');
    await advance(IDLE_POLL_MS * 2);
    expect(threadRequest).toHaveBeenCalledTimes(1);
    visibility.mockReturnValue('visible');
    await advance(IDLE_POLL_MS);
    expect(threadRequest).toHaveBeenCalledTimes(2);
    visibility.mockRestore();
  });

  it('bounds idle requests to one detail and run refresh every idle interval', async () => {
    await show();
    api.request.mockClear();
    pmApi.issue.mockClear();
    await advance(IDLE_POLL_MS * 3);
    expect(api.request).toHaveBeenCalledTimes(3);
    expect(pmApi.issue).toHaveBeenCalledTimes(3);
  });

  it('stops refreshing the previous issue when the page switches issues', async () => {
    const view = await show();
    const previous = detail;
    await invalidate();
    detail = issue(String(++sequence));
    client.setQueryData(['pm', 'issue', detail.identifier], detail);
    view.rerender(
      <QueryClientProvider client={client}>
        <Harness key={detail.id} initial={detail} />
      </QueryClientProvider>,
    );
    await flush();
    await flush();
    api.request.mockClear();
    pmApi.issue.mockClear();
    await invalidate(previous.identifier);
    await advance(2000);
    expect(api.request).not.toHaveBeenCalled();
    await advance(IDLE_POLL_MS - 2000);
    expect(api.request).toHaveBeenCalledTimes(1);
    expect(api.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: { subjectKind: 'issue', subjectId: detail.id },
      }),
    );
    expect(pmApi.issue).toHaveBeenCalledTimes(1);
    expect(pmApi.issue).toHaveBeenLastCalledWith(detail.identifier);
  });

  it('refreshes the agent result and issue status automatically when a run finishes', async () => {
    serverRuns = [run()];
    await show();
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
    detail = {
      ...detail,
      statusKey: 'in_review',
      threads: [
        {
          root: { ...comment('c1'), content: 'Agent finished' },
          replies: [],
        },
      ],
    };
    serverRuns = [run('completed')];
    await advance(5000);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent(
      'completed',
    );
    expect(screen.getByText('Agent finished')).toBeTruthy();
    expect(screen.getByLabelText('Issue status')).toHaveTextContent(
      'in_review',
    );
  });

  it('keeps refreshing issue details after all runs finish', async () => {
    serverRuns = [run('completed')];
    await show();
    detail = { ...detail, statusKey: 'done' };
    await advance(IDLE_POLL_MS);
    expect(screen.getByLabelText('Issue status')).toHaveTextContent('done');
  });

  it('does not speed up for an announcement, only for work the viewer starts here', async () => {
    await show();
    api.request.mockClear();
    // An announcement reads the detail again: no fast polling of runs follows.
    await invalidate();
    const afterAnnouncement = api.request.mock.calls.length;
    await advance(WAKE_POLL_MS * 3);
    expect(api.request).toHaveBeenCalledTimes(afterAnnouncement);
    // A comment the viewer just wrote, put into the detail by the page itself, wakes it.
    await act(async () => {
      client.setQueryData<IssueDetail>(['pm', 'issue', detail.identifier], {
        ...detail,
        threads: [{ root: comment('mine'), replies: [] }],
      });
    });
    await flush();
    const woken = api.request.mock.calls.length;
    expect(woken).toBeGreaterThan(afterAnnouncement);
    await advance(WAKE_POLL_MS);
    expect(api.request.mock.calls.length).toBeGreaterThan(woken);
  });

  it('ignores invalidations for another issue and stops polling after leaving the page', async () => {
    const view = await show();
    client.setQueryData(['pm', 'issue', 'other'], issue('other'));
    const calls = api.request.mock.calls.length;
    await invalidate('other');
    await advance(2000);
    expect(api.request).toHaveBeenCalledTimes(calls);
    view.unmount();
    await advance(30_000);
    expect(api.request).toHaveBeenCalledTimes(calls);
  });

  it('pauses fallback requests in a hidden tab and discovers work after it becomes visible', async () => {
    await show();
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    visibility.mockReturnValue('hidden');
    const calls = api.request.mock.calls.length;
    const detailCalls = pmApi.issue.mock.calls.length;
    serverRuns = [run()];
    await advance(IDLE_POLL_MS);
    expect(api.request).toHaveBeenCalledTimes(calls);
    expect(pmApi.issue).toHaveBeenCalledTimes(detailCalls);
    visibility.mockReturnValue('visible');
    await advance(IDLE_POLL_MS);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
    visibility.mockRestore();
  });

  it('refreshes shared runs once when activity changes with multiple observers', async () => {
    await show();
    api.request.mockClear();
    detail = { ...detail, lastActivityAt: '2026-10-09T00:01:00Z' };
    await act(async () => {
      client.setQueryData(['pm', 'issue', detail.identifier], detail);
    });
    await flush();
    expect(api.request).toHaveBeenCalledTimes(1);
  });
});
