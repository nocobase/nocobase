import type { InboxItem } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InboxPage } from '../../registry/inbox/inbox/inbox-page';
import type { InboxSource } from '../../registry/inbox/inbox/source';
import { item, notice } from './fixtures';
import { Frame } from './frame';

const plugin = vi.hoisted(() => ({
  items: [] as InboxItem[],
  mark: vi.fn(),
  readAll: vi.fn(),
  refresh: vi.fn(),
  toast: vi.fn(),
}));

// The plugin's hooks, answering from memory: what the page does with them is under test, not the plugin.
vi.mock('@nocobase/app-plugin-notification-in-app/client/inbox', () => ({
  inboxKeys: { all: ['notificationInApp', 'inbox'] },
  useInboxItems: () => ({
    data: { pages: [{ data: plugin.items }], pageParams: [undefined] },
    isFetching: false,
    isError: false,
    error: null,
    isFetchingNextPage: false,
    hasNextPage: false,
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
  }),
  useInboxUnreadCount: () => ({
    data: plugin.items.filter((entry) => !entry.readAt).length,
  }),
  useInboxActions: () => ({
    mark: plugin.mark,
    readAll: plugin.readAll,
    pending: false,
  }),
  useInboxRefresh: plugin.refresh,
}));

vi.mock('@nocobase/app-client', () => ({
  ApiClientError: class extends Error {},
  useApiClient: () => ({}),
  useToaster: () => ({ show: plugin.toast, close: vi.fn() }),
}));

beforeEach(() => {
  plugin.mark.mockReset().mockResolvedValue(undefined);
  plugin.readAll.mockReset().mockResolvedValue(0);
  plugin.refresh.mockReset();
  plugin.toast.mockReset();
  plugin.items = [item('a'), item('b', { readAt: '2026-10-01T09:00:00.000Z' })];
});

describe('the inbox page', () => {
  it("lists the plugin's messages as notifications without a source, and marks one read when selected", async () => {
    render(
      <Frame>
        <InboxPage />
      </Frame>,
    );
    expect(
      await screen.findByRole('heading', { name: /Notifications/u }),
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

  it('adds what a source knows: decisions first, counted on To do, refreshed by its topics', async () => {
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
      await screen.findByRole('heading', { name: /Needs my decision/u }),
    ).toHaveTextContent('3');
    expect(screen.getByLabelText('3 waiting')).toBeInTheDocument();
    expect(plugin.refresh).toHaveBeenCalledWith(['test:inbox']);
    await waitFor(() => expect(onPendingChange).toHaveBeenLastCalledWith(3));
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
