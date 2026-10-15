import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';
import { useTaskList } from '../../client/issues/groups/use-task-list.js';
import { taskGroupKeys } from '../../client/issues/groups/api.js';
import type { TaskGroupItem, TaskGroups } from '../../shared/task-groups.js';
import enUS from '../../client/locales/en-US.js';

const mocks = vi.hoisted(() => ({ request: vi.fn(), show: vi.fn() }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: mocks.request }),
  useToaster: () => ({ show: mocks.show }),
  useService: () => ({
    subscribe: () => () => undefined,
    onOpen: () => () => undefined,
  }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  usePmApi: () => ({}),
}));

const clients: QueryClient[] = [];
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.clearAllMocks();
});
const item = (followed: boolean): TaskGroupItem => ({
  issue: {
    id: 'selected',
    identifier: 'PM-1',
    revision: 1,
    statusKey: 'in_review',
    executor: null,
  } as IssueListItem,
  parent: null,
  waits: ['accept'],
  waitingSince: null,
  followed,
  unread: 0,
  progress: { finished: 0, total: 0 },
  hasChildren: false,
  context: false,
  expand: [],
});
function groups(followed: boolean): TaskGroups {
  return {
    generation: 'g1',
    membership: 'm1',
    mode: 'split',
    following: followed ? ['selected'] : [],
    waiting: 1,
    groups: [
      {
        group: 'follow',
        count: followed ? 1 : 0,
        data: followed ? [item(true)] : [],
        nextCursor: null,
      },
      {
        group: 'wait',
        count: followed ? 0 : 1,
        data: followed ? [] : [item(false)],
        nextCursor: null,
      },
    ],
  };
}

it.each([false, true])(
  'keeps the selected task when following changes from %s before the grouped rows catch up',
  async (followed) => {
    let served = groups(followed);
    let release!: () => void;
    const saved = new Promise<void>((resolve) => {
      release = resolve;
    });
    mocks.request.mockImplementation(async ({ path }: { path: string }) => {
      if (path === 'taskGroups') return { data: served };
      if (/\/(?:un)?follow$/u.test(path)) {
        await saved;
        served = groups(!followed);
        return { data: { issueIds: served.following } };
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    clients.push(client);
    const runtime = await createTestI18nRuntime({
      locale: 'en-US',
      application: { namespace: 'studio', resources: enUS },
    });
    const onSelect = vi.fn();
    const { result } = renderHook(
      () =>
        useTaskList({
          filters: {},
          follow: 'all',
          pageKey: 'follow-test',
          selectedParam: 'selected',
          onSelect,
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestI18nProvider runtime={runtime} namespace='studio'>
            <QueryClientProvider client={client}>
              {children}
            </QueryClientProvider>
          </TestI18nProvider>
        ),
      },
    );
    await waitFor(() => expect(result.current.selectedId).toBe('selected'));
    await act(async () => {
      result.current.toggleFollow(result.current.selected!);
    });
    await waitFor(() =>
      expect(
        client
          .getQueriesData<TaskGroups>({ queryKey: taskGroupKeys.lists })[0]![1]
          ?.following.includes('selected'),
      ).toBe(!followed),
    );
    // The optimistic preference changes before the server has replaced the grouped row.
    expect(result.current.selected?.followed).toBe(followed);
    expect(result.current.selectedId).toBe('selected');
    await act(async () => {
      release();
    });
    await waitFor(() =>
      expect(
        result.current.groups
          .find((group) => group.group === (!followed ? 'follow' : 'wait'))
          ?.items.map((row) => row.issue.id),
      ).toEqual(['selected']),
    );
    expect(result.current.selected?.followed).toBe(!followed);
    expect(result.current.selectedId).toBe('selected');
    expect(onSelect).not.toHaveBeenCalled();
  },
);
