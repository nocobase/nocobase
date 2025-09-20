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
  toolsByName: Record<
    string,
    (ToolCall<unknown> & {
      messageId?: string;
    })[]
  >;
  toolsByMessageId: Record<
    string,
    Record<
      string,
      ToolCall<unknown> & {
        version: number;
      }
    >
  >;

  openToolModal?: boolean;
  activeTool?: ToolCall<unknown>;
  activeMessageId?: string;
  adjustArgs?: Record<string, any>;
}

interface ChatToolsActions {
  updateTools: (messages: Message[]) => void;
  setOpenToolModal: (open: boolean) => void;
  setActiveTool: (tool: ToolCall<unknown>) => void;
  setActiveMessageId: (messageId: string) => void;
  setAdjustArgs: (args: Record<string, any>) => void;
}

const store = create<ChatToolsState & ChatToolsActions>((set) => ({
  toolsByName: {},
  toolsByMessageId: {},
  openToolModal: false,
  activeTool: null,
  activeMessageId: '',
  adjustArgs: {},

  updateTools: (messages) => {
    const toolsByName: ChatToolsState['toolsByName'] = {};
    const toolsByMessageId: ChatToolsState['toolsByMessageId'] = {};

    for (const msg of messages) {
      const toolCalls = msg.content?.tool_calls || [];
      const messageId = msg.content?.messageId;

      for (const tool of toolCalls) {
        if (!toolsByName[tool.name]) {
          toolsByName[tool.name] = [];
        }
        toolsByName[tool.name].push({
          ...tool,
          messageId,
        });
        const version = toolsByName[tool.name].length;

        if (!messageId) {
          continue;
        }
        if (!toolsByMessageId[messageId]) {
          toolsByMessageId[messageId] = {};
        }
        toolsByMessageId[messageId][tool.id] = {
          ...tool,
          version,
        };
      }
    }

    set({ toolsByName, toolsByMessageId });
  },

  setOpenToolModal: (open) => set({ openToolModal: open }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveMessageId: (messageId) => set({ activeMessageId: messageId }),
  setAdjustArgs: (args) => set({ adjustArgs: args }),
}));

export const useChatToolsStore = createSelectors(store);
