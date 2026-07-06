/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '@nocobase/client-v2';
import { useRequest } from 'ahooks';
import { Conversation } from '../../types';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useCallback, useRef } from 'react';
import { useLoadMoreObserver } from './useLoadMoreObserver';
import { useWorkflowTasksStore } from '../stores/workflow-tasks';

export const useChatConversationActions = () => {
  const app = useApp();
  const api = app.apiClient;
  const setConversations = useChatConversationsStore.use.setConversations();
  const keyword = useChatConversationsStore.use.keyword();
  const unreadCount = useChatConversationsStore.use.unreadCount();
  const setUnreadCount = useChatConversationsStore.use.setUnreadCount();
  const setWorkflowTaskUnreadCount = useWorkflowTasksStore.use.setUnreadCount();

  const conversationsService = useRequest<
    {
      data: Conversation[];
      meta: { count: number; page: number; pageSize: number; totalPage: number };
    },
    [number?, string?]
  >(
    (page = 1, keyword = '') => {
      const filter: { title?: { $includes: string } } = {};

      // Filter by keyword
      if (keyword) {
        filter.title = { $includes: keyword };
      }

      return api
        .resource('aiConversations')
        .list({
          sort: ['-createdAt'],
          appends: ['aiEmployee'],
          page,
          pageSize: 50,
          filter,
        })
        .then((res) => res?.data);
    },
    {
      manual: true,
      onSuccess: (data, params) => {
        const page = params[0];
        if (!data?.data) {
          return;
        }
        if (!page || page === 1) {
          setConversations(data.data);
        } else {
          setConversations((prev) => [...prev, ...data.data]);
        }
      },
    },
  );
  const conversationsServiceRef = useRef(conversationsService);
  conversationsServiceRef.current = conversationsService;
  const loadMoreConversations = useCallback(async () => {
    const conversationsService = conversationsServiceRef.current;
    const meta = conversationsService.data?.meta;
    if (conversationsService.loading || (meta && meta.page >= meta.totalPage)) {
      return;
    }
    await conversationsService.runAsync(meta?.page ? meta.page + 1 : 1, keyword);
  }, [keyword]);
  const { ref: lastConversationRef } = useLoadMoreObserver({ loadMore: loadMoreConversations });

  const loadUnreadCounts = useCallback(async () => {
    const res = await api.resource('aiConversations').unreadCounts();
    const data = res?.data?.data;
    setUnreadCount(data?.conversationUnreadCount || 0);
    setWorkflowTaskUnreadCount(data?.workflowTaskUnreadCount || 0);
  }, [api, setUnreadCount, setWorkflowTaskUnreadCount]);

  const runSearch = (keyword = '') => conversationsService.run(1, keyword);
  const refresh = useCallback(() => {
    conversationsServiceRef.current.run();
  }, []);

  return {
    conversationsService,
    loadUnreadCounts,
    lastConversationRef,
    runSearch,
    refresh,
    unreadCount,
  };
};
