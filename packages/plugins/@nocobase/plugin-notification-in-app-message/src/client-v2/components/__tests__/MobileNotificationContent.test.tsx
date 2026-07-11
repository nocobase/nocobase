/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  navigate: vi.fn(),
  back: vi.fn(),
  close: vi.fn(),
  flowUserId: 1 as number | string | null,
  channelStatusFilterObs: { value: 'all' },
  selectedChannelNameObs: { value: null as string | null },
  channelListObs: {
    value: [
      {
        name: 'approval',
        title: 'Approval',
        userId: '1',
        unreadMsgCnt: 3,
        totalMsgCnt: 4,
        latestMsgReceiveTimestamp: Date.now(),
        latestMsgTitle: 'Latest approval',
      },
    ],
  },
  selectedMessageListObs: {
    value: [
      {
        id: 'message-1',
        title: 'Pending approval',
        userId: '1',
        channelName: 'approval',
        content: 'Please approve this request',
        receiveTimestamp: Date.now(),
        status: 'unread' as const,
        url: '',
        options: { mobileUrl: '/m/tasks/1' },
      },
    ],
  },
  showChannelLoadingMoreObs: { value: false },
  showMsgLoadingMoreObs: { value: false },
  isFetchingChannelsObs: { value: false },
  isFetchingMessageObs: { value: false },
  userIdObs: { value: null as number | null },
  fetchChannels: vi.fn(),
  fetchMessages: vi.fn(),
  updateMessage: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => holder.navigate,
  };
});

vi.mock('@nocobase/flow-engine', () => ({
  observer: (component: unknown) => component,
  useFlowContext: () => ({
    app: {
      router: {
        basename: '/admin',
      },
    },
    user: {
      id: holder.flowUserId,
    },
    view: {
      close: holder.close,
      navigation: {
        back: holder.back,
      },
    },
  }),
}));

vi.mock('../../locale', () => ({
  useInAppMessageTranslation: () => ({
    t: (key: string) => key,
  }),
  useT: () => (key: string) => key,
}));

vi.mock('../../state', () => ({
  channelListObs: holder.channelListObs,
  channelStatusFilterObs: holder.channelStatusFilterObs,
  fetchChannels: holder.fetchChannels,
  fetchMessages: holder.fetchMessages,
  isFetchingChannelsObs: holder.isFetchingChannelsObs,
  isFetchingMessageObs: holder.isFetchingMessageObs,
  selectedChannelNameObs: holder.selectedChannelNameObs,
  selectedMessageListObs: holder.selectedMessageListObs,
  showChannelLoadingMoreObs: holder.showChannelLoadingMoreObs,
  showMsgLoadingMoreObs: holder.showMsgLoadingMoreObs,
  updateMessage: holder.updateMessage,
  userIdObs: holder.userIdObs,
}));

import { MobileNotificationContent } from '../MobileNotificationContent';

describe('MobileNotificationContent', () => {
  beforeEach(() => {
    holder.navigate.mockClear();
    holder.back.mockClear();
    holder.close.mockClear();
    holder.flowUserId = 1;
    holder.channelStatusFilterObs.value = 'all';
    holder.selectedChannelNameObs.value = null;
    holder.userIdObs.value = null;
    holder.fetchChannels.mockReset();
    holder.fetchChannels.mockResolvedValue(undefined);
    holder.fetchMessages.mockReset();
    holder.fetchMessages.mockResolvedValue(undefined);
    holder.updateMessage.mockReset();
    holder.updateMessage.mockResolvedValue(undefined);
    holder.selectedMessageListObs.value[0].options = { mobileUrl: '/m/tasks/1' };
    holder.showChannelLoadingMoreObs.value = false;
    holder.showMsgLoadingMoreObs.value = false;
  });

  it('uses the flow context user when the embedded view is outside CurrentUserContext', async () => {
    render(<MobileNotificationContent />);

    await waitFor(() => expect(holder.userIdObs.value).toBe(1));
  });

  it('does not treat a missing flow context user as user zero', async () => {
    holder.flowUserId = null;

    render(<MobileNotificationContent />);

    await waitFor(() => expect(holder.userIdObs.value).toBeNull());
  });

  it('renders the mobile channel list and refreshes channels when switching status tabs', async () => {
    render(<MobileNotificationContent />);

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Notification' })).toBeInTheDocument();
    expect(screen.getByRole('tabpanel', { name: 'All' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: 'Approval, Unread: 3' })).toBeInTheDocument();
    expect(screen.getByText('Approval')).toBeInTheDocument();
    expect(screen.getByText('Latest approval')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Unread' }));

    expect(holder.channelStatusFilterObs.value).toBe('unread');
    await waitFor(() => expect(holder.fetchChannels).toHaveBeenCalled());
  });

  it('supports standard keyboard navigation between status tabs', () => {
    const { rerender } = render(<MobileNotificationContent />);

    fireEvent.keyDown(screen.getByRole('tab', { name: 'All' }), { key: 'ArrowRight' });
    rerender(<MobileNotificationContent />);

    const unreadTab = screen.getByRole('tab', { name: 'Unread' });
    expect(holder.channelStatusFilterObs.value).toBe('unread');
    expect(unreadTab).toHaveFocus();
    expect(unreadTab).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('tabindex', '-1');
  });

  it('clears a load-more error when switching status tabs', async () => {
    holder.showChannelLoadingMoreObs.value = true;
    holder.fetchChannels
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('load more failed'))
      .mockResolvedValue(undefined);
    render(<MobileNotificationContent />);

    await waitFor(() => expect(holder.fetchChannels).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Loading more' }));
    expect(await screen.findByText('Loading failed,')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Unread' }));

    expect(screen.queryByText('Loading failed,')).not.toBeInTheDocument();
  });

  it('ignores a stale load-more failure after switching status tabs', async () => {
    let rejectLoadMore: (error: Error) => void = () => {};
    const pendingLoadMore = new Promise<never>((_resolve, reject) => {
      rejectLoadMore = reject;
    });
    holder.showChannelLoadingMoreObs.value = true;
    holder.fetchChannels
      .mockResolvedValueOnce(undefined)
      .mockReturnValueOnce(pendingLoadMore)
      .mockResolvedValue(undefined);
    render(<MobileNotificationContent />);

    await waitFor(() => expect(holder.fetchChannels).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Loading more' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Unread' }));
    await act(async () => {
      rejectLoadMore(new Error('stale load more failure'));
    });

    expect(screen.queryByText('Loading failed,')).not.toBeInTheDocument();
  });

  it('closes the embedded view from the channel tabs back button', () => {
    render(<MobileNotificationContent />);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(holder.close).toHaveBeenCalledTimes(1);
    expect(holder.back).not.toHaveBeenCalled();
  });

  it('opens a channel message list and marks messages read before mobile navigation', async () => {
    render(<MobileNotificationContent />);

    fireEvent.click(screen.getByText('Approval'));

    expect(holder.selectedChannelNameObs.value).toBe('approval');
    expect(screen.getAllByRole('button', { name: 'Back' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Unread: Pending approval' })).toBeInTheDocument();
    expect(screen.getByText('Pending approval')).toBeInTheDocument();
    expect(screen.getByText('Please approve this request')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
    expect(holder.close).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Approval'));

    fireEvent.click(screen.getByText('Pending approval'));

    await waitFor(() =>
      expect(holder.updateMessage).toHaveBeenCalledWith({
        filterByTk: 'message-1',
        values: { status: 'read' },
      }),
    );
    expect(holder.navigate).toHaveBeenCalledWith('/tasks/1');
  });

  it('supports keyboard activation for channels and messages', async () => {
    render(<MobileNotificationContent />);

    fireEvent.keyDown(screen.getByRole('button', { name: /Approval/ }), { key: 'Enter' });
    expect(holder.selectedChannelNameObs.value).toBe('approval');

    fireEvent.keyDown(screen.getByRole('button', { name: /Pending approval/ }), { key: ' ' });
    await waitFor(() => expect(holder.updateMessage).toHaveBeenCalled());
  });

  it('does not strip a basename that only matches the start of another path segment', async () => {
    holder.selectedMessageListObs.value[0].options = { url: '/administrator/tasks' };
    render(<MobileNotificationContent />);

    fireEvent.click(screen.getByText('Approval'));
    fireEvent.click(screen.getByText('Pending approval'));

    await waitFor(() => expect(holder.navigate).toHaveBeenCalledWith('/administrator/tasks'));
  });

  it('strips the basename from root links that contain a query string', async () => {
    holder.selectedMessageListObs.value[0].options = { url: '/admin?tab=unread' };
    render(<MobileNotificationContent />);

    fireEvent.click(screen.getByText('Approval'));
    fireEvent.click(screen.getByText('Pending approval'));

    await waitFor(() => expect(holder.navigate).toHaveBeenCalledWith('/?tab=unread'));
  });
});
