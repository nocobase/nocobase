/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Typography, theme } from 'antd';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { Messages } from '../../../ai-employees/chatbox/components/Messages';
import { Sender } from '../../../ai-employees/chatbox/components/Sender';
import { useChat } from '../../../ai-employees/chatbox/hooks/useChat';
import { useChatBoxActions } from '../../../ai-employees/chatbox/hooks/useChatBoxActions';
import { useChatBoxEffect } from '../../../ai-employees/chatbox/hooks/useChatBoxEffect';
import { useChatBoxRuntime } from '../../../ai-employees/chatbox/stores/runtime';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { getAIChatBoxCreateScope, getAIChatBoxSettings, normalizeAIChatBoxWorkContext } from '../utils';

export const MessagesAndSender: React.FC<{
  model: AIChatBoxBlockModel;
}> = observer(({ model }) => {
  const t = useT();
  const { token } = theme.useToken();
  const runtime = useChatBoxRuntime();
  const { chatBoxModel, chatConversationModel } = runtime;
  const aiConfigRepository = useAIConfigRepository();
  const { switchAIEmployee } = useChatBoxActions(runtime);
  const settings = getAIChatBoxSettings(model.props);
  const conversationCreateScope = getAIChatBoxCreateScope(model);
  const selectedBlocks = model.props.selectedBlocks;
  const configuredWorkContext = useMemo(() => normalizeAIChatBoxWorkContext(selectedBlocks), [selectedBlocks]);
  const configuredWorkContextKey = configuredWorkContext
    .map((item) => `${item.type}:${item.uid}:${item.title || ''}`)
    .join('|');
  const allowedAIEmployees = settings.allowedAIEmployees;
  const currentEmployee = chatBoxModel.currentEmployee;
  const currentConversation = chatConversationModel.currentConversation;
  const draftChat = useChat(undefined, runtime);
  const draftMessages = draftChat.use.messages();
  const draftMessageKey = draftMessages.map((message) => message.key).join('|');
  const hasDraftUserMessage = draftMessages.some((message) => message.role === 'user');
  const defaultUserMessageStateRef = useRef<{
    draftKey?: string;
    value?: string;
    applied?: boolean;
  }>({});
  useChatBoxEffect(runtime);

  useEffect(() => {
    if (currentEmployee && (!allowedAIEmployees.length || allowedAIEmployees.includes(currentEmployee.username))) {
      return;
    }
    aiConfigRepository
      .getAIEmployees()
      .then((employees) => {
        const availableEmployees = allowedAIEmployees.length
          ? employees.filter((employee) => allowedAIEmployees.includes(employee.username))
          : employees;
        const targetEmployee =
          availableEmployees.find((employee) => employee.username === 'atlas') || availableEmployees[0];
        if (targetEmployee && chatBoxModel.currentEmployee?.username !== targetEmployee.username) {
          switchAIEmployee(targetEmployee, {
            clear: {
              sender: false,
              attachments: false,
              contextItems: false,
            },
          });
        }
      })
      .catch(console.error);
  }, [aiConfigRepository, allowedAIEmployees, chatBoxModel, currentEmployee, switchAIEmployee]);

  useEffect(() => {
    if (currentConversation || hasDraftUserMessage || !configuredWorkContext.length) {
      return;
    }
    draftChat.setContextItems((items) => {
      const map = new Map<string, (typeof configuredWorkContext)[number]>();
      for (const item of items) {
        map.set(`${item.type}:${item.uid}`, item);
      }
      for (const item of configuredWorkContext) {
        map.set(`${item.type}:${item.uid}`, item);
      }
      return Array.from(map.values());
    });
  }, [
    currentConversation,
    configuredWorkContext,
    configuredWorkContextKey,
    draftChat,
    draftMessageKey,
    hasDraftUserMessage,
  ]);

  useEffect(() => {
    const defaultUserMessage = settings.defaultUserMessage;
    if (currentConversation || hasDraftUserMessage || !defaultUserMessage) {
      defaultUserMessageStateRef.current = {};
      return;
    }

    const draftKey = draftMessageKey || 'draft';
    const state = defaultUserMessageStateRef.current;
    const senderValue = chatBoxModel.senderValue;
    const isNewDefaultState = state.draftKey !== draftKey || state.value !== defaultUserMessage;
    if (isNewDefaultState) {
      const shouldApply = !senderValue || senderValue === state.value;
      defaultUserMessageStateRef.current = {
        draftKey,
        value: defaultUserMessage,
        applied: shouldApply,
      };
      if (shouldApply) {
        chatBoxModel.setSenderValue(defaultUserMessage);
      }
      return;
    }

    if (!state.applied && !senderValue) {
      chatBoxModel.setSenderValue(defaultUserMessage);
      defaultUserMessageStateRef.current = {
        ...state,
        applied: true,
      };
    }
  }, [chatBoxModel, currentConversation, draftMessageKey, hasDraftUserMessage, settings.defaultUserMessage]);

  return (
    <div
      style={{
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      {settings.showMessages ? (
        <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Messages />
        </div>
      ) : null}
      <div
        style={{
          backgroundColor: 'transparent',
          padding: 0,
          flex: '0 0 auto',
          position: 'relative',
        }}
      >
        <Sender
          containerStyle={{ margin: '8px 0', minWidth: 0 }}
          placeholder={settings.senderPlaceholder}
          showContextSelector={settings.showContextSelector}
          showUpload={settings.showUpload}
          showWebSearch={settings.showWebSearch}
          showEmployeeSelect={settings.showEmployeeSelect}
          showModelSelect={settings.showModelSelect}
          sendContextItems
          allowedAIEmployees={settings.allowedAIEmployees}
          allowedModels={settings.allowedModels}
          scope={conversationCreateScope}
          defaultSystemMessage={settings.systemPrompt}
          defaultUserMessage={settings.defaultUserMessage}
        />
        {settings.showDisclaimer ? (
          <Typography.Text
            type="secondary"
            style={{
              display: 'block',
              textAlign: 'center',
              margin: 0,
              fontSize: token.fontSizeSM,
              color: token.colorTextTertiary,
            }}
          >
            {t('AI disclaimer')}
          </Typography.Text>
        ) : null}
      </div>
    </div>
  );
});
