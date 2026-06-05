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
  toolCalls: Record<string, { id: string; invokeStatus: string }[]>;
};

export interface ChatToolCallActions {
  updateToolCallInvokeStatus: (messageId: string, toolCallId: string, invokeStatus: string) => void;
  isAllWaiting: (messageId: string) => boolean;
  isInterrupted: (messageId: string, toolCallId: string) => boolean;
  getInvokeStatus: (messageId: string, toolCallId: string) => string;
}
const store = create<ChatToolCallState & ChatToolCallActions>((set, get) => ({
  toolCalls: {},
  updateToolCallInvokeStatus: (messageId: string, toolCallId: string, invokeStatus: string) => {
    set((state) => {
      const list = state.toolCalls[messageId] ?? [];

      const exists = list.some((tc) => tc.id === toolCallId);

      const nextList = exists
        ? list.map((tc) => (tc.id === toolCallId ? { ...tc, invokeStatus } : tc))
        : [...list, { id: toolCallId, invokeStatus }];

      const result = {
        toolCalls: {
          ...state.toolCalls,
          [messageId]: nextList,
        },
      };

      return result;
    });
  },
  isAllWaiting: (messageId: string) => {
    const list = get().toolCalls[messageId];
    if (!list || list.length === 0) return false;

    return list.every((x) => x.invokeStatus === 'waiting');
  },
  isInterrupted: (messageId: string, toolCallId: string) => {
    const list = get().toolCalls[messageId] ?? [];
    const toolCall = list.find((x) => x.id === toolCallId);
    return toolCall?.invokeStatus === 'interrupted';
  },
  getInvokeStatus: (messageId: string, toolCallId: string) => {
    const list = get().toolCalls[messageId] ?? [];
    const toolCall = list.find((x) => x.id === toolCallId);
    return toolCall?.invokeStatus;
  },
}));

export const useChatToolCallStore = createSelectors(store);
