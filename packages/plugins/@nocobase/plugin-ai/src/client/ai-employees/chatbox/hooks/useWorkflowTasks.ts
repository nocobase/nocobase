/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback } from 'react';
import { useAPIClient, useRequest } from '@nocobase/client';
import { useWorkflowTasksStore } from '../stores/workflow-tasks';
import { WorkflowTask } from '../conversations/common';

export const useWorkflowTasks = () => {
  const api = useAPIClient();
  const workflowTasksResource = api.resource('aiWorkflowTasks');

  const workflowTasks = useWorkflowTasksStore.use.workflowTasks();
  const unreadCount = useWorkflowTasksStore.use.unreadCount();
  const loading = useWorkflowTasksStore.use.loading();
  const keyword = useWorkflowTasksStore.use.keyword();

  const setWorkflowTasks = useWorkflowTasksStore.use.setWorkflowTasks();
  const setUnreadCount = useWorkflowTasksStore.use.setUnreadCount();
  const setLoading = useWorkflowTasksStore.use.setLoading();
  const setKeyword = useWorkflowTasksStore.use.setKeyword();

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

      try {
        setLoading(true);
        const res = await workflowTasksResource.list({
          sort: ['-updatedAt'],
          pageSize: 50,
          filter,
        });
        setWorkflowTasks(res?.data?.data || []);
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    {
      manual: false,
    },
  );

  const unreadWorkflowTaskCountService = useRequest<{ count: number }>(
    async () => {
      const res = await workflowTasksResource.unreadCount();
      setUnreadCount(res?.data?.data?.count || 0);
    },
    {
      manual: false,
    },
  );

  const runSearch = useCallback(
    (nextKeyword = '') => {
      setKeyword(nextKeyword);
      workflowTasksService.run(nextKeyword);
    },
    [setKeyword, workflowTasksService],
  );

  const refresh = useCallback(() => {
    workflowTasksService.run(keyword || '');
    unreadWorkflowTaskCountService.run();
  }, [keyword, unreadWorkflowTaskCountService, workflowTasksService]);

  const acceptWorkflowTask = useCallback(
    async (sessionId: string) => {
      await workflowTasksResource
        .accept({
          values: {
            sessionId,
          },
        })
        .catch(() => undefined);
    },
    [workflowTasksResource],
  );

  const getWorkflowTaskBySession = useCallback(
    async (sessionId: string) => {
      const res = await workflowTasksResource.getBySession({
        values: {
          sessionId,
        },
      });

      return res?.data?.data ?? res?.data;
    },
    [workflowTasksResource],
  );

  return {
    loading,
    workflowTasks,
    unreadCount,
    runSearch,
    refresh,
    acceptWorkflowTask,
    getWorkflowTaskBySession,
  };
};
