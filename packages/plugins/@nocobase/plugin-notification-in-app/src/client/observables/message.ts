/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable, autorun } from '@formily/reactive';
import { Message } from '../../types';
import { getAPIClient } from '../utils';
import { channelMapObs, selectedChannelIdObs, fetchChannels } from './channel';
import { InAppMessagesDefinition } from '../../types';

export const messageMapObs = observable<{ value: Record<string, Message> }>({ value: {} });
export const isFecthingMessageObs = observable<{ value: boolean }>({ value: false });
export const messageListObs = observable.computed(() => {
  return Object.values(messageMapObs.value).sort((a, b) => (a.receiveTimestamp > b.receiveTimestamp ? -1 : 1));
}) as { value: Message[] };

export const selectedMessageListObs = observable.computed(() => {
  if (selectedChannelIdObs.value) {
    const filteredMessages = messageListObs.value.filter((message) => message.chatId === selectedChannelIdObs.value);
    return filteredMessages;
  } else {
    return [];
  }
}) as { value: Message[] };

export const fetchMessages = async (params: any = { limit: 30 }) => {
  isFecthingMessageObs.value = true;
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
  fetchChannels({ filter: { id: unupdatedMessage.chatId } });
  updateUnreadMsgsCount();
};

autorun(() => {
  if (selectedChannelIdObs.value) {
    fetchMessages({ filter: { chatId: selectedChannelIdObs.value } });
  }
});

export const unreadMsgsCountObs = observable<{ value: number | null }>({ value: null });
export const updateUnreadMsgsCount = async () => {
  const apiClient = getAPIClient();
  const res = await apiClient.request({
    url: 'myInAppMessages:count',
    method: 'get',
    params: { filter: { status: 'unread' } },
  });
  unreadMsgsCountObs.value = res?.data?.data.count;
};

export const showMsgLoadingMoreObs = observable.computed(() => {
  const selectedChannelId = selectedChannelIdObs.value;
  if (!selectedChannelId) return false;
  const selectedChannel = channelMapObs.value[selectedChannelId];
  const selectedMessageList = selectedMessageListObs.value;
  const isMoreMessage = selectedChannel.totalMsgCnt > selectedMessageList.length;
  if (isMoreMessage && selectedMessageList.length > 0) {
    return true;
  }
}) as { value: boolean };
