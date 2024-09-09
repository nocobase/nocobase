/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAPIClient } from '@nocobase/client';
import { produce } from 'immer';
const useChats = () => {
  const [chatMap, setChatMap] = useState<Record<string, any>>({});
  const addChat = useCallback((chat) => {
    setChatMap(
      produce((draft) => {
        draft[chat.id] = chat;
      }),
    );
  }, []);
  const addChats = useCallback((chats) => {
    setChatMap(
      produce((draft) => {
        chats.forEach((chat) => {
          draft[chat.id] = chat;
        });
      }),
    );
  }, []);

  const chatList = useMemo(() => {
    return Object.values(chatMap).sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [chatMap]);
  const apiClient = useAPIClient();
  const fetchChats = useCallback(async () => {
    const res = await apiClient.request({
      url: 'myInSiteChats:list',
      method: 'get',
    });
    const chats = res.data.data.chats;
    if (Array.isArray(chats)) addChats(chats);
  }, [apiClient, addChats]);
  return {
    chatMap,
    chatList,
    addChat,
    addChats,
    fetchChats,
  };
};

export default useChats;
