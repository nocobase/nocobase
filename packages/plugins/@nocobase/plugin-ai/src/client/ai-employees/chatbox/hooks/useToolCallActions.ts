/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DecisionActions, ToolCall, useAPIClient, useApp } from '@nocobase/client';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatMessageActions } from './useChatMessageActions';
import { UserDecision } from '../../types';
import { useChatToolCallStore } from '../stores/chat-tool-call';

export const useToolCallActions = ({ messageId }: { messageId: string }) => {
  const app = useApp();
  const api = useAPIClient();
  const sessionId = useChatConversationsStore.use.currentConversation();
  const aiEmployee = useChatBoxStore.use.currentEmployee();
  const updateToolCallInvokeStatus = useChatToolCallStore.use.updateToolCallInvokeStatus();
  const getInvokeStatus = useChatToolCallStore.use.getInvokeStatus();
  const isAllWaiting = useChatToolCallStore.use.isAllWaiting();
  const isInterrupted = useChatToolCallStore.use.isInterrupted();
  const { resumeToolCall } = useChatMessageActions();

  const { toolsManager } = app.aiManager;
  const toolsMap = toolsManager.useTools();

  const updateUserDecision = async (toolCallId: string, userDecision: UserDecision) => {
    if (!isInterrupted(messageId, toolCallId)) {
      const invokeStatus = getInvokeStatus(messageId, toolCallId);
      console.warn('tool call invokeStatus is not interrupted', {
        messageId,
        toolCallId,
        invokeStatus,
      });
      return;
    }

    const { data: res } = await api
      .resource('aiConversations')
      .updateUserDecision({ values: { sessionId, messageId, toolCallId, userDecision } });
    if (res.data.updated === 0) {
      return;
    }

    updateToolCallInvokeStatus(messageId, toolCallId, 'waiting');
    if (!isAllWaiting(messageId)) {
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
