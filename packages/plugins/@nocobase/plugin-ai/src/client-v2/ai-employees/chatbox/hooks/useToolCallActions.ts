/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DecisionActions, ToolCall, useApp } from '@nocobase/client-v2';
import { useChatMessageActions } from './useChatMessageActions';
import { UserDecision } from '../../types';
import { type ChatBoxRuntime, useResolvedChatBoxRuntime } from '../stores/runtime';

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const useToolCallActions = ({ messageId, runtime }: { messageId: string; runtime?: ChatBoxRuntime }) => {
  const app = useApp();
  const api = app.apiClient;
  const resolvedRuntime = useResolvedChatBoxRuntime(runtime);
  const { chatBoxModel, chatConversationModel, chatToolCallModel } = resolvedRuntime;
  const sessionId = chatConversationModel.currentConversation;
  const { resumeToolCall } = useChatMessageActions(resolvedRuntime);

  const { toolsManager } = app.aiManager;
  const toolsMap = toolsManager.useTools();

  const updateUserDecision = async (toolCallId: string, userDecision: UserDecision) => {
    if (!sessionId) {
      throw new Error('sessionId is required to update tool call user decision');
    }

    if (!chatToolCallModel.isInterrupted(sessionId, messageId, toolCallId)) {
      const invokeStatus = chatToolCallModel.getInvokeStatus(sessionId, messageId, toolCallId);
      console.warn('tool call invokeStatus is not interrupted', {
        sessionId,
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

    chatToolCallModel.updateToolCallInvokeStatus(sessionId, messageId, toolCallId, 'waiting');
    if (!chatToolCallModel.isAllWaiting(sessionId, messageId)) {
      return;
    }

    const toolCallIds: string[] = [];
    const toolCallResults: { id: string; result: unknown }[] = [];
    for (const toolCall of res.data.toolCalls) {
      const t = toolsMap.get(toolCall.name);
      const decision = toolCall.userDecision as { type?: unknown } | undefined;
      if (t?.invoke && decision?.type !== 'reject') {
        try {
          const result = await t.invoke(app, toolCall.args);
          toolCallResults.push({
            id: toolCall.id,
            result,
          });
        } catch (error) {
          toolCallResults.push({
            id: toolCall.id,
            result: {
              status: 'error',
              content: getErrorMessage(error),
            },
          });
        }
      }
      toolCallIds.push(toolCall.id);
    }

    const aiEmployee = chatBoxModel.currentEmployee;
    if (!aiEmployee) {
      return;
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
