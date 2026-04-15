/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { Badge, Card, Flex, List, Space, Spin, Tag, Typography, theme } from 'antd';
import { useCompile } from '@nocobase/client';
import { dayjs } from '@nocobase/utils/client';
import { ListEmpty } from './common';
import { useWorkflowTasks } from '../hooks/useWorkflowTasks';
import { ModelRef, useChatBoxStore } from '../stores/chat-box';
import { JobStatusOptionsMap } from '@nocobase/plugin-workflow/client';

type UseWorkflowTasksListOptions = {
  onOpenConversation: (sessionId: string, username?: string, model?: ModelRef) => void;
};

export const useWorkflowTasksList = ({ onOpenConversation }: UseWorkflowTasksListOptions) => {
  const { loading, workflowTasks, unreadCount, runSearch, refresh, acceptWorkflowTask, getWorkflowTaskBySession } =
    useWorkflowTasks();
  const setReadonly = useChatBoxStore.use.setReadonly();

  const onSelectWorkflowTask = useCallback(
    async (sessionId: string) => {
      await acceptWorkflowTask(sessionId);

      let username: string | undefined;
      let model: ModelRef | undefined;
      let readonly = false;
      try {
        const task = await getWorkflowTaskBySession(sessionId);
        username = task?.config?.username;
        model = task?.config?.model;
        readonly = task?.readonly === true;
      } catch {
        username = undefined;
        model = undefined;
      }

      refresh();
      setReadonly(readonly);
      onOpenConversation(sessionId, username, model);
    },
    [acceptWorkflowTask, getWorkflowTaskBySession, onOpenConversation, refresh, setReadonly],
  );

  return {
    loading,
    workflowTasks,
    unreadCount,
    onSelectWorkflowTask,
    runSearch,
    refresh,
  };
};

export type WorkflowTasksListController = ReturnType<typeof useWorkflowTasksList>;

export const WorkflowTasksList: React.FC<{ controller: WorkflowTasksListController }> = ({ controller }) => {
  const { token } = theme.useToken();
  const compile = useCompile();

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

  if (!controller.workflowTasks.length) {
    return <ListEmpty />;
  }
  return (
    <List
      dataSource={controller.workflowTasks}
      split={false}
      style={{ padding: '10px 12px 12px' }}
      renderItem={(item) => {
        const jobStatusOption = typeof item.jobStatus !== 'undefined' ? JobStatusOptionsMap[item.jobStatus] : null;
        const createdAtText = item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss') : null;
        const executionIdText =
          item.executionId !== null && typeof item.executionId !== 'undefined' ? `#${item.executionId}` : null;

        return (
          <List.Item key={item.sessionId} style={{ padding: '0 0 8px' }}>
            <Card
              type="inner"
              title={
                <Space>
                  {!item.read && <Badge status="error" />}
                  <Typography.Text strong ellipsis>
                    {executionIdText}
                  </Typography.Text>
                </Space>
              }
              extra={
                <Tag color={jobStatusOption?.color ?? 'default'} icon={jobStatusOption?.icon}>
                  {jobStatusOption?.label ? compile(jobStatusOption.label) : '-'}
                </Tag>
              }
              size="small"
              hoverable
              onClick={() => controller.onSelectWorkflowTask(item.sessionId)}
              style={{ width: '100%', backgroundColor: token.colorBgContainer }}
              styles={{ body: { padding: '10px 12px' } }}
            >
              <Flex vertical gap={6}>
                <Flex align="flex-start" justify="space-between" gap={token.marginXS}>
                  <Flex align="center" gap={token.marginXS} style={{ minWidth: 0, flex: 1 }}>
                    <Typography.Text strong ellipsis style={{ flex: 1, minWidth: 0 }}>
                      {item.workflowTitle}
                    </Typography.Text>
                  </Flex>
                </Flex>
                <Typography.Text type="secondary" ellipsis>
                  {item.nodeTitle}
                </Typography.Text>
                {createdAtText ? <Typography.Text type="secondary">{createdAtText}</Typography.Text> : null}
              </Flex>
            </Card>
          </List.Item>
        );
      }}
    />
  );
};
