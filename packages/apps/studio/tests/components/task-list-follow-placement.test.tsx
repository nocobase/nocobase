import { renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';

import { listScope, taskGroupKeys } from '../../client/issues/groups/api.js';
import { useTaskList } from '../../client/issues/groups/use-task-list.js';
import enUS from '../../client/locales/en-US.js';
import packageMetadata from '../../package.json' with { type: 'json' };
import type {
  TaskGroupId,
  TaskGroupItem,
  TaskGroups,
} from '../../shared/task-groups.js';

vi.mock('../../client/issues/use-agent-work.js', () => ({
  useIssueAgentWork: () => new Map<string, string>(),
}));

const FILTERS = { involvesUserId: 'alice' };
const KEY = [...taskGroupKeys.lists, listScope(FILTERS, 'split', 'all'), {}];
const clients: QueryClient[] = [];
afterEach(() => {
  for (const client of clients.splice(0)) client.clear();
});

function item(followed: boolean, statusKey = 'backlog'): TaskGroupItem {
  return {
    issue: {
      id: 'task',
      number: 358,
      identifier: 'PM-358',
      title: 'Keep selection',
      description: '',
      statusKey,
      needsYou: null,
      next: null,
      priority: 'medium',
      ownerUserId: 'alice',
      executor: null,
      parentIssueId: null,
      stage: null,
      projectId: null,
      startDate: null,
      dueDate: null,
      revision: 1,
      createdById: null,
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
      lastActivityAt: '2026-10-15T00:00:00Z',
      deletedAt: null,
      owner: null,
      executorName: null,
      project: null,
      labels: [],
      subtaskCount: 0,
      blockedCount: 0,
    },
    parent: null,
    waits: [],
    waitingSince: null,
    followed,
    unread: 0,
    progress: { finished: 0, total: 0 },
    hasChildren: false,
    context: false,
    expand: [],
  };
}

function groups(
  followed: boolean,
  group: TaskGroupId = followed ? 'follow' : 'backlog',
): TaskGroups {
  const page = {
    group,
    count: 1,
    data: [item(followed, group === 'doing' ? 'in_progress' : 'backlog')],
    nextCursor: null,
  };
  return {
    generation: `generation-${group}-${followed}`,
    membership: `membership-${group}-${followed}`,
    mode: 'split',
    following: followed ? ['task'] : [],
    waiting: 0,
    groups:
      group === 'follow'
        ? [page]
        : [{ group: 'follow', count: 0, data: [], nextCursor: null }, page],
  };
}

function View() {
  const [params, setParams] = useSearchParams();
  const list = useTaskList({
    filters: FILTERS,
    follow: 'all',
    pageKey: 'follow-placement',
    selectedParam: params.get('issue'),
    autoSelect: false,
    onSelect: (id) => setParams(id ? { issue: id } : {}),
  });
  return (
    <>
      <output data-testid='url'>{params.toString()}</output>
      <output data-testid='selected'>{list.selectedId ?? 'none'}</output>
      <output data-testid='placement'>
        {list.groups.find((group) =>
          group.items.some((row) => row.issue.id === list.selectedId),
        )?.group ?? 'none'}
      </output>
      <output data-testid='raw-placement'>
        {list.data?.groups.find((group) =>
          group.data.some((row) => row.issue.id === 'task'),
        )?.group ?? 'none'}
      </output>
      <output data-testid='followed'>{String(list.selected?.followed)}</output>
      <output data-testid='following'>{list.data?.following.join(',')}</output>
      <button
        type='button'
        onClick={() => list.selected && list.toggleFollow(list.selected)}
      >
        Toggle follow
      </button>
      <button type='button' onClick={() => setParams({})}>
        Clear URL
      </button>
      <button type='button' onClick={() => setParams({ issue: 'missing' })}>
        Missing task
      </button>
    </>
  );
}

async function setup(followed: boolean) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  clients.push(client);
  let served = groups(followed);
  client.setQueryData(KEY, served);
  let finish = (_response: Response) => {};
  const pending = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const fetch = vi.fn((request: Request) => {
    if (request.method === 'POST') return pending;
    if (new URL(request.url).pathname === '/api/taskGroups')
      return Promise.resolve(Response.json({ data: served }));
    throw new Error(`Unexpected request: ${request.method} ${request.url}`);
  });
  await renderWithApp(
    <QueryClientProvider client={client}>
      <View />
    </QueryClientProvider>,
    {
      route: '/my-issues?issue=PM-358',
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: { 'en-US': enUS } },
      fetch,
    },
  );
  return {
    client,
    fetch,
    confirm: (next: TaskGroups) => {
      served = next;
      finish(Response.json({ data: { issueIds: next.following } }));
    },
  };
}

it.each([false, true])(
  'keeps selection while toggling follow from %s before grouped rows catch up',
  async (followed) => {
    const page = await setup(followed);
    const originalGroup = followed ? 'follow' : 'backlog';
    const nextGroup = followed ? 'backlog' : 'follow';
    expect(screen.getByTestId('selected')).toHaveTextContent('task');
    expect(screen.getByTestId('placement')).toHaveTextContent(originalGroup);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle follow' }));
    await waitFor(() => {
      expect(page.fetch).toHaveBeenCalledOnce();
      expect(screen.getByTestId('following').textContent).toBe(
        followed ? '' : 'task',
      );
    });
    expect(page.fetch.mock.calls[0]![0].url).toContain(
      `/task/${followed ? 'unfollow' : 'follow'}`,
    );
    // The optimistic preference changes first; neither the cached row nor its group has caught up yet.
    expect(
      page.client
        .getQueryData<TaskGroups>(KEY)
        ?.groups.flatMap((group) => group.data)[0]?.followed,
    ).toBe(followed);
    expect(screen.getByTestId('followed')).toHaveTextContent(String(followed));
    expect(screen.getByTestId('placement')).toHaveTextContent(originalGroup);
    expect(screen.getByTestId('selected')).toHaveTextContent('task');
    expect(screen.getByTestId('url')).toHaveTextContent('issue=PM-358');

    await act(async () => page.confirm(groups(!followed)));
    await waitFor(() => {
      expect(screen.getByTestId('followed')).toHaveTextContent(
        String(!followed),
      );
      expect(screen.getByTestId('placement')).toHaveTextContent(nextGroup);
    });
    expect(screen.getByTestId('selected')).toHaveTextContent('task');
    expect(screen.getByTestId('url')).toHaveTextContent('issue=PM-358');

    // The confirmed follow preference becomes the new snapshot: a later status change stays in place.
    await act(async () => {
      page.client.setQueryData(KEY, groups(!followed, 'doing'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('raw-placement')).toHaveTextContent('doing');
      expect(screen.getByTestId('placement')).toHaveTextContent(nextGroup);
    });
    expect(screen.getByTestId('selected')).toHaveTextContent('task');
  },
);

it('releases a retained missing row when the URL selection is cleared or names another missing task', async () => {
  const page = await setup(false);
  await act(async () => {
    page.client.setQueryData<TaskGroups>(KEY, { ...groups(false), groups: [] });
  });
  await waitFor(() =>
    expect(screen.getByTestId('raw-placement')).toHaveTextContent('none'),
  );
  expect(screen.getByTestId('selected')).toHaveTextContent('task');
  fireEvent.click(screen.getByRole('button', { name: 'Clear URL' }));
  await waitFor(() =>
    expect(screen.getByTestId('selected')).toHaveTextContent('none'),
  );
  expect(screen.getByTestId('placement')).toHaveTextContent('none');
  expect(screen.getByTestId('url')).toBeEmptyDOMElement();
  fireEvent.click(screen.getByRole('button', { name: 'Missing task' }));
  await waitFor(() =>
    expect(screen.getByTestId('url')).toHaveTextContent('issue=missing'),
  );
  expect(screen.getByTestId('selected')).toHaveTextContent('none');
  expect(screen.getByTestId('placement')).toHaveTextContent('none');
});
