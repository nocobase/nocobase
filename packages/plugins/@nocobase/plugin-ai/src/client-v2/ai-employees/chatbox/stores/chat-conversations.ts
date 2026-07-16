/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Conversation } from '../../types';
import { action, define, observable } from '@nocobase/flow-engine';

type ChatConversationStateUpdater<T> = T | ((prev: T) => T);

export class ChatConversationModel {
  currentConversation: string | undefined = undefined;
  conversations: Conversation[] = observable.shallow([]);
  keyword = '';
  webSearch = false;
  conversationSegmented = 'conversations';
  unreadCount = 0;

  constructor() {
    define(this, {
      currentConversation: observable.ref,
      conversations: observable.shallow,
      keyword: observable.ref,
      webSearch: observable.ref,
      conversationSegmented: observable.ref,
      unreadCount: observable.ref,
      setCurrentConversation: action,
      setKeyword: action,
      setConversations: action,
      markConversationRead: action,
      setWebSearch: action,
      setConversationSegmented: action,
      setUnreadCount: action,
    });
  }

  setCurrentConversation = (id: string | undefined) => {
    this.currentConversation = id;
  };

  setKeyword = (keyword: string) => {
    this.keyword = keyword;
  };

  setConversations = (conversations: ChatConversationStateUpdater<Conversation[]>) => {
    this.conversations = typeof conversations === 'function' ? conversations(this.conversations) : conversations;
  };

  markConversationRead = (sessionId: string) => {
    const target = this.conversations.find((item) => item.sessionId === sessionId);
    if (!target || target.read) {
      return;
    }

    this.conversations = this.conversations.map((item) =>
      item.sessionId === sessionId
        ? {
            ...item,
            read: true,
          }
        : item,
    );
    this.unreadCount = Math.max(0, this.unreadCount - 1);
  };

  setWebSearch = (webSearch: boolean) => {
    this.webSearch = webSearch;
  };

  setConversationSegmented = (conversationSegmented: string) => {
    this.conversationSegmented = conversationSegmented;
  };

  setUnreadCount = (unreadCount: ChatConversationStateUpdater<number>) => {
    this.unreadCount = typeof unreadCount === 'function' ? unreadCount(this.unreadCount) : unreadCount;
  };
}
