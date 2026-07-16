/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App as AntdApp, Empty, Form, Input, Modal, Spin } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Conversations as AntConversations, type ConversationsProps } from '@ant-design/x';
import { useApp } from '@nocobase/client-v2';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import type { Conversation } from '../../../ai-employees/types';
import { type ModelRef } from '../../../ai-employees/chatbox/stores/chat-box';
import { useChat } from '../../../ai-employees/chatbox/hooks/useChat';
import { useChatBoxActions } from '../../../ai-employees/chatbox/hooks/useChatBoxActions';
import { useChatConversationActions } from '../../../ai-employees/chatbox/hooks/useChatConversationActions';
import { useChatMessageActions } from '../../../ai-employees/chatbox/hooks/useChatMessageActions';
import { useChatBoxRuntime } from '../../../ai-employees/chatbox/stores/runtime';
import type { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { getAIChatBoxScope } from '../utils';

type RenameTarget = {
  key: string;
  title: string;
} | null;

export const getAIChatBoxConversationModel = (conversation?: Conversation): ModelRef | null => {
  const modelSettings = conversation?.options?.modelSettings;
  if (!modelSettings?.llmService || !modelSettings.model) {
    return null;
  }
  return {
    llmService: modelSettings.llmService,
    model: modelSettings.model,
  };
};

export const getAIChatBoxConversationItems = (
  conversations: Conversation[],
  t: (key: string) => string,
): ConversationsProps['items'] => {
  return conversations.map((item) => {
    const title = item.title || t('New conversation');
    return {
      key: item.sessionId,
      title,
      label: title,
      timestamp: item.updatedAt ? new Date(item.updatedAt).getTime() : undefined,
    };
  });
};

export const Conversations: React.FC<{
  model: AIChatBoxBlockModel;
  onOpen?: () => void;
}> = observer(({ model, onOpen }) => {
  const t = useT();
  const app = useApp();
  const { modal, message } = AntdApp.useApp();
  const [form] = Form.useForm<{ title: string }>();
  const listRef = useRef<HTMLDivElement>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget>(null);
  const runtime = useChatBoxRuntime();
  const { chatBoxModel, chatConversationModel, workflowTaskModel } = runtime;
  const conversations = chatConversationModel.conversations;
  const currentConversation = chatConversationModel.currentConversation;
  const keyword = chatConversationModel.keyword;
  const scope = getAIChatBoxScope(model);
  const aiConfigRepository = useAIConfigRepository();
  const aiEmployeesMap = aiConfigRepository.getAIEmployeesMap();
  const { refresh, runSearch, conversationsService, lastConversationRef } = useChatConversationActions(runtime, {
    scope,
  });
  const { loadMessages, getConversationLLMActiveState, resumeStream } = useChatMessageActions(runtime);
  const { clear, startNewConversation } = useChatBoxActions(runtime);
  const chat = useChat(currentConversation, runtime);
  const latestOpenVersionRef = useRef(0);

  useEffect(() => {
    aiConfigRepository.getAIEmployees().catch(console.error);
  }, [aiConfigRepository]);

  useEffect(() => {
    refresh();
  }, [refresh, scope]);

  useEffect(() => {
    const lastItem = listRef.current?.querySelector('.ant-conversations-item:last-child');
    if (lastItem) {
      lastConversationRef(lastItem as HTMLElement);
    }
  }, [conversations.length, lastConversationRef]);

  useEffect(() => {
    if (renameTarget) {
      form.setFieldsValue({ title: renameTarget.title });
    } else {
      form.resetFields();
    }
  }, [form, renameTarget]);

  const hasActiveStream = useCallback(
    (sessionId: string) => {
      const sessionState = chat.for(sessionId).getState();
      return sessionState.responseLoading || !!sessionState.abortController;
    },
    [chat],
  );

  const resumeAfterLoad = useCallback(
    async (sessionId: string, username?: string) => {
      const openVersion = latestOpenVersionRef.current + 1;
      latestOpenVersionRef.current = openVersion;
      const aiEmployee = username ? aiEmployeesMap[username] : undefined;

      await loadMessages(sessionId);
      if (
        !aiEmployee ||
        hasActiveStream(sessionId) ||
        latestOpenVersionRef.current !== openVersion ||
        chatConversationModel.currentConversation !== sessionId
      ) {
        return;
      }

      const llmActiveState = await getConversationLLMActiveState(sessionId);
      if (
        hasActiveStream(sessionId) ||
        latestOpenVersionRef.current !== openVersion ||
        chatConversationModel.currentConversation !== sessionId ||
        llmActiveState !== 'streaming'
      ) {
        return;
      }

      await resumeStream({
        sessionId,
        aiEmployee,
      });
    },
    [aiEmployeesMap, chatConversationModel, getConversationLLMActiveState, hasActiveStream, loadMessages, resumeStream],
  );

  const openConversation = useCallback(
    (sessionId: string, username?: string, model?: ModelRef | null) => {
      if (sessionId === currentConversation) {
        onOpen?.();
        return;
      }

      const conversation = conversations.find((item) => item.sessionId === sessionId);
      const aiEmployee = username ? aiEmployeesMap[username] : conversation?.aiEmployee;
      const sessionChat = chat.for(sessionId);
      const sessionState = sessionChat.getState();
      const shouldReuseLocalSession = hasActiveStream(sessionId) && sessionState.messages.length > 0;

      workflowTaskModel.setCurrentWorkflowTask(undefined);
      chatBoxModel.setReadonly(false);
      chatConversationModel.setCurrentConversation(sessionId);
      chatBoxModel.setCurrentEmployee(aiEmployee);
      chatBoxModel.setModel(model ?? getAIChatBoxConversationModel(conversation));

      if (shouldReuseLocalSession) {
        clear(
          {
            systemMessage: false,
            attachments: false,
            contextItems: false,
            skillSettings: false,
          },
          sessionId,
        );
      } else {
        sessionChat.setMessages([]);
        clear(undefined, sessionId);
        resumeAfterLoad(sessionId, aiEmployee?.username).catch(console.error);
      }
      onOpen?.();
    },
    [
      aiEmployeesMap,
      chat,
      chatBoxModel,
      chatConversationModel,
      clear,
      conversations,
      currentConversation,
      hasActiveStream,
      onOpen,
      resumeAfterLoad,
      workflowTaskModel,
    ],
  );

  const deleteConversation = useCallback(
    async (sessionId: string) => {
      await app.apiClient.resource('aiConversations').destroy({
        filterByTk: sessionId,
      });
      message.success(t('Deleted successfully'));
      refresh();
      startNewConversation();
    },
    [app.apiClient, message, refresh, startNewConversation, t],
  );

  const openDeleteConfirm = useCallback(
    (sessionId: string) => {
      modal.confirm({
        title: t('Delete conversation'),
        content: t('Are you sure you want to delete it?'),
        onOk: () => deleteConversation(sessionId),
      });
    },
    [deleteConversation, modal, t],
  );

  const submitRename = async () => {
    if (!renameTarget) {
      return;
    }
    const values = await form.validateFields();
    await app.apiClient.resource('aiConversations').update({
      filterByTk: renameTarget.key,
      values: {
        title: values.title,
      },
    });
    setRenameTarget(null);
    refresh();
  };

  const items = useMemo(() => getAIChatBoxConversationItems(conversations, t), [conversations, t]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '8px 12px', flexShrink: 0 }}>
        <Input.Search
          value={keyword}
          onChange={(event) => {
            chatConversationModel.setKeyword(event.target.value);
          }}
          placeholder={t('Search')}
          onSearch={runSearch}
          onClear={() => {
            runSearch('');
          }}
          allowClear
        />
      </div>
      <div ref={listRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        {conversationsService.loading ? <Spin style={{ display: 'block', margin: '8px auto' }} /> : null}
        {items.length ? (
          <AntConversations
            className="ai-chatbox-block-conversations-list"
            activeKey={currentConversation}
            items={items}
            onActiveChange={(sessionId) => {
              const conversation = conversations.find((item) => item.sessionId === sessionId);
              openConversation(
                sessionId,
                conversation?.aiEmployee?.username,
                getAIChatBoxConversationModel(conversation),
              );
            }}
            menu={(conversation) => ({
              items: [
                {
                  label: t('Rename'),
                  key: 'rename',
                  icon: <EditOutlined />,
                },
                {
                  label: t('Delete'),
                  key: 'delete',
                  icon: <DeleteOutlined />,
                },
              ],
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                if (key === 'rename') {
                  setRenameTarget({
                    key: conversation.key,
                    title: String(conversation.title || conversation.label || ''),
                  });
                }
                if (key === 'delete') {
                  openDeleteConfirm(conversation.key);
                }
              },
            })}
          />
        ) : null}
        {!items.length && !conversationsService.loading ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null}
      </div>
      <Modal
        title={t('Rename conversation')}
        open={!!renameTarget}
        forceRender
        onCancel={() => {
          setRenameTarget(null);
        }}
        onOk={() => {
          submitRename().catch(console.error);
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label={t('Title')} rules={[{ required: true, message: t('defaults.form.required') }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});
