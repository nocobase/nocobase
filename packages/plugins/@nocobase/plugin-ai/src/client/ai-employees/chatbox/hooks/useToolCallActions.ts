/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DecisionActions, ToolCall, ToolsEntry, toToolsMap, useAPIClient, useApp } from '@nocobase/client';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatMessageActions } from './useChatMessageActions';
import { UserDecision } from '../../types';

export const useToolCallActions = ({ messageId, tools }: { messageId: string; tools: ToolsEntry[] }) => {
  const app = useApp();
  const api = useAPIClient();
  const sessionId = useChatConversationsStore.use.currentConversation();
  const aiEmployee = useChatBoxStore.use.currentEmployee();
  const { resumeToolCall } = useChatMessageActions();
  const toolsMap = toToolsMap(tools);

  const updateUserDecision = async (toolCallId: string, userDecision: UserDecision) => {
    const { data: res } = await api
      .resource('aiConversations')
      .updateUserDecision({ values: { sessionId, messageId, toolCallId, userDecision } });
    if (res.data?.allWaiting !== true) {
      return;
    }

    const toolCallIds: string[] = [];
    const toolCallResults = [];
    for (const toolCall of res.data.toolCalls) {
      const t = toolsMap.get(toolCall.name);
      if (t?.invoke) {
        const result = await t.invoke(app, toolCall.args);
        toolCallResults.push({
          id: toolCall.id,
          result,
        });
      }
      toolCallIds.push(toolCall.id);
    }

    await resumeToolCall({ sessionId, messageId, aiEmployee, toolCallIds, toolCallResults });
  };

  const getDecisionActions = (toolCall: ToolCall): DecisionActions => {
    const { id, name } = toolCall;
    return {
      approve: async () => {
        await updateUserDecision(id, {
          type: 'approve',
        });
      },
      edit: async (args: unknown) => {
        await updateUserDecision(id, {
          type: 'edit',
          editedAction: {
            name,
            args,
          },
        });
      },
      reject: async (message?: string) => {
        await updateUserDecision(id, {
          type: 'reject',
          message,
        });
      },
    };
  };

  return { getDecisionActions };
};
