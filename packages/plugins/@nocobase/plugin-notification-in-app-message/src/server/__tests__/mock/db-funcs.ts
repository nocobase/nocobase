/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { uid } from '@nocobase/utils';
import { randomUUID } from 'crypto';

export async function createMessages({ messagesRepo }, { unreadNum, readNum, channelName, startTimeStamp, userId }) {
  const unreadMessages = Array.from({ length: unreadNum }, (_, idx) => {
    return {
      id: randomUUID(),
      channelName,
      userId,
      status: 'unread',
      title: `unread-${idx}`,
      content: 'unread',
      receiveTimestamp: startTimeStamp - idx * 1000,
      options: {
        url: '/admin/pages',
      },
    };
  });
  const readMessages = Array.from({ length: readNum }, (_, idx) => {
    return {
      id: randomUUID(),
      channelName,
      userId,
      status: 'read',
      title: `read-${idx}`,
      content: 'unread',
      receiveTimestamp: startTimeStamp - idx - 100000000,
      options: {
        url: '/admin/pages',
      },
    };
  });
  const totalMessages = [...unreadMessages, ...readMessages];
  await messagesRepo.create({
    values: totalMessages,
  });
}

export async function createChannels({ channelsRepo }, { totalNum }) {
  const channelsData = Array.from({ length: totalNum }).map((val, idx) => {
    return {
      name: `s_${uid()}`,
      title: `站内信渠道-${idx}`,
      notificationType: 'in-app-message',
    };
  });
  await channelsRepo.create({ values: channelsData });
  return channelsData;
}
