/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { autorun, observable, reaction } from '@nocobase/flow-engine';
import { dayjs, merge } from '@nocobase/utils/client';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Channel, Message } from '../types';
import { InAppMessagesDefinition } from '../types';
import { getApiClient } from './apiClient';

// Extend relativeTime once on module load so dayjs(...).fromNow() works
// across this plugin's UI. The legacy v1 client extends it as a side effect
// of `pm/PluginDetail.tsx`; client-v2 does not.
dayjs.extend(relativeTime);

export type ChannelStatus = 'all' | 'read' | 'unread';

// Observables ---------------------------------------------------------------

export const channelMapObs = observable<{ value: Record<string, Channel> }>({ value: {} });
export const isFetchingChannelsObs = observable<{ value: boolean }>({ value: false });
export const channelCountObs = observable<{ value: number }>({ value: 0 });
export const channelStatusFilterObs = observable<{ value: ChannelStatus }>({ value: 'all' });
export const selectedChannelNameObs = observable<{ value: string | null }>({ value: null });

export const userIdObs = observable<{ value: number | null }>({ value: null });

export const messageMapObs = observable<{ value: Record<string, Message> }>({ value: {} });
export const isFetchingMessageObs = observable<{ value: boolean }>({ value: false });
export const unreadMsgsCountObs = observable<{ value: number | null }>({ value: null });

export const inboxVisibleObs = observable<{ value: boolean }>({ value: false });

export const channelListObs = observable.computed(() => {
  const userKey = String(userIdObs.value ?? '');
  return Object.values(channelMapObs.value)
    .filter((channel) => String(channel.userId) === userKey)
    .filter((channel) => {
      if (channelStatusFilterObs.value === 'read') return channel.totalMsgCnt - channel.unreadMsgCnt > 0;
      if (channelStatusFilterObs.value === 'unread') return channel.unreadMsgCnt > 0;
      return true;
    })
    .sort((a, b) => (a.latestMsgReceiveTimestamp > b.latestMsgReceiveTimestamp ? -1 : 1));
}) as { value: Channel[] };

export const showChannelLoadingMoreObs = observable.computed(() => {
  return channelListObs.value.length < channelCountObs.value;
}) as { value: boolean };

export const selectedChannelObs = observable.computed(() => {
  const name = selectedChannelNameObs.value;
  if (name && channelMapObs.value[name]) return channelMapObs.value[name];
  return null;
}) as { value: Channel | null };

const filterMessageByStatus = (message: Message) => {
  if (channelStatusFilterObs.value === 'read') return message.status === 'read';
  if (channelStatusFilterObs.value === 'unread') return message.status === 'unread';
  return true;
};

const filterMessageByUserId = (message: Message) => {
  return String(message.userId) === String(userIdObs.value ?? '');
};

export const selectedMessageListObs = observable.computed(() => {
  const name = selectedChannelNameObs.value;
  if (!name) return [];
  return Object.values(messageMapObs.value)
    .filter((m) => m.channelName === name && filterMessageByStatus(m) && filterMessageByUserId(m))
    .sort((a, b) => (a.receiveTimestamp > b.receiveTimestamp ? -1 : 1));
}) as { value: Message[] };

export const showMsgLoadingMoreObs = observable.computed(() => {
  const name = selectedChannelNameObs.value;
  if (!name) return false;
  const channel = channelMapObs.value[name];
  if (!channel) return false;
  const list = selectedMessageListObs.value;
  if (list.length === 0) return false;
  const remaining = {
    read: channel.totalMsgCnt - channel.unreadMsgCnt > list.length,
    unread: channel.unreadMsgCnt > list.length,
    all: channel.totalMsgCnt > list.length,
  } as const;
  return remaining[channelStatusFilterObs.value];
}) as { value: boolean };

// Fetch functions -----------------------------------------------------------

export type FetchChannelsParams = {
  filter?: Record<string, any>;
  limit?: number;
};

export type FetchMessagesParams = {
  filter?: Record<string, any>;
  limit?: number;
};

export type UpdateMessageParams = {
  filterByTk: string | number;
  values: Record<string, any>;
};

export async function fetchChannels(params: FetchChannelsParams = {}) {
  const api = getApiClient();
  if (!api) return;
  isFetchingChannelsObs.value = true;
  try {
    const requestParams = merge({ filter: { status: channelStatusFilterObs.value } }, params ?? {}) as {
      filter?: Record<string, any>;
      limit?: number;
    };
    const res = await api.request({
      url: 'myInAppChannels:list',
      method: 'get',
      params: requestParams,
    });
    const channels = res?.data?.data;
    if (Array.isArray(channels)) {
      channels.forEach((channel: Channel) => {
        channelMapObs.value[channel.name] = channel;
      });
    }
    const count = res?.data?.meta?.count;
    if (!requestParams.filter?.name && typeof count === 'number' && count >= 0) {
      channelCountObs.value = count;
    }
  } finally {
    isFetchingChannelsObs.value = false;
  }
}

export async function fetchMessages(params: FetchMessagesParams = { limit: 30 }) {
  const api = getApiClient();
  if (!api) return;
  isFetchingMessageObs.value = true;
  try {
    const requestParams: Record<string, any> = { ...params };
    if (channelStatusFilterObs.value !== 'all') {
      requestParams.filter = merge(requestParams.filter ?? {}, { status: channelStatusFilterObs.value });
    }
    const res = await api.request({
      url: 'myInAppMessages:list',
      method: 'get',
      params: requestParams,
    });
    const messages = res?.data?.data?.messages;
    if (Array.isArray(messages)) {
      messages.forEach((message: Message) => {
        messageMapObs.value[message.id] = message;
      });
    }
  } finally {
    isFetchingMessageObs.value = false;
  }
}

export async function updateUnreadMsgsCount() {
  const api = getApiClient();
  if (!api) return;
  const res = await api.request({
    url: 'myInAppMessages:count',
    method: 'get',
    params: { filter: { status: 'unread' } },
  });
  unreadMsgsCountObs.value = res?.data?.data?.count ?? 0;
}

export async function updateMessage(params: UpdateMessageParams) {
  const api = getApiClient();
  if (!api) return;
  await api.request({
    resource: InAppMessagesDefinition.name,
    action: 'updateMyOwn',
    method: 'post',
    params,
  });
  const existing = messageMapObs.value[params.filterByTk];
  if (existing) {
    messageMapObs.value[params.filterByTk] = { ...existing, ...params.values };
    await fetchChannels({ filter: { name: existing.channelName, status: 'all' } });
  }
  await updateUnreadMsgsCount();
}

export async function markAllMessagesAsRead(channelName: string) {
  const api = getApiClient();
  if (!api) return;
  await api.request({
    resource: InAppMessagesDefinition.name,
    action: 'updateMyOwn',
    method: 'post',
    params: { filter: { status: 'unread', channelName }, values: { status: 'read' } },
  });
  Object.values(messageMapObs.value).forEach((message) => {
    if (message.channelName === channelName && message.status === 'unread') {
      message.status = 'read';
    }
  });
  await fetchChannels({ filter: { name: channelName, status: 'all' } });
  await updateUnreadMsgsCount();
}

// Module-level autoruns / reactions ----------------------------------------
//
// Mirror v1 observables/{channel,message}.ts side effects 1:1. These are
// idle until the corresponding observable actually changes, so it's safe to
// initialize them at module load (they fire on the next state change, by
// which time setApiClient(...) has already run from plugin.load).

autorun(() => {
  const list = channelListObs.value;
  if (!selectedChannelNameObs.value && list[0]?.name) {
    selectedChannelNameObs.value = list[0].name;
  } else if (list.length === 0) {
    selectedChannelNameObs.value = null;
  } else if (!list.find((channel) => channel.name === selectedChannelNameObs.value)) {
    selectedChannelNameObs.value = null;
  }
});

reaction(
  () => channelStatusFilterObs.value,
  () => {
    const list = channelListObs.value;
    if (list[0]?.name) {
      selectedChannelNameObs.value = list[0].name;
    }
  },
  { fireImmediately: true },
);

autorun(() => {
  if (selectedChannelNameObs.value) {
    fetchMessages({ filter: { channelName: selectedChannelNameObs.value } });
  }
});
