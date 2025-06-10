/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable, reaction } from '@formily/reactive';
import { uid } from '@nocobase/utils/client';
import { SSEData } from '../../types';
import { getAPIClient } from '../utils';
import { fetchChannels } from './channel';
import { messageMapObs, updateUnreadMsgsCount } from './message';

export const liveSSEObs = observable<{ value: SSEData | null }>({ value: null });
reaction(
  () => liveSSEObs.value,
  (sseData) => {
    if (!sseData) return;

    if (['message:created', 'message:updated'].includes(sseData.type)) {
      const { data } = sseData;
      messageMapObs.value[data.id] = data;
      fetchChannels({ filter: { name: data.channelName } });
      updateUnreadMsgsCount();
    }
  },
);
export const startMsgSSEStreamWithRetry: () => () => void = () => {
  let retryTimes = 0;
  const controller = new AbortController();
  let disposed = false;
  const dispose = () => {
    disposed = true;
    controller.abort();
  };

  const clientId = uid();
  const createMsgSSEConnection = async (clientId: string) => {
    await updateUnreadMsgsCount();
    const apiClient = getAPIClient();
    const res = await apiClient.silent().request({
      url: 'myInAppMessages:sse',
      skipAuth: true,
      method: 'get',
      signal: controller.signal,
      headers: {
        Accept: 'text/event-stream',
      },
      params: {
        id: clientId,
      },
      responseType: 'stream',
      adapter: 'fetch',
      skipNotify: (error) => (!error || !error.message ? true : false),
    });
    if (!res?.data) return;
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
      console.log(`sse connection for clientId ${clientId} failed, retrying...`, error);
      const nextDelay = retryTimes < 6 ? 1000 * Math.pow(2, retryTimes) : 60000;
      retryTimes++;
      setTimeout(() => {
        if (!disposed) connectWithRetry();
      }, nextDelay);
      return { error };
    }
  };
  connectWithRetry();
  return dispose;
};
