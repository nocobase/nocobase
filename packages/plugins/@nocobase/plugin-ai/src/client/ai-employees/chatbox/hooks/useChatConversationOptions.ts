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
import { useChatMessagesStore } from '../stores/chat-messages';
import _ from 'lodash';
import { useChatBoxStore } from '../stores/chat-box';
import { useT } from '../../../locale';

export const useChatConversationOptions = () => {
  const t = useT();
  const api = useAPIClient();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const messages = useChatMessagesStore.use.messages();
  const setMessages = useChatMessagesStore.use.setMessages();
  const removeMessage = useChatMessagesStore.use.removeMessage();
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

  useEffect(() => {
    if (currentEmployee?.webSearch === true && currentEmployee?.toolsConflict === true) {
      const hintMessageKey = 'web-search-not-supported';
      if (webSearch) {
        setMessages(
          _.unionBy(
            [
              ...messages,
              {
                key: hintMessageKey,
                role: 'hint',
                content: {
                  type: 'text',
                  content: t(
                    'You are currently using the Gemini LLM service. When Web Search is enabled, AI employees will temporarily be unable to use skills',
                  ),
                },
                loading: false,
              },
            ],
            'key',
          ),
        );
      } else {
        removeMessage(hintMessageKey);
      }
    }
  }, [webSearch, currentEmployee]);

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

  const resetDefaultWebSearch = async () => {
    setWebSearch(true);
  };

  return {
    loading,
    webSearch,
    updateWebSearch,
    resetDefaultWebSearch,
  };
};
