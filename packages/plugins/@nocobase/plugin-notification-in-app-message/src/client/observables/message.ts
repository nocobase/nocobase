/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { autorun, observable } from '@formily/reactive';
import { merge } from '@nocobase/utils/client';
import { InAppMessagesDefinition, Message } from '../../types';
import { getAPIClient } from '../utils';
import { channelMapObs, channelStatusFilterObs, fetchChannels, selectedChannelNameObs } from './channel';
import { userIdObs } from './user';

export const messageMapObs = observable<{ value: Record<string, Message> }>({ value: {} });
export const isFecthingMessageObs = observable<{ value: boolean }>({ value: false });
export const messageListObs = observable.computed(() => {
  return Object.values(messageMapObs.value).sort((a, b) => (a.receiveTimestamp > b.receiveTimestamp ? -1 : 1));
}) as { value: Message[] };

const filterMessageByStatus = (message: Message) => {
  if (channelStatusFilterObs.value === 'read') return message.status === 'read';
  else if (channelStatusFilterObs.value === 'unread') return message.status === 'unread';
  else return true;
};
const filterMessageByUserId = (message: Message) => {
  return message.userId == String(userIdObs.value ?? '');
};
export const selectedMessageListObs = observable.computed(() => {
  if (selectedChannelNameObs.value) {
    const filteredMessages = messageListObs.value.filter(
      (message) =>
        message.channelName === selectedChannelNameObs.value && filterMessageByStatus(message) && filterMessageByUserId,
    );
    return filteredMessages;
  } else {
    return [];
  }
}) as { value: Message[] };

export const fetchMessages = async (params: any = { limit: 30 }) => {
  isFecthingMessageObs.value = true;
  if (channelStatusFilterObs.value !== 'all')
    params.filter = merge(params.filter ?? {}, { status: channelStatusFilterObs.value });
  const apiClient = getAPIClient();
  const res = await apiClient.request({
    url: 'myInAppMessages:list',
    method: 'get',
    params,
  });
  const messages = res?.data?.data.messages;
  if (Array.isArray(messages)) {
    messages.forEach((message: Message) => {
      messageMapObs.value[message.id] = message;
    });
  }
  isFecthingMessageObs.value = false;
};

export const updateMessage = async (params: { filterByTk: any; values: Record<any, any> }) => {
  const apiClient = getAPIClient();
  await apiClient.request({
    resource: InAppMessagesDefinition.name,
    action: 'update',
    method: 'post',
    params,
  });
  const unupdatedMessage = messageMapObs.value[params.filterByTk];
  messageMapObs.value[params.filterByTk] = { ...unupdatedMessage, ...params.values };
  fetchChannels({ filter: { name: unupdatedMessage.channelName, status: 'all' } });
  updateUnreadMsgsCount();
};

export const markAllMessagesAsRead = async ({ channelName }: { channelName: string }) => {
  const apiClient = getAPIClient();
  await apiClient.request({
    resource: InAppMessagesDefinition.name,
    action: 'updateMyOwn',
    method: 'post',
    params: { filter: { status: 'unread', channelName: channelName }, values: { status: 'read' } },
  });
  Object.values(messageMapObs.value).forEach((message) => {
    if (message.channelName === channelName && message.status === 'unread') {
      message.status = 'read';
    }
  });
  fetchChannels({ filter: { name: channelName, status: 'all' } });
  updateUnreadMsgsCount();
};

autorun(() => {
  if (selectedChannelNameObs.value) {
    fetchMessages({ filter: { channelName: selectedChannelNameObs.value } });
  }
});

export const unreadMsgsCountObs = observable<{ value: number | null }>({ value: null });
export const updateUnreadMsgsCount = async () => {
  const apiClient = getAPIClient();
  const res = await apiClient.request({
    url: 'myInAppMessages:count',
    method: 'get',
    params: { filter: { status: 'unread' } },
    skipNotify: true,
  });
  unreadMsgsCountObs.value = res?.data?.data.count;
};

export const showMsgLoadingMoreObs = observable.computed(() => {
  const selectedChannelId = selectedChannelNameObs.value;
  if (!selectedChannelId) return false;
  const selectedChannel = channelMapObs.value[selectedChannelId];
  const selectedMessageList = selectedMessageListObs.value;

  const isMoreMessageByStatus = {
    read: selectedChannel.totalMsgCnt - selectedChannel.unreadMsgCnt > selectedMessageList.length,
    unread: selectedChannel.unreadMsgCnt > selectedMessageList.length,
    all: selectedChannel.totalMsgCnt > selectedMessageList.length,
  };
  if (isMoreMessageByStatus[channelStatusFilterObs.value] && selectedMessageList.length > 0) {
    return true;
  }
}) as { value: boolean };
