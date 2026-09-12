/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { action, define, observable } from '@nocobase/flow-engine';
import type { Message, ToolCall } from '../../types';

type ChatToolsState = {
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
  adjustArgs?: Record<string, unknown>;
};

export class ChatToolModel {
  toolsByName: ChatToolsState['toolsByName'] = observable.shallow({});
  toolsByMessageId: ChatToolsState['toolsByMessageId'] = observable.shallow({});

  openToolModal = false;
  activeTool: ToolCall<unknown> | null | undefined = null;
  activeMessageId = '';
  adjustArgs: Record<string, unknown> = observable.shallow({});

  constructor() {
    define(this, {
      toolsByName: observable.shallow,
      toolsByMessageId: observable.shallow,
      openToolModal: observable.ref,
      activeTool: observable.ref,
      activeMessageId: observable.ref,
      adjustArgs: observable.shallow,
      updateTools: action,
      setOpenToolModal: action,
      setActiveTool: action,
      setActiveMessageId: action,
      setAdjustArgs: action,
    });
  }

  updateTools = (messages: Message[]) => {
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

    this.toolsByName = toolsByName;
    this.toolsByMessageId = toolsByMessageId;
  };

  setOpenToolModal = (open: boolean) => {
    this.openToolModal = open;
  };

  setActiveTool = (tool: ToolCall<unknown> | null | undefined) => {
    this.activeTool = tool;
  };

  setActiveMessageId = (messageId: string) => {
    this.activeMessageId = messageId;
  };

  setAdjustArgs = (args: Record<string, unknown>) => {
    this.adjustArgs = args;
  };
}
