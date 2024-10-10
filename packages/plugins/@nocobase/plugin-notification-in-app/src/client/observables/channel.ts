/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable, autorun } from '@formily/reactive';
import { Channel } from '../../types';
import { getAPIClient } from '../utils';

export const channelMapObs = observable<{ value: Record<string, Channel> }>({ value: {} });
export const isFetchingChannelsObs = observable<{ value: boolean }>({ value: false });
export const channelCountObs = observable<{ value: number }>({ value: 0 });
export const channelListObs = observable.computed(() => {
  const channels = Object.values(channelMapObs.value).sort((a, b) =>
    a.latestMsgReceiveTimestamp > b.latestMsgReceiveTimestamp ? -1 : 1,
  );
  return channels;
}) as { value: Channel[] };

export const showChannelLoadingMoreObs = observable.computed(() => {
  if (channelListObs.value.length < channelCountObs.value) return true;
  else return false;
}) as { value: boolean };
export const selectedChannelIdObs = observable<{ value: string | null }>({ value: null });

export const fetchChannels = async (params: any) => {
  const apiClient = getAPIClient();
  isFetchingChannelsObs.value = true;
  const res = await apiClient.request({
    url: 'myInAppChats:list',
    method: 'get',
    params,
  });
  const channels = res.data?.data;
  if (Array.isArray(channels)) {
    channels.forEach((channel: Channel) => {
      channelMapObs.value[channel.id] = channel;
    });
  }
  const count = res.data?.meta?.count;
  if (count) channelCountObs.value = count;
  isFetchingChannelsObs.value = false;
};

autorun(() => {
  if (!selectedChannelIdObs.value && channelListObs.value[0]?.id) {
    selectedChannelIdObs.value = channelListObs.value[0].id;
  }
});
