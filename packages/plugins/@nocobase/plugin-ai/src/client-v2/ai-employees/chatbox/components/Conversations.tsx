/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  App as AntdApp,
  Badge,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  theme,
} from 'antd';
import { DeleteOutlined, EditOutlined, FilterOutlined } from '@ant-design/icons';
import { Conversations as AntConversations, type ConversationsProps } from '@ant-design/x';
import { useApp } from '@nocobase/client-v2';
import { dayjs } from '@nocobase/utils/client';
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
  const [pendingWorkflowTask, setPendingWorkflowTask] = useState<string>();
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
    runJobStatusFilter,
    workflowTasks,
    loading: workflowTasksLoading,
    selectedJobStatus,
    hasMore,
    loadMoreWorkflowTasks,
    lastWorkflowTaskRef,
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

  useEffect(() => {
    if (pendingWorkflowTask && pendingWorkflowTask === currentConversation) {
      setPendingWorkflowTask(undefined);
    }
  }, [currentConversation, pendingWorkflowTask]);

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
      setPendingWorkflowTask(sessionId);
      try {
        await acceptWorkflowTask(sessionId);
        const task = await getWorkflowTaskBySession(sessionId);
        setReadonly(task?.readonly === true);
        chat.for(sessionId).setResponseLoading(task?.status === 'processing');
        setShowConversations(false);
        openConversation(sessionId, task?.config?.username, task?.config?.model ?? undefined);
      } catch (error) {
        setPendingWorkflowTask(undefined);
        throw error;
      }
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
        {conversationSegmented === 'workflowTasks' ? (
          <WorkflowTasksList
            currentConversation={currentConversation}
            pendingConversation={pendingWorkflowTask}
            workflowTasks={workflowTasks}
            loading={workflowTasksLoading}
            selectedJobStatus={selectedJobStatus}
            hasMore={hasMore}
            onJobStatusFilter={runJobStatusFilter}
            onLoadMore={loadMoreWorkflowTasks}
            lastWorkflowTaskRef={lastWorkflowTaskRef}
            onOpen={openWorkflowTask}
          />
        ) : null}
        {conversationSegmented === 'conversations' && !items.length ? (
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

const JOB_STATUS = {
  PENDING: 0,
  RESOLVED: 1,
  FAILED: -1,
  ERROR: -2,
  ABORTED: -3,
  CANCELED: -4,
  REJECTED: -5,
  RETRY_NEEDED: -6,
} as const;

const JOB_STATUS_OPTIONS = [
  {
    value: JOB_STATUS.PENDING,
    label: 'Pending',
    color: 'gold',
  },
  {
    value: JOB_STATUS.RESOLVED,
    label: 'Resolved',
    color: 'green',
  },
  {
    value: JOB_STATUS.FAILED,
    label: 'Failed',
    color: 'red',
  },
  {
    value: JOB_STATUS.ERROR,
    label: 'Error',
    color: 'red',
  },
  {
    value: JOB_STATUS.ABORTED,
    label: 'Aborted',
    color: 'red',
  },
  {
    value: JOB_STATUS.CANCELED,
    label: 'Canceled',
    color: 'volcano',
  },
  {
    value: JOB_STATUS.REJECTED,
    label: 'Rejected',
    color: 'volcano',
  },
  {
    value: JOB_STATUS.RETRY_NEEDED,
    label: 'Retry needed',
    color: 'volcano',
  },
];

const WORKFLOW_TASK_FILTER_STATUS_OPTIONS = [
  JOB_STATUS.PENDING,
  JOB_STATUS.RESOLVED,
  JOB_STATUS.REJECTED,
  JOB_STATUS.ABORTED,
];

const JOB_STATUS_OPTIONS_MAP = JOB_STATUS_OPTIONS.reduce<Record<number, (typeof JOB_STATUS_OPTIONS)[number]>>(
  (map, option) => ({
    ...map,
    [option.value]: option,
  }),
  {},
);

const WorkflowTasksList: React.FC<{
  currentConversation?: string;
  pendingConversation?: string;
  workflowTasks: WorkflowTask[];
  loading: boolean;
  selectedJobStatus?: number;
  hasMore: boolean;
  onJobStatusFilter: (jobStatus?: number) => void;
  onLoadMore: () => Promise<void>;
  lastWorkflowTaskRef: (node?: Element | null) => void;
  onOpen: (sessionId: string) => Promise<void>;
}> = ({
  currentConversation,
  pendingConversation,
  workflowTasks,
  loading,
  selectedJobStatus,
  hasMore,
  onJobStatusFilter,
  onLoadMore,
  lastWorkflowTaskRef,
  onOpen,
}) => {
  const t = useT();
  const { token } = theme.useToken();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = containerRef.current?.parentElement;
    if (!scrollContainer) {
      return;
    }

    const onScroll = () => {
      if (loading || !hasMore) {
        return;
      }

      const threshold = token.controlHeight;
      const distanceToBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;

      if (distanceToBottom <= threshold) {
        onLoadMore().catch(console.error);
      }
    };

    scrollContainer.addEventListener('scroll', onScroll);

    return () => {
      scrollContainer.removeEventListener('scroll', onScroll);
    };
  }, [hasMore, loading, onLoadMore, token.controlHeight]);

  if (loading && !workflowTasks.length) {
    return (
      <Spin
        style={{
          display: 'block',
          margin: `${token.margin}px auto`,
        }}
      />
    );
  }

  return (
    <div ref={containerRef} style={{ padding: `${token.paddingXS}px ${token.paddingSM}px ${token.paddingSM}px` }}>
      <Select
        prefix={<FilterOutlined />}
        allowClear
        value={selectedJobStatus}
        onChange={onJobStatusFilter}
        style={{ width: '100%', marginBottom: token.marginXS }}
        placeholder={t('Filter by status')}
        options={WORKFLOW_TASK_FILTER_STATUS_OPTIONS.map((status) => JOB_STATUS_OPTIONS_MAP[status])
          .filter(Boolean)
          .map((option) => ({
            value: option.value,
            label: t(option.label),
            color: option.color,
          }))}
        optionRender={(option) => <Tag color={option.data.color}>{option.label}</Tag>}
        labelRender={(props) => {
          const option = JOB_STATUS_OPTIONS_MAP[props.value as number];
          return <Tag color={option?.color}>{props.label}</Tag>;
        }}
      />
      {!workflowTasks.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={workflowTasks}
          split={false}
          footer={
            loading && workflowTasks.length ? (
              <div style={{ textAlign: 'center', padding: `${token.paddingXS}px 0 ${token.paddingXXS}px` }}>
                <Spin size="small" />
              </div>
            ) : null
          }
          renderItem={(item) => {
            const selected = item.sessionId === (pendingConversation ?? currentConversation);
            const isLastItem = workflowTasks[workflowTasks.length - 1]?.sessionId === item.sessionId;
            const jobStatusOption =
              typeof item.jobStatus !== 'undefined' ? JOB_STATUS_OPTIONS_MAP[item.jobStatus] : null;
            const createdAtText = item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss') : null;
            const executionIdText =
              item.executionId !== null && typeof item.executionId !== 'undefined' ? `#${item.executionId}` : null;

            return (
              <List.Item key={item.sessionId} style={{ padding: `0 0 ${token.paddingXS}px` }}>
                <div ref={isLastItem ? lastWorkflowTaskRef : undefined} style={{ width: '100%' }}>
                  <Card
                    type="inner"
                    title={
                      <Space>
                        {!item.read ? <Badge status="error" /> : null}
                        <Typography.Text strong ellipsis style={{ flex: 1, minWidth: 0 }}>
                          {item.workflowTitle}
                        </Typography.Text>
                      </Space>
                    }
                    extra={
                      <Tag color={jobStatusOption?.color ?? 'default'}>
                        {jobStatusOption?.label ? t(jobStatusOption.label) : '-'}
                      </Tag>
                    }
                    size="small"
                    hoverable
                    onClick={() => onOpen(item.sessionId).catch(console.error)}
                    style={{
                      width: '100%',
                      backgroundColor: selected ? token.colorPrimaryBg : token.colorBgContainer,
                      borderColor: selected ? token.colorPrimary : token.colorBorderSecondary,
                      boxShadow: selected ? `0 0 0 ${token.lineWidth}px ${token.colorPrimaryBorder}` : undefined,
                    }}
                    styles={{ body: { padding: `${token.paddingXS}px ${token.paddingSM}px` } }}
                  >
                    <Flex vertical gap={token.marginXXS}>
                      <Typography.Text ellipsis>{item.nodeTitle}</Typography.Text>
                      <Space direction="vertical" size={token.marginXXS}>
                        {createdAtText ? <Typography.Text type="secondary">{createdAtText}</Typography.Text> : null}
                        {executionIdText ? <Typography.Text type="secondary">{executionIdText}</Typography.Text> : null}
                      </Space>
                    </Flex>
                  </Card>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
};
