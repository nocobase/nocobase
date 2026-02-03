/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Message } from '../../types';
import { create } from 'zustand';
import { createSelectors } from './create-selectors';

type ChatToolCallState = {
  toolCalls: Record<string, { id: string; name: string; invokeStatus: string }[]>;
};

export interface ChatToolCallActions {
  updateByMessages: (messages: Message[]) => void;
  updateToolCallWaiting: (messageId: string, toolCallId: string) => void;
  isAllWaiting: (messageId: string) => boolean;
}
const store = create<ChatToolCallState & ChatToolCallActions>((set, get) => ({
  toolCalls: {},
  updateByMessages: (messages: Message[]) => {
    const toolCalls = {};
    for (const message of messages) {
      if ((message.content?.tool_calls ?? []).length === 0) {
        continue;
      }
      if (!message.content?.messageId) {
        continue;
      }
      toolCalls[message.content.messageId] = message.content.tool_calls.map((x) => ({
        id: x.id,
        name: x.name,
        invokeStatus: x.invokeStatus,
      }));
    }
    set({ toolCalls });
  },
  updateToolCallWaiting: (messageId: string, toolCallId: string) => {
    set((state) => {
      const list = state.toolCalls[messageId];
      if (!list) return state;

      return {
        toolCalls: {
          ...state.toolCalls,
          [messageId]: list.map((tc) => (tc.id === toolCallId ? { ...tc, invokeStatus: 'waiting' } : tc)),
        },
      };
    });
  },
  isAllWaiting: (messageId: string) => {
    const list = get().toolCalls[messageId];
    if (!list || list.length === 0) return false;

    return list.every((x) => x.invokeStatus === 'waiting');
  },
}));

export const useChatToolCallStore = createSelectors(store);
