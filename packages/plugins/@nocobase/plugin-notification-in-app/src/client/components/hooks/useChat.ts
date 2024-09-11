/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAPIClient, useRequest } from '@nocobase/client';
import { produce } from 'immer';
import { dayjs } from '@nocobase/utils/client';
export type Message = {
  id: string;
  title: string;
  createdAt: dayjs.Dayjs;
  content: string;
  status: 'read' | 'unread';
};
export type Group = {
  id: string;
  title: string;
  msgMap: Record<string, Message>;
  unreadMsgCnt: number;
  lastMsgReceiveTime: dayjs.Dayjs;
  latestMsgTitle: string;
};
const useChats = () => {
  const [groupMap, setGroupMap] = useState<Record<string, Group>>({});
  const addChat = useCallback((chat) => {
    setGroupMap(
      produce((draft) => {
        draft[chat.id] = chat;
      }),
    );
  }, []);
  const addChats = useCallback((groups) => {
    setGroupMap(
      produce((draft) => {
        groups.forEach((group) => {
          group.msgMap = {};
          draft[group.id] = group;
        });
      }),
    );
  }, []);

  const addMessagesToGroup = useCallback((groupId: string, messages: Message[]) => {
    setGroupMap(
      produce((draft) => {
        const group = draft[groupId];
        if (group) {
          messages.forEach((message) => {
            group.msgMap[message.id] = message;
          });
        }
      }),
    );
  }, []);

  const chatList = useMemo(() => {
    return Object.values(groupMap).sort((a, b) => (a.lastMsgReceiveTime > b.lastMsgReceiveTime ? -1 : 1));
  }, [groupMap]);
  const apiClient = useAPIClient();

  const fetchChats = useCallback(
    async ({ filter = {}, limit = 30 }: { filter?: Record<string, any>; limit?: number }) => {
      const res = await apiClient.request({
        url: 'myInSiteChats:list',
        method: 'get',
        params: { filter, limit },
      });
      const chats = res.data.data.chats.map((chat) => ({
        ...chat,
        lastMsgReceiveTime: dayjs(chat.lastMsgReceiveTime),
      }));
      if (Array.isArray(chats)) addChats(chats);
    },
    [apiClient, addChats],
  );

  const fetchMessagesByGroupId = useCallback(
    async ({ groupId }) => {
      const res = await apiClient.request({
        url: 'myInSiteMessages:list',
        method: 'get',
        params: {
          groupId,
        },
      });
      addMessagesToGroup(
        groupId,
        res.data.data.messages.map((message) => ({ ...message, createdAt: dayjs(message.createdAt) })),
      );
    },
    [apiClient, addMessagesToGroup],
  );
  return {
    chatMap: groupMap,
    chatList,
    addChat,
    addChats,
    fetchChats,
    fetchMessagesByGroupId,
  };
};

export default useChats;
