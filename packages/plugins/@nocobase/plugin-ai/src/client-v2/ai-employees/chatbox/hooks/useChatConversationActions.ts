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
import { useCallback, useRef } from 'react';
import { useLoadMoreObserver } from './useLoadMoreObserver';
import { resolveChatBoxScope, type ChatBoxRuntime, useResolvedChatBoxRuntime } from '../stores/runtime';

export const useChatConversationActions = (runtime?: ChatBoxRuntime) => {
  const app = useApp();
  const api = app.apiClient;
  const resolvedRuntime = useResolvedChatBoxRuntime(runtime);
  const { chatConversationModel, workflowTaskModel } = resolvedRuntime;
  const keyword = chatConversationModel.keyword;
  const unreadCount = chatConversationModel.unreadCount;

  const conversationsService = useRequest<
    {
      data: Conversation[];
      meta: { count: number; page: number; pageSize: number; totalPage: number };
    },
    [number?, string?]
  >(
    async (page = 1, keyword = '') => {
      const filter: { title?: { $includes: string }; scope?: string } = {};
      const scope = await resolveChatBoxScope(resolvedRuntime, { operation: 'list' });

      // Filter by keyword
      if (keyword) {
        filter.title = { $includes: keyword };
      }
      if (scope) {
        filter.scope = scope;
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
          chatConversationModel.setConversations(data.data);
        } else {
          chatConversationModel.setConversations((prev) => [...prev, ...data.data]);
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
    chatConversationModel.setUnreadCount(data?.conversationUnreadCount || 0);
    workflowTaskModel.setUnreadCount(data?.workflowTaskUnreadCount || 0);
  }, [api, chatConversationModel, workflowTaskModel]);

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
