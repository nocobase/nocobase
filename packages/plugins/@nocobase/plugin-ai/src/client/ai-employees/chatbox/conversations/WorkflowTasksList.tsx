/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useRef } from 'react';
import { Badge, Card, List, Spin, Tag, theme } from 'antd';
import { useAPIClient, useRequest } from '@nocobase/client';
import { ListEmpty, WorkflowTask } from './common';

type UseWorkflowTasksListOptions = {
  onOpenConversation: (sessionId: string, username?: string) => void;
};

const getStatusTagColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending_approval':
    case 'pending_acceptance':
      return 'warning';
    case 'processing':
      return 'processing';
    default:
      return 'default';
  }
};

export const useWorkflowTasksList = ({ onOpenConversation }: UseWorkflowTasksListOptions) => {
  const api = useAPIClient();
  const keywordRef = useRef('');

  const workflowTasksService = useRequest<{ data: WorkflowTask[] }>(
    async (search = '') => {
      const filter: any = {};
      if (search) {
        filter.$or = [
          { workflowTitle: { $includes: search } },
          { nodeTitle: { $includes: search } },
          { status: { $includes: search } },
        ];
      }

      const res = await api.resource('aiWorkflowTasks').list({
        sort: ['-updatedAt'],
        pageSize: 50,
        filter,
      });
      return res?.data;
    },
    {
      manual: false,
    },
  );

  const unreadWorkflowTaskCountService = useRequest<{ count: number }>(
    async () => {
      const res = await api.resource('aiWorkflowTasks').unreadCount();
      return res?.data?.data ?? res?.data;
    },
    {
      manual: false,
    },
  );

  const onSelectWorkflowTask = useCallback(
    async (sessionId: string) => {
      await api
        .resource('aiWorkflowTasks')
        .accept({
          values: {
            sessionId,
          },
        })
        .catch(() => undefined);

      let username: string | undefined;
      try {
        const res = await api.resource('aiWorkflowTasks').getBySession({
          values: {
            sessionId,
          },
        });
        username = res?.data?.data?.config?.username ?? res?.data?.config?.username;
      } catch {
        username = undefined;
      }

      unreadWorkflowTaskCountService.run();
      workflowTasksService.run(keywordRef.current || '');
      onOpenConversation(sessionId, username);
    },
    [api, onOpenConversation, unreadWorkflowTaskCountService, workflowTasksService],
  );

  const runSearch = useCallback(
    (keyword = '') => {
      keywordRef.current = keyword;
      workflowTasksService.run(keyword);
    },
    [workflowTasksService],
  );

  const refresh = useCallback(() => {
    workflowTasksService.run(keywordRef.current || '');
    unreadWorkflowTaskCountService.run();
  }, [workflowTasksService, unreadWorkflowTaskCountService]);

  return {
    loading: workflowTasksService.loading,
    workflowTasks: workflowTasksService.data?.data || [],
    unreadCount: unreadWorkflowTaskCountService.data?.count || 0,
    onSelectWorkflowTask,
    runSearch,
    refresh,
  };
};

export type WorkflowTasksListController = ReturnType<typeof useWorkflowTasksList>;

export const WorkflowTasksList: React.FC<{ controller: WorkflowTasksListController }> = ({ controller }) => {
  const { token } = theme.useToken();

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
      renderItem={(item) => (
        <List.Item key={item.sessionId} style={{ padding: '0 0 8px' }}>
          <Card
            size="small"
            hoverable
            onClick={() => controller.onSelectWorkflowTask(item.sessionId)}
            style={{ width: '100%', backgroundColor: token.colorBgContainer }}
            styles={{ body: { padding: '10px 12px' } }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {!item.read ? (
                  <Badge dot>
                    <span style={{ width: 8, height: 8, display: 'inline-block' }} />
                  </Badge>
                ) : null}
                <div
                  style={{
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.workflowTitle}
                </div>
              </div>
              <Tag color={getStatusTagColor(item.status)} style={{ marginInlineEnd: 0 }}>
                {item.status}
              </Tag>
            </div>
            <div
              style={{
                marginTop: 6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 12,
                color: 'rgba(0, 0, 0, 0.45)',
              }}
            >
              {item.nodeTitle}
            </div>
          </Card>
        </List.Item>
      )}
    />
  );
};
