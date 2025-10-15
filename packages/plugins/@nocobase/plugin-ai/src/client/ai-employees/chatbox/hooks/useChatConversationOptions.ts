/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient } from '@nocobase/client';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useEffect, useState } from 'react';

export const useChatConversationOptions = () => {
  const api = useAPIClient();
  const sessionId = useChatConversationsStore.use.currentConversation();
  const webSearch = useChatConversationsStore.use.webSearch();
  const setWebSearch = useChatConversationsStore.use.setWebSearch();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    setLoading(true);
    api
      .resource('aiConversations')
      .get({
        filterByTk: sessionId,
      })
      .then(({ data }) => {
        const { conversationSettings } = data?.data?.options ?? {};
        const { webSearch } = conversationSettings ?? { webSearch: true };
        setWebSearch(webSearch);
      })
      .finally(() => {
        setLoading(false);
      })
      .catch(() => {});
  }, [api, sessionId, setWebSearch]);

  const updateWebSearch = async (webSearch: boolean) => {
    if (sessionId) {
      setLoading(true);
      await api.resource('aiConversations').updateOptions({
        filterByTk: sessionId,
        values: {
          conversationSettings: { webSearch },
        },
      });
      setWebSearch(webSearch);
      setLoading(false);
    } else {
      setWebSearch(webSearch);
    }
  };

  return {
    loading,
    webSearch,
    updateWebSearch,
  };
};
