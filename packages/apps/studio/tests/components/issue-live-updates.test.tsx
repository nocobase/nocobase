import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { api, pmApi } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  pmApi: { issue: vi.fn() },
}));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  usePmApi: () => pmApi,
}));

const { useLiveIssue } =
  await import('../../client/pages/issues/detail/use-live-issue.js');
const { useIssueRuns } = await import('../../client/agents/use-issue-runs.js');

let sequence = 0;
let detail: IssueDetail;
let serverRuns: Run[];
let client: QueryClient;

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
  return (
    <>
      <output aria-label='Activity runs'>
        {runs.map((item) => item.status).join(',')}
      </output>
      <output aria-label='Run panel'>
        {siblingRuns.map((item) => item.status).join(',')}
      </output>
      <output aria-label='Issue status'>{shown.statusKey}</output>
      {shown.threads.map((thread) => (
        <p key={thread.root.id}>{thread.root.content}</p>
      ))}
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

beforeEach(() => {
  vi.useFakeTimers();
  detail = issue(String(++sequence));
  serverRuns = [];
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  client.setQueryData(['pm', 'issue', detail.identifier], detail);
  api.request
    .mockReset()
    .mockImplementation(async () => ({ data: serverRuns, meta: {} }));
  pmApi.issue.mockReset().mockImplementation(async () => detail);
});

afterEach(() => {
  cleanup();
  client.clear();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('live issue updates with the real subject run cache', () => {
  it('discovers work immediately after an action invalidates detail without changing revision', async () => {
    await show();
    expect(screen.getByLabelText('Activity runs')).toBeEmptyDOMElement();
    serverRuns = [run()];
    await invalidate();
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
    await invalidate();
    await advance(1000);
    serverRuns = [run()];
    await advance(1000);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
  });

  it('returns to idle polling after 30 seconds when no agent wakes', async () => {
    await show();
    await invalidate();
    await advance(30_000);
    const calls = api.request.mock.calls.length;
    await advance(2000);
    expect(api.request).toHaveBeenCalledTimes(calls);
    serverRuns = [run()];
    await advance(3000);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
  });

  it('discovers externally triggered work from an idle page, without an issue edit', async () => {
    await show();
    serverRuns = [run()];
    await advance(5000);
    expect(screen.getByLabelText('Activity runs')).toHaveTextContent('running');
    expect(detail.revision).toBe(1);
  });

  it('bounds idle requests to one detail and run refresh every five seconds', async () => {
    await show();
    api.request.mockClear();
    pmApi.issue.mockClear();
    await advance(60_000);
    expect(api.request).toHaveBeenCalledTimes(12);
    expect(pmApi.issue).toHaveBeenCalledTimes(12);
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
    await advance(3000);
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
          root: {
            id: 'c1',
            content: 'Agent finished',
            parentId: null,
            rootId: 'c1',
          } as IssueDetail['threads'][number]['root'],
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
    await advance(5000);
    expect(screen.getByLabelText('Issue status')).toHaveTextContent('done');
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
    await advance(5000);
    expect(api.request).toHaveBeenCalledTimes(calls);
    expect(pmApi.issue).toHaveBeenCalledTimes(detailCalls);
    visibility.mockReturnValue('visible');
    await advance(5000);
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
