/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App as AntdApp, Badge, Empty, Form, Input, Modal, Segmented, Space, Spin } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Conversations as AntConversations, type ConversationsProps } from '@ant-design/x';
import { useApp } from '@nocobase/client-v2';
import { useT } from '../../../locale';
import type { Conversation } from '../../types';
import { useChat } from '../hooks/useChat';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useChatConversationActions } from '../hooks/useChatConversationActions';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import { useWorkflowTasks } from '../hooks/useWorkflowTasks';
import { useChatBoxStore, type ModelRef } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useWorkflowTasksStore } from '../stores/workflow-tasks';
import type { WorkflowTask } from '../stores/workflow-tasks';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';

type RenameTarget = {
  key: string;
  title: string;
} | null;

export const Conversations: React.FC = memo(() => {
  const t = useT();
  const app = useApp();
  const { modal, message } = AntdApp.useApp();
  const [form] = Form.useForm<{ title: string }>();
  const listRef = useRef<HTMLDivElement>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget>(null);
  const aiConfigRepository = useAIConfigRepository();
  const aiEmployeesMap = aiConfigRepository.getAIEmployeesMap();
  const conversations = useChatConversationsStore.use.conversations();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const conversationSegmented = useChatConversationsStore.use.conversationSegmented();
  const setConversationSegmented = useChatConversationsStore.use.setConversationSegmented();
  const keyword = useChatConversationsStore.use.keyword();
  const setKeyword = useChatConversationsStore.use.setKeyword();
  const setCurrentConversation = useChatConversationsStore.use.setCurrentConversation();
  const setCurrentEmployee = useChatBoxStore.use.setCurrentEmployee();
  const setReadonly = useChatBoxStore.use.setReadonly();
  const setShowConversations = useChatBoxStore.use.setShowConversations();
  const setModel = useChatBoxStore.use.setModel();
  const expanded = useChatBoxStore.use.expanded();
  const setCurrentWorkflowTask = useWorkflowTasksStore.use.setCurrentWorkflowTask();
  const {
    refresh,
    runSearch: runSearchConversations,
    conversationsService,
    lastConversationRef,
    unreadCount: unreadConversationCount,
  } = useChatConversationActions();
  const {
    refresh: refreshWorkflowTasks,
    runSearch: runSearchWorkflowTasks,
    workflowTasks,
    loading: workflowTasksLoading,
    unreadCount: unreadWorkflowTaskCount,
    acceptWorkflowTask,
    getWorkflowTaskBySession,
  } = useWorkflowTasks();
  const { loadMessages, getConversationLLMActiveState, resumeStream } = useChatMessageActions();
  const { startNewConversation, clear } = useChatBoxActions();
  const chat = useChat(currentConversation);
  const latestOpenVersionRef = useRef(0);

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
        useChatConversationsStore.getState().currentConversation !== sessionId
      ) {
        return;
      }

      const llmActiveState = await getConversationLLMActiveState(sessionId);
      if (
        hasActiveStream(sessionId) ||
        latestOpenVersionRef.current !== openVersion ||
        useChatConversationsStore.getState().currentConversation !== sessionId ||
        llmActiveState !== 'streaming'
      ) {
        return;
      }

      await resumeStream({
        sessionId,
        aiEmployee,
      });
    },
    [aiEmployeesMap, getConversationLLMActiveState, hasActiveStream, loadMessages, resumeStream],
  );

  useEffect(() => {
    aiConfigRepository.getAIEmployees().catch(console.error);
  }, [aiConfigRepository]);

  useEffect(() => {
    if (conversationSegmented === 'conversations') {
      refresh();
    } else {
      refreshWorkflowTasks();
    }
  }, [conversationSegmented, refresh, refreshWorkflowTasks]);

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

  const openConversation = useCallback(
    (sessionId: string, username?: string, model?: ModelRef) => {
      if (sessionId === currentConversation) {
        setShowConversations(false);
        return;
      }

      const conversation = conversations.find((item) => item.sessionId === sessionId);
      setCurrentConversation(sessionId);
      const aiEmployee = username ? aiEmployeesMap[username] : conversation?.aiEmployee;
      if (username) {
        setCurrentEmployee(aiEmployee);
      } else {
        setCurrentEmployee(conversation?.aiEmployee);
      }
      const sessionChat = chat.for(sessionId);
      const sessionState = sessionChat.getState();
      const shouldReuseLocalSession = hasActiveStream(sessionId) && sessionState.messages.length > 0;
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
      }
      setModel(model ?? (conversation ? getConversationModel(conversation) : null));
      if (!shouldReuseLocalSession) {
        resumeAfterLoad(sessionId, aiEmployee?.username).catch(console.error);
      }
      if (!expanded) {
        setShowConversations(false);
      }
    },
    [
      aiEmployeesMap,
      chat,
      clear,
      conversations,
      currentConversation,
      expanded,
      hasActiveStream,
      resumeAfterLoad,
      setCurrentConversation,
      setCurrentEmployee,
      setModel,
      setShowConversations,
    ],
  );

  const openWorkflowTask = useCallback(
    async (sessionId: string) => {
      await acceptWorkflowTask(sessionId);
      const task = await getWorkflowTaskBySession(sessionId);
      setReadonly(task?.readonly === true);
      chat.for(sessionId).setResponseLoading(task?.status === 'processing');
      setShowConversations(false);
      openConversation(sessionId, task?.config?.username, task?.config?.model ?? undefined);
    },
    [acceptWorkflowTask, chat, getWorkflowTaskBySession, openConversation, setReadonly, setShowConversations],
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

  const items = useMemo<ConversationsProps['items']>(
    () =>
      conversations.map((item) => {
        const title = item.title || t('New conversation');
        return {
          key: item.sessionId,
          title,
          label: title,
          icon: !item.read ? <Badge dot offset={[-3, 0]} /> : undefined,
          timestamp: item.updatedAt ? new Date(item.updatedAt).getTime() : undefined,
        };
      }),
    [conversations, t],
  );

  const workflowItems = useMemo<ConversationsProps['items']>(
    () =>
      workflowTasks.map((item) => {
        const title = item.workflowTitle || item.nodeTitle || item.sessionId;
        return {
          key: item.sessionId,
          title,
          label: item.nodeTitle ? `${title} / ${item.nodeTitle}` : title,
          icon: !item.read ? <Badge dot offset={[-3, 0]} /> : undefined,
          timestamp:
            item.updatedAt || item.createdAt ? new Date(item.updatedAt || item.createdAt).getTime() : undefined,
        };
      }),
    [workflowTasks],
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          flexShrink: 0,
        }}
      >
        <style>
          {`
.ai-chatbox-conversations-segmented .ant-segmented-item,
.ai-chatbox-conversations-segmented .ant-segmented-item-selected {
  width: 100%;
  justify-content: center;
}
.ai-chatbox-conversations-list .ant-conversations-item .ant-conversations-label {
  display: block !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  max-width: calc(100% - 30px);
}
`}
        </style>
        <Input.Search
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
          }}
          placeholder={t('Search')}
          onSearch={(value) => {
            if (conversationSegmented === 'conversations') {
              runSearchConversations(value);
            } else {
              runSearchWorkflowTasks(value);
            }
          }}
          onClear={() => {
            if (conversationSegmented === 'conversations') {
              runSearchConversations('');
            } else {
              runSearchWorkflowTasks('');
            }
          }}
          allowClear
        />
        <Segmented
          style={{ width: '100%', marginTop: 8 }}
          className="ai-chatbox-conversations-segmented"
          options={[
            {
              label: (
                <Space>
                  {t('Conversations')}
                  <Badge count={unreadConversationCount} size="small" />
                </Space>
              ),
              value: 'conversations',
            },
            {
              label: (
                <Space>
                  {t('Workflow tasks')}
                  <Badge count={unreadWorkflowTaskCount} size="small" />
                </Space>
              ),
              value: 'workflowTasks',
            },
          ]}
          value={conversationSegmented}
          onChange={(value) => {
            setConversationSegmented(String(value));
          }}
        />
      </div>
      <div
        ref={listRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {conversationSegmented === 'conversations' && conversationsService.loading ? <Spin /> : null}
        {conversationSegmented === 'workflowTasks' && workflowTasksLoading ? <Spin /> : null}
        {conversationSegmented === 'conversations' && items.length ? (
          <AntConversations
            className="ai-chatbox-conversations-list"
            activeKey={currentConversation}
            items={items}
            onActiveChange={(sessionId) => {
              setReadonly(false);
              setCurrentWorkflowTask(undefined);
              const conversation = conversations.find((item) => item.sessionId === sessionId);
              openConversation(sessionId, conversation?.aiEmployee?.username, getConversationModel(conversation));
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
        {conversationSegmented === 'workflowTasks' && workflowItems.length ? (
          <WorkflowTasksConversationsList
            activeKey={currentConversation}
            items={workflowItems}
            workflowTasks={workflowTasks}
            onOpen={openWorkflowTask}
          />
        ) : null}
        {conversationSegmented === 'conversations' && !items.length ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : null}
        {conversationSegmented === 'workflowTasks' && !workflowItems.length ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : null}
      </div>
      <Modal
        title={t('Rename conversation')}
        open={!!renameTarget}
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

function getConversationModel(conversation: Conversation): ModelRef | null {
  const modelSettings = conversation.options?.modelSettings;
  if (!modelSettings?.llmService || !modelSettings.model) {
    return null;
  }
  return {
    llmService: modelSettings.llmService,
    model: modelSettings.model,
  };
}

const WorkflowTasksConversationsList: React.FC<{
  activeKey?: string;
  items: ConversationsProps['items'];
  workflowTasks: WorkflowTask[];
  onOpen: (sessionId: string) => Promise<void>;
}> = ({ activeKey, items, workflowTasks, onOpen }) => {
  const sessionIds = useMemo(() => new Set(workflowTasks.map((item) => item.sessionId)), [workflowTasks]);
  return (
    <AntConversations
      activeKey={activeKey}
      items={items}
      onActiveChange={(sessionId) => {
        if (sessionIds.has(sessionId)) {
          onOpen(sessionId).catch(console.error);
        }
      }}
    />
  );
};
