/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { notification } from 'antd';
import { dayjs } from '@nocobase/utils/client';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import type { Channel, Message } from '../../types';
import { Inbox } from '../components/Inbox';
import { MobileMessagePage } from '../components/mobile/MessagePage';
import {
  channelMapObs,
  channelStatusFilterObs,
  inboxVisible,
  messageMapObs,
  selectedChannelNameObs,
} from '../observables';

const { request, eventBus } = vi.hoisted(() => ({ request: vi.fn(), eventBus: new EventTarget() }));

vi.mock('../utils', () => ({ getAPIClient: () => ({ request }) }));
vi.mock('@nocobase/client', () => ({
  css: () => '',
  useApp: () => ({ eventBus, router: { basename: '/' }, i18n: { t: (key: string) => key } }),
  useCurrentUserContext: () => ({ data: { data: { id: 1 } } }),
  useMobileLayout: () => ({ isMobileLayout: true }),
  Icon: () => <span>Inbox</span>,
}));
vi.mock('@nocobase/flow-engine', async () => ({ observer: (await import('@formily/reactive-react')).observer }));
vi.mock('../../locale', () => ({ useLocalTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@nocobase/plugin-mobile/client', () => ({
  MobilePopup: ({
    title,
    visible,
    children,
    onClose,
  }: PropsWithChildren<{ title: string; visible: boolean; onClose: () => void }>) =>
    visible && (
      <section role="dialog" aria-label={title}>
        <button onClick={onClose}>Close</button>
        {children}
      </section>
    ),
  MobilePageProvider: ({ children }: PropsWithChildren) => <>{children}</>,
  MobilePageContentContainer: ({ children }: PropsWithChildren) => <>{children}</>,
  MobilePageHeader: ({ children }: PropsWithChildren) => <>{children}</>,
  MobilePageNavigationBar: () => null,
}));

function channel(name: string, timestamp: number): Channel {
  return {
    name,
    title: name,
    userId: '1',
    unreadMsgCnt: 1,
    totalMsgCnt: 1,
    latestMsgReceiveTimestamp: timestamp,
    latestMsgTitle: name + ' preview',
  };
}

function message(name: string, timestamp: number): Message {
  return {
    id: name,
    title: name + ' message',
    content: name + ' body',
    userId: '1',
    channelName: name,
    receiveTimestamp: timestamp,
    status: 'unread',
    options: {},
    url: '',
  };
}

dayjs.extend(relativeTime);

const channels = [channel('A', 200), channel('B', 100)];
const messages = [message('A', 200), message('B', 100)];

afterEach(() => {
  cleanup();
  inboxVisible.value = false;
  channelMapObs.value = {};
  messageMapObs.value = {};
  channelStatusFilterObs.value = 'all';
  vi.restoreAllMocks();
  request.mockReset();
});

function mockInboxApi() {
  const storedMessages = messages.map((item) => ({ ...item }));
  request.mockImplementation(async ({ url, action, params }) => {
    if (action === 'updateMyOwn') {
      const item = storedMessages.find((row) => row.id === params.filterByTk);
      if (!item) throw new Error('Unknown message ' + params.filterByTk);
      item.status = params.values.status;
      return { data: {} };
    }
    const filter = params.filter;
    if (url === 'myInAppChannels:list') {
      const data = channels
        .filter((item) => !filter.name || item.name === filter.name)
        .map((item) => ({
          ...item,
          unreadMsgCnt: storedMessages.filter((msg) => msg.channelName === item.name && msg.status === 'unread').length,
        }));
      return { data: { data, meta: { count: data.length } } };
    }
    if (url === 'myInAppMessages:list') {
      return {
        data: {
          data: {
            messages: storedMessages
              .filter(
                (item) => item.channelName === filter.channelName && (!filter.status || item.status === filter.status),
              )
              .map((item) => ({ ...item })),
          },
        },
      };
    }
    if (url === 'myInAppMessages:count') return { data: { data: { count: 2 } } };
    throw new Error('Unexpected request ' + url);
  });
}

async function openInbox(path: string) {
  mockInboxApi();
  vi.spyOn(notification, 'info').mockImplementation(() => {});
  render(
    <MemoryRouter initialEntries={[path]}>
      <Inbox />
    </MemoryRouter>,
  );

  // B is received while the inbox is closed. Opening it then loads the full list, with A above B.
  await act(async () => {
    eventBus.dispatchEvent(new CustomEvent('ws:message:in-app-message:created', { detail: messages[1] }));
  });
  expect(selectedChannelNameObs.value).toBe('B');
  fireEvent.click(screen.getByText('Inbox'));
  const list = within(await screen.findByRole('dialog', { name: 'Message' }));
  await list.findByText('A');
  const rows = list.getAllByText(/^(A|B)$/);
  expect(rows.map((row) => row.textContent?.trim())).toEqual(['A', 'B']);
  return rows;
}

it('opens only the first channel’s messages when the second channel has a new message', async () => {
  const [first] = await openInbox('/');
  fireEvent.click(first);
  const detail = within(screen.getByRole('dialog', { name: 'A' }));
  expect(await detail.findByText('A body')).toBeVisible();
  expect(detail.queryByText('B body')).toBeNull();
  fireEvent.click(detail.getByText('A message'));
  await waitFor(() => expect(messageMapObs.value.A.status).toBe('read'));
  expect(messageMapObs.value.B.status).toBe('unread');
});

it('shows an empty A popup after reading its last unread message while B is still unread', async () => {
  await openInbox('/');
  const list = within(screen.getByRole('dialog', { name: 'Message' }));
  fireEvent.click(list.getByText('Unread'));
  fireEvent.click(list.getByText('A'));
  const detail = within(screen.getByRole('dialog', { name: 'A' }));
  fireEvent.click(await detail.findByText('A body'));
  await waitFor(() => expect(list.queryByText('A')).toBeNull());
  expect(detail.queryByText('A body')).toBeNull();
  expect(detail.queryByText('B body')).toBeNull();
  expect(messageMapObs.value.B.status).toBe('unread');
});

it('keeps the popup selection when the host URL names another channel', async () => {
  const [first] = await openInbox('/?channel=B');
  fireEvent.click(first);
  const detail = within(screen.getByRole('dialog', { name: 'A' }));
  expect(await detail.findByText('A body')).toBeVisible();
  expect(detail.queryByText('B body')).toBeNull();
  expect(selectedChannelNameObs.value).toBe('B');
});

it('keeps late results for A out of the reopened B popup', async () => {
  const [first, second] = await openInbox('/');
  let finishRequest: () => void;
  request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishRequest = () => resolve({ data: { data: { messages: [messages[0]] } } });
      }),
  );
  fireEvent.click(first);
  const firstPopup = within(screen.getByRole('dialog', { name: 'A' }));
  expect(firstPopup.queryByText('B body')).toBeNull();
  fireEvent.click(firstPopup.getByText('Close'));
  fireEvent.click(second);
  const secondPopup = within(screen.getByRole('dialog', { name: 'B' }));
  await act(async () => finishRequest());
  expect(secondPopup.getByText('B body')).toBeVisible();
  expect(secondPopup.queryByText('A body')).toBeNull();
});

it('still loads a standalone mobile message page from its channel query parameter', async () => {
  mockInboxApi();
  render(
    <MemoryRouter initialEntries={['/page/in-app-message/messages?channel=A']}>
      <MobileMessagePage />
    </MemoryRouter>,
  );
  expect(await screen.findByText('A body')).toBeVisible();
  expect(selectedChannelNameObs.value).toBe('A');
  expect(screen.queryByText('B body')).toBeNull();
});

it('retries a failed first page for the clicked channel', async () => {
  const [first] = await openInbox('/');
  request.mockRejectedValueOnce(new Error('Temporary failure'));
  fireEvent.click(first);
  const detail = within(screen.getByRole('dialog', { name: 'A' }));
  fireEvent.click(await detail.findByText('please reload'));
  expect(await detail.findByText('A body')).toBeVisible();
  expect(detail.queryByText('B body')).toBeNull();
  expect(request).toHaveBeenLastCalledWith({
    url: 'myInAppMessages:list',
    method: 'get',
    params: { filter: { channelName: 'A' }, limit: 30 },
  });
});
