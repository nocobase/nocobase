/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/server';
import { randomUUID } from 'crypto';

export async function MockMessages(
  { messagesRepo, channelsRepo },
  { unreadNum, readNum, chatId, startTimeStamp, userId },
) {
  const unreadMessages = Array.from({ length: unreadNum }, (_, idx) => {
    return {
      id: randomUUID(),
      chatId,
      userId,
      status: 'unread',
      title: `unread-${idx}`,
      content: 'unread',
      receiveTimestamp: startTimeStamp - idx,
      options: {
        url: '/admin/pages',
      },
    };
  });
  const readMessages = Array.from({ length: readNum }, (_, idx) => {
    return {
      id: randomUUID(),
      chatId,
      userId,
      status: 'read',
      title: `read-${idx}`,
      content: 'unread',
      receiveTimestamp: startTimeStamp - idx - 100000,
      options: {
        url: '/admin/pages',
      },
    };
  });
  const totalMessages = [...unreadMessages, ...readMessages];
  await messagesRepo.create({
    values: totalMessages,
  });
  await channelsRepo.update({ values: { latestMsgId: totalMessages[0].id }, filterByTk: chatId });
}

export async function MockChannels({ channelsRepo }, { totalNum, userId }) {
  const channelsData = Array.from({ length: totalNum }).map((val, idx) => {
    return {
      id: randomUUID(),
      senderId: randomUUID(),
      userId,
      title: `渠道测试-${idx}`,
    };
  });
  await channelsRepo.create({ values: channelsData });
  return channelsData;
}
