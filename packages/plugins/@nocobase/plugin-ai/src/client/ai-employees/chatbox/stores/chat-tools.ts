/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { create } from 'zustand';
import { Message, ToolCall } from '../../types';
import { createSelectors } from './create-selectors';

interface ChatToolsState {
  toolsByName: Record<string, ToolCall<unknown>[]>;
  toolsByMessageId: Record<
    string,
    Record<
      string,
      {
        version: number;
      }
    >
  >;
}

interface ChatToolsActions {
  updateTools: (messages: Message[]) => void;
}

const store = create<ChatToolsState & ChatToolsActions>((set) => ({
  toolsByName: {},
  toolsByMessageId: {},

  updateTools: (messages) => {
    const toolsByName: Record<string, ToolCall<unknown>[]> = {};
    const toolsByMessageId: Record<string, Record<string, { version: number }>> = {};

    for (const msg of messages) {
      const toolCalls = msg.content?.tool_calls || [];
      const messageId = msg.content?.messageId;

      for (const tool of toolCalls) {
        if (!toolsByName[tool.name]) {
          toolsByName[tool.name] = [];
        }
        toolsByName[tool.name].push(tool);
        const version = toolsByName[tool.name].length;

        if (!messageId) {
          continue;
        }
        if (!toolsByMessageId[messageId]) {
          toolsByMessageId[messageId] = {};
        }
        toolsByMessageId[messageId][tool.id] = {
          version,
        };
      }
    }

    set({ toolsByName, toolsByMessageId });
  },
}));

export const useChatToolsStore = createSelectors(store);
