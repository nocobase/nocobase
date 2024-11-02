/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import { observable, reaction } from '@formily/reactive';
import { notification } from 'antd';
import { SSEData } from '../../types';
import { messageMapObs, updateUnreadMsgsCount } from './message';
import { fetchChannels, selectedChannelNameObs } from './channel';
import { inboxVisible } from './inbox';
import { getAPIClient } from '../utils';
import { uid } from '@nocobase/utils/client';

export const liveSSEObs = observable<{ value: SSEData | null }>({ value: null });

export const startMsgSSEStreamWithRetry = async () => {
  let retryTimes = 0;
  const clientId = uid();
  const createMsgSSEConnection = async (clientId: string) => {
    const apiClient = getAPIClient();
    const res = await apiClient.silent().request({
      url: 'myInAppMessages:sse',
      method: 'get',
      headers: {
        Accept: 'text/event-stream',
      },
      params: {
        id: clientId,
      },
      responseType: 'stream',
      adapter: 'fetch',
    });
    const stream = res.data;
    const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
    retryTimes = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const messages = value.split('\n\n').filter(Boolean);
      for (const message of messages) {
        const sseData: SSEData = JSON.parse(message.replace(/^data:\s*/, '').trim());
        liveSSEObs.value = sseData;
      }
    }
  };

  const connectWithRetry = async () => {
    try {
      await createMsgSSEConnection(clientId);
    } catch (error) {
      console.error('Error during stream:', error.message);
      const nextDelay = retryTimes < 6 ? 1000 * Math.pow(2, retryTimes) : 60000;
      retryTimes++;
      setTimeout(() => {
        connectWithRetry();
      }, nextDelay);
      return { error };
    }
  };
  connectWithRetry();
};
