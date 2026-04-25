/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useRef } from 'react';
import { useAPIClient, useRequest } from '@nocobase/client';
import { useWorkflowTasksStore } from '../stores/workflow-tasks';
import { WorkflowTask, WorkflowTaskDetail } from '../conversations/common';
import { useLoadMoreObserver } from './useLoadMoreObserver';
import { useChatBoxStore } from '../stores/chat-box';

export const useWorkflowTasks = () => {
  const api = useAPIClient();
  const workflowTasksResource = api.resource('aiWorkflowTasks');

  const workflowTasks = useWorkflowTasksStore.use.workflowTasks();
  const currentWorkflowTask = useWorkflowTasksStore.use.currentWorkflowTask();
  const unreadCount = useWorkflowTasksStore.use.unreadCount();
  const loading = useWorkflowTasksStore.use.loading();
  const keyword = useWorkflowTasksStore.use.keyword();

  const setWorkflowTasks = useWorkflowTasksStore.use.setWorkflowTasks();
  const setCurrentWorkflowTask = useWorkflowTasksStore.use.setCurrentWorkflowTask();
  const setUnreadCount = useWorkflowTasksStore.use.setUnreadCount();
  const setLoading = useWorkflowTasksStore.use.setLoading();
  const setKeyword = useWorkflowTasksStore.use.setKeyword();

  const workflowTasksService = useRequest<{ data: WorkflowTask[]; meta?: { page?: number; totalPage?: number } }>(
    async (page = 1, search = '') => {
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
          page,
          pageSize: 15,
          filter,
        });
        return res?.data;
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    {
      manual: true,
      onSuccess: (data, params) => {
        const page = params[0] || 1;
        const nextData = data?.data || [];

        if (page === 1) {
          setWorkflowTasks(nextData);
          return;
        }

        setWorkflowTasks((prev) => {
          const prevSessionIds = new Set(prev.map((item) => item.sessionId));
          const appended = nextData.filter((item) => !prevSessionIds.has(item.sessionId));
          return [...prev, ...appended];
        });
      },
    },
  );

  const unreadWorkflowTaskCountService = useRequest<{ count: number }>(
    async () => {
      const res = await workflowTasksResource.unreadCount();
      setUnreadCount(res?.data?.data?.count || 0);
    },
    {
      manual: true,
    },
  );

  const runSearch = useCallback(
    (nextKeyword = '') => {
      setKeyword(nextKeyword);
      workflowTasksService.run(1, nextKeyword);
    },
    [setKeyword, workflowTasksService],
  );

  const refresh = useCallback(() => {
    workflowTasksService.run(1, keyword || '');
    unreadWorkflowTaskCountService.run();
  }, [keyword, unreadWorkflowTaskCountService, workflowTasksService]);

  const workflowTasksServiceRef = useRef(workflowTasksService);
  workflowTasksServiceRef.current = workflowTasksService;

  const loadMoreWorkflowTasks = useCallback(async () => {
    const currentWorkflowTasksService = workflowTasksServiceRef.current;
    const meta = currentWorkflowTasksService.data?.meta;

    if (currentWorkflowTasksService.loading || (meta && meta.page >= meta.totalPage)) {
      return;
    }

    await currentWorkflowTasksService.runAsync(meta?.page ? meta.page + 1 : 1, keyword || '');
  }, [keyword]);

  const { ref: lastWorkflowTaskRef } = useLoadMoreObserver({ loadMore: loadMoreWorkflowTasks });
  const hasMore =
    workflowTasksService.data?.meta?.page && workflowTasksService.data?.meta?.totalPage
      ? workflowTasksService.data.meta.page < workflowTasksService.data.meta.totalPage
      : false;

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
      const task = (res?.data?.data ?? res?.data) as WorkflowTaskDetail | undefined;
      setCurrentWorkflowTask(task);
      return task;
    },
    [setCurrentWorkflowTask, workflowTasksResource],
  );

  const setReadonly = useChatBoxStore.use.setReadonly();
  const updateReadonly = useCallback(
    async (sessionId: string) => {
      await acceptWorkflowTask(sessionId);
      const task = await getWorkflowTaskBySession(sessionId);
      setReadonly(task?.readonly === true);
    },
    [acceptWorkflowTask, getWorkflowTaskBySession, setReadonly],
  );

  return {
    loading,
    workflowTasks,
    unreadCount,
    runSearch,
    refresh,
    hasMore,
    loadMoreWorkflowTasks,
    lastWorkflowTaskRef,
    acceptWorkflowTask,
    getWorkflowTaskBySession,
    updateReadonly,
    currentWorkflowTask,
    setCurrentWorkflowTask,
  };
};
