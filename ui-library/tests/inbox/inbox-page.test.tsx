import type { InboxItem } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { StampIcon } from 'lucide-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InboxPage } from '../../registry/inbox/inbox/inbox-page';
import {
  defineInboxRenderer,
  type InboxEntryRenderer,
} from '../../registry/inbox/inbox/registry';
import type { InboxSource } from '../../registry/inbox/inbox/source';
import { item, notice } from './fixtures';
import { Frame } from './frame';

const plugin = vi.hoisted(() => ({
  items: [] as InboxItem[],
  filters: [] as unknown[],
  renderers: [] as unknown[],
  source: { id: 'notifications' } as unknown,
  mark: vi.fn(),
  readAll: vi.fn(),
  refresh: vi.fn(),
  toast: vi.fn(),
}));

// The plugin's hooks, answering from memory: what the page does with them is under test, not the plugin.
vi.mock('@nocobase/app-plugin-notification-in-app/client/inbox', () => ({
  inboxKeys: { all: ['notificationInApp', 'inbox'] },
  useInboxItems: (_pageSize: number, filters: unknown) => {
    plugin.filters.push(filters);
    return {
      data: { pages: [{ data: plugin.items }], pageParams: [undefined] },
      isFetching: false,
      isError: false,
      error: null,
      isFetchingNextPage: false,
      hasNextPage: false,
      refetch: vi.fn(),
      fetchNextPage: vi.fn(),
    };
  },
  useInboxUnreadCount: () => ({
    data: plugin.items.filter((entry) => !entry.readAt).length,
  }),
  useInboxUnreadByCategory: () => ({
    data: [{ category: 'projects', count: 1 }],
  }),
  useInboxReadiness: () => true,
  useInboxActions: () => ({
    mark: plugin.mark,
    readAll: plugin.readAll,
    pending: false,
  }),
  useInboxRefresh: plugin.refresh,
}));

// The plugin's client entry: its namespace, and what others registered into its two extension lists.
vi.mock('@nocobase/app-plugin-notification-in-app/client', () => ({
  IN_APP_NOTIFICATION_CLIENT_NAMESPACE:
    '@nocobase/app-plugin-notification-in-app',
  useInboxRenderers: () => plugin.renderers,
  useInboxSource: () => plugin.source,
}));

vi.mock('@nocobase/app-client', () => ({
  ApiClientError: class extends Error {},
  // The categories come from the notification plugin's kinds.
  useApiClient: () => ({
    request: () =>
      Promise.resolve({
        data: {
          channelTypes: ['in-app'],
          kinds: [{ category: 'Projects', categoryKey: 'projects' }],
        },
      }),
  }),
  useToaster: () => ({ show: plugin.toast, close: vi.fn() }),
}));

beforeEach(() => {
  plugin.mark.mockReset().mockResolvedValue(undefined);
  plugin.readAll.mockReset().mockResolvedValue(0);
  plugin.refresh.mockReset();
  plugin.toast.mockReset();
  plugin.filters = [];
  plugin.renderers = [];
  plugin.source = { id: 'notifications' };
  plugin.items = [
    item('a', { category: 'projects' }),
    item('b', { readAt: '2026-10-01T09:00:00.000Z' }),
  ];
});

describe('the inbox page', () => {
  it("lists the plugin's messages without a source, and marks one read when selected", async () => {
    render(
      <Frame>
        <InboxPage />
      </Frame>,
    );
    expect(
      await screen.findByRole('heading', { name: /Earlier/u }),
    ).toBeInTheDocument();
    // The first item is shown in the detail pane.
    expect(
      screen.getByRole('heading', { name: 'Title a' }),
    ).toBeInTheDocument();
    expect(plugin.refresh).toHaveBeenCalledWith(undefined);
    fireEvent.click(screen.getByText('Title b'));
    expect(
      await screen.findByRole('heading', { name: 'Title b', level: 2 }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Title a')[0]!);
    await waitFor(() => expect(plugin.mark).toHaveBeenCalledWith('a', 'read'));
  });

  it('keeps native items visible and retries a failed source query independently', async () => {
    const waiting = vi
      .fn()
      .mockRejectedValueOnce(new Error('Unavailable'))
      .mockResolvedValue([]);
    const notices = vi.fn().mockResolvedValue([]);
    render(
      <Frame>
        <InboxPage source={{ id: 'test', waiting, notices }} />
      </Frame>,
    );
    const status = await screen.findByRole('button', { name: 'Retry' });
    expect(screen.getAllByText('Title a').length).toBeGreaterThan(1);
    fireEvent.click(status);
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Retry' }),
      ).not.toBeInTheDocument(),
    );
    expect(waiting).toHaveBeenCalledTimes(2);
    expect(notices).toHaveBeenCalledTimes(1);
  });

  it('asks the server for one category or the unread items as the rail chooses', async () => {
    render(
      <Frame>
        <InboxPage />
      </Frame>,
    );
    const rail = await screen.findByTestId('nocobase-inbox-rail');
    fireEvent.click(
      await within(rail).findByRole('button', { name: /Projects/u }),
    );
    await waitFor(() =>
      expect(plugin.filters.at(-1)).toMatchObject({ category: 'projects' }),
    );
    fireEvent.click(within(rail).getByRole('button', { name: /Unread/u }));
    await waitFor(() =>
      expect(plugin.filters.at(-1)).toEqual({ unreadOnly: true }),
    );
  });

  it('adds what a source knows: decisions first, counted on Pending, refreshed by its topics', async () => {
    const source: InboxSource = {
      id: 'test',
      notices: (ids) =>
        Promise.resolve(
          ids.includes('n-b') ? [notice('b', { subject: null })] : [],
        ),
      waiting: () => Promise.resolve([]),
      pending: () => Promise.resolve({ decision: 3 }),
      refreshTopics: ['test:inbox'],
    };
    const onPendingChange = vi.fn();
    render(
      <Frame>
        <InboxPage source={source} onPendingChange={onPendingChange} />
      </Frame>,
    );
    expect(
      await screen.findByRole('heading', { name: /Pending/u }),
    ).toHaveTextContent('3');
    expect(screen.getByLabelText('3 waiting')).toBeInTheDocument();
    expect(plugin.refresh).toHaveBeenCalledWith(['test:inbox']);
    await waitFor(() => expect(onPendingChange).toHaveBeenLastCalledWith(3));
  });

  it('uses the sources and renderers registered with the plugin when none is passed', async () => {
    plugin.source = {
      id: 'registered',
      pending: () => Promise.resolve({ decision: 2 }),
    } satisfies InboxSource;
    plugin.renderers = [
      defineInboxRenderer<null>({
        kinds: ['approval.requested'],
        icon: () => StampIcon,
        // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- the renderer's hook, which needs no other hook here
        useWording: () => ({
          label: () => 'Approval',
          text: () => ({ title: 'Approve the budget', sentence: '' }),
        }),
      }) as InboxEntryRenderer<never>,
    ];
    plugin.items = [item('a', { kind: 'approval.requested' })];
    render(
      <Frame>
        <InboxPage />
      </Frame>,
    );
    expect(await screen.findByLabelText('2 waiting')).toBeInTheDocument();
    expect(
      (await screen.findAllByText('Approve the budget')).length,
    ).toBeGreaterThan(0);
  });

  it('deletes an item through the plugin and says so', async () => {
    render(
      <Frame>
        <InboxPage />
      </Frame>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(plugin.mark).toHaveBeenCalledWith('a', 'delete'),
    );
    await waitFor(() =>
      expect(plugin.toast).toHaveBeenCalledWith({
        type: 'success',
        title: 'Deleted.',
      }),
    );
  });

  it('marks everything read at once in All', async () => {
    render(
      <Frame>
        <InboxPage />
      </Frame>,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Mark all as read' }),
    );
    await waitFor(() => expect(plugin.readAll).toHaveBeenCalled());
  });
});
