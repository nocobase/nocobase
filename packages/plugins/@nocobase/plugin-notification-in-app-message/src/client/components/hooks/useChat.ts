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
export type Message = {
  id: string;
  title: string;
  receiveTimestamp: number;
  content: string;
  status: 'read' | 'unread';
};
export type Group = {
  id: string;
  title: string;
  msgMap: Record<string, Message>;
  unreadMsgCnt: number;
  latestMsgReceiveTimestamp: number;
  latestMsgTitle: string;
};
const useChats = () => {
  const apiClient = useAPIClient();
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
          draft[group.id] = { ...draft[group.id], ...group };
          if (!draft[group.id].msgMap) draft[group.id].msgMap = {};
        });
      }),
    );
  }, []);
  const requestChats = useCallback(
    async ({ filter = {}, limit = 30 }: { filter?: Record<string, any>; limit?: number }) => {
      const res = await apiClient.request({
        url: 'myInAppChannels:list',
        method: 'get',
        params: { filter, limit },
      });
      const chats = res.data.data.chats;
      if (Array.isArray(chats)) return chats;
      else return [];
    },
    [apiClient],
  );

  const addMessagesToGroup = useCallback(
    async (groupId: string, messages: Message[]) => {
      const groups = await requestChats({ filter: { id: groupId } });
      if (groups.length < 1) return;
      const group = groups[0];
      if (group)
        setGroupMap(
          produce((draft) => {
            draft[groupId] = { ...(draft[groupId] ?? {}), ...group };
            if (!draft[groupId].msgMap) draft[groupId].msgMap = {};
            messages.forEach((message) => {
              draft[groupId].msgMap[message.id] = message;
            });
          }),
        );
    },
    [requestChats],
  );

  const chatList = useMemo(() => {
    return Object.values(groupMap).sort((a, b) => (a.latestMsgReceiveTimestamp > b.latestMsgReceiveTimestamp ? -1 : 1));
  }, [groupMap]);

  const fetchChats = useCallback(
    async ({ filter = {}, limit = 30 }: { filter?: Record<string, any>; limit?: number }) => {
      const res = await apiClient.request({
        url: 'myInAppChannels:list',
        method: 'get',
        params: { filter, limit },
      });
      const chats = res.data.data.chats;
      if (Array.isArray(chats)) addChats(chats);
    },
    [apiClient, addChats],
  );

  const fetchMessages = useCallback(
    async ({ filter }) => {
      const res = await apiClient.request({
        url: 'myInAppMessages:list',
        method: 'get',
        params: {
          filter,
        },
      });
      addMessagesToGroup(filter.channelName, res.data.data.messages);
    },
    [apiClient, addMessagesToGroup],
  );
  return {
    chatMap: groupMap,
    chatList,
    addChat,
    addChats,
    fetchChats,
    fetchMessages,
    addMessagesToGroup,
  };
};

export default useChats;
