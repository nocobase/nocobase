/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Card, Flex, List, Select, Space, Spin, Tag, Typography, theme } from 'antd';
import { useCompile } from '@nocobase/client';
import { dayjs } from '@nocobase/utils/client';
import { ListEmpty } from './common';
import { useWorkflowTasks } from '../hooks/useWorkflowTasks';
import { ModelRef, useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { JOB_STATUS, JobStatusOptionsMap } from '@nocobase/plugin-workflow/client';
import { useChatMessagesStore } from '../stores/chat-messages';
import { FilterOutlined } from '@ant-design/icons';

type UseWorkflowTasksListOptions = {
  onOpenConversation: (sessionId: string, username?: string, model?: ModelRef) => void;
};

export const useWorkflowTasksList = ({ onOpenConversation }: UseWorkflowTasksListOptions) => {
  const {
    loading,
    workflowTasks,
    unreadCount,
    selectedJobStatus,
    runSearch,
    runJobStatusFilter,
    refresh,
    hasMore,
    loadMoreWorkflowTasks,
    lastWorkflowTaskRef,
    acceptWorkflowTask,
    getWorkflowTaskBySession,
  } = useWorkflowTasks();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const setReadonly = useChatBoxStore.use.setReadonly();
  const setResponseLoading = useChatMessagesStore.use.setResponseLoading();
  const [pendingConversation, setPendingConversation] = useState<string>();

  useEffect(() => {
    if (pendingConversation && pendingConversation === currentConversation) {
      setPendingConversation(undefined);
    }
  }, [currentConversation, pendingConversation]);

  const onSelectWorkflowTask = useCallback(
    async (sessionId: string) => {
      setPendingConversation(sessionId);
      try {
        await acceptWorkflowTask(sessionId);

        let username: string | undefined;
        let model: ModelRef | undefined;
        let readonly = false;
        let responseLoading = false;
        try {
          const task = await getWorkflowTaskBySession(sessionId);
          username = task?.config?.username;
          model = task?.config?.model;
          readonly = task?.readonly === true;
          responseLoading = task?.status === 'processing';
        } catch {
          username = undefined;
          model = undefined;
        }
        setReadonly(readonly);
        setResponseLoading(responseLoading);
        onOpenConversation(sessionId, username, model);
      } catch (error) {
        setPendingConversation(undefined);
        throw error;
      }
    },
    [acceptWorkflowTask, getWorkflowTaskBySession, onOpenConversation, setReadonly, setResponseLoading],
  );

  return {
    currentConversation,
    selectedConversation: pendingConversation ?? currentConversation,
    loading,
    workflowTasks,
    unreadCount,
    selectedJobStatus,
    onSelectWorkflowTask,
    runSearch,
    runJobStatusFilter,
    refresh,
    hasMore,
    loadMoreWorkflowTasks,
    lastWorkflowTaskRef,
  };
};

export type WorkflowTasksListController = ReturnType<typeof useWorkflowTasksList>;

export const WorkflowTasksList: React.FC<{ controller: WorkflowTasksListController }> = ({ controller }) => {
  const { token } = theme.useToken();
  const compile = useCompile();
  const containerRef = useRef<HTMLDivElement>(null);

  const jobStatusOptions = [JOB_STATUS.PENDING, JOB_STATUS.RESOLVED, JOB_STATUS.REJECTED, JOB_STATUS.ABORTED]
    .map((status) => JobStatusOptionsMap[status])
    .filter(Boolean);

  useEffect(() => {
    const scrollContainer = containerRef.current?.parentElement;
    if (!scrollContainer) {
      return;
    }

    const onScroll = () => {
      if (controller.loading || !controller.hasMore) {
        return;
      }

      const threshold = 24;
      const distanceToBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;

      if (distanceToBottom <= threshold) {
        controller.loadMoreWorkflowTasks();
      }
    };

    scrollContainer.addEventListener('scroll', onScroll);
    onScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', onScroll);
    };
  }, [controller]);

  if (controller.loading && !controller.workflowTasks.length) {
    return (
      <Spin
        style={{
          display: 'block',
          margin: '16px auto',
        }}
      />
    );
  }

  return (
    <div ref={containerRef} style={{ padding: '10px 12px 12px' }}>
      <Select
        prefix={<FilterOutlined />}
        allowClear
        value={controller.selectedJobStatus}
        onChange={controller.runJobStatusFilter}
        style={{ width: '100%', marginBottom: '10px' }}
        placeholder={compile('{{t("Filter by status")}}')}
        options={jobStatusOptions.map((option) => ({
          value: option.value,
          label: compile(option.label),
          color: option.color,
        }))}
        optionRender={(option) => <Tag color={option.data.color}>{option.label}</Tag>}
        labelRender={(props) => {
          const option = JobStatusOptionsMap[props.value as number];
          return <Tag color={option?.color}>{props.label}</Tag>;
        }}
      />
      {!controller.workflowTasks.length ? (
        <ListEmpty />
      ) : (
        <List
          dataSource={controller.workflowTasks}
          split={false}
          footer={
            controller.loading && controller.workflowTasks.length ? (
              <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                <Spin size="small" />
              </div>
            ) : null
          }
          renderItem={(item) => {
            const selected = item.sessionId === controller.selectedConversation;
            const isLastItem =
              controller.workflowTasks[controller.workflowTasks.length - 1]?.sessionId === item.sessionId;
            const jobStatusOption = typeof item.jobStatus !== 'undefined' ? JobStatusOptionsMap[item.jobStatus] : null;
            const createdAtText = item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss') : null;
            const executionIdText =
              item.executionId !== null && typeof item.executionId !== 'undefined' ? `#${item.executionId}` : null;

            return (
              <List.Item key={item.sessionId} style={{ padding: '0 0 8px' }}>
                <div ref={isLastItem ? controller.lastWorkflowTaskRef : undefined} style={{ width: '100%' }}>
                  <Card
                    type="inner"
                    title={
                      <Space>
                        {!item.read && <Badge status="error" />}
                        <Typography.Text strong ellipsis style={{ flex: 1, minWidth: 0 }}>
                          {item.workflowTitle}
                        </Typography.Text>
                      </Space>
                    }
                    extra={
                      <Tag color={jobStatusOption?.color ?? 'default'}>
                        {jobStatusOption?.label ? compile(jobStatusOption.label) : '-'}
                      </Tag>
                    }
                    size="small"
                    hoverable
                    onClick={() => controller.onSelectWorkflowTask(item.sessionId)}
                    style={{
                      width: '100%',
                      backgroundColor: selected ? token.colorPrimaryBg : token.colorBgContainer,
                      borderColor: selected ? token.colorPrimary : token.colorBorderSecondary,
                      boxShadow: selected ? `0 0 0 1px ${token.colorPrimaryBorder}` : undefined,
                    }}
                    styles={{ body: { padding: '10px 12px' } }}
                  >
                    <Flex vertical gap={6}>
                      <Typography.Text ellipsis>{item.nodeTitle}</Typography.Text>
                      <Space direction="vertical">
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
