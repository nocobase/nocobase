/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import { observable, autorun, reaction } from '@formily/reactive';
import { notification } from 'antd';
import { SSEData } from '../../types';
import { messageMapObs, updateUnreadMsgsCount } from './message';
import { channelMapObs, fetchChannels, selectedChannelNameObs } from './channel';
import { inboxVisible } from './inbox';
import { getAPIClient } from '../utils';

export const liveSSEObs = observable<{ value: SSEData | null }>({ value: null });

reaction(
  () => liveSSEObs.value,
  (sseData) => {
    if (!sseData) return;

    if (['message:created', 'message:updated'].includes(sseData.type)) {
      const { data } = sseData;
      messageMapObs.value[data.id] = data;
      if (sseData.type === 'message:created') {
        notification.info({
          message: (
            <div
              style={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {data.title}
            </div>
          ),
          description: data.content.slice(0, 100) + (data.content.length > 100 ? '...' : ''),
          onClick: () => {
            inboxVisible.value = true;
            selectedChannelNameObs.value = data.channelName;
            notification.destroy();
          },
        });
      }
      fetchChannels({ filter: { name: data.channelName } });
      updateUnreadMsgsCount();
    }
  },
);

export const createMsgSSEConnection = async () => {
  const apiClient = getAPIClient();
  const res = await apiClient.request({
    url: 'myInAppMessages:sse',
    method: 'get',
    headers: {
      Accept: 'text/event-stream',
    },
    params: {
      id: crypto.randomUUID(),
    },
    responseType: 'stream',
    adapter: 'fetch',
  });
  const stream = res.data;
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const { value, done } = await reader.read();
      if (done) break;
      const messages = value.split('\n\n').filter(Boolean);
      for (const message of messages) {
        const sseData: SSEData = JSON.parse(message.replace(/^data:\s*/, '').trim());
        liveSSEObs.value = sseData;
      }
    } catch (error) {
      console.error(error);
      break;
    }
  }
};
