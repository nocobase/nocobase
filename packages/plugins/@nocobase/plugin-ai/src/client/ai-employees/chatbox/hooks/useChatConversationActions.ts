/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useRequest } from '@nocobase/client';
import { Conversation } from '../../types';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useCallback, useRef } from 'react';
import { useLoadMoreObserver } from './useLoadMoreObserver';

export const useChatConversationActions = () => {
  const api = useAPIClient();
  const setConversations = useChatConversationsStore.use.setConversations();
  const keyword = useChatConversationsStore.use.keyword();
  const conversationsService = useRequest<Conversation[]>(
    (page = 1, keyword = '') =>
      api
        .resource('aiConversations')
        .list({
          sort: ['-updatedAt'],
          appends: ['aiEmployee'],
          page,
          pageSize: 15,
          filter: keyword ? { title: { $includes: keyword } } : {},
        })
        .then((res) => res?.data),
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
  const conversationsServiceRef = useRef<any>();
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

  return {
    conversationsService,
    lastConversationRef,
  };
};
