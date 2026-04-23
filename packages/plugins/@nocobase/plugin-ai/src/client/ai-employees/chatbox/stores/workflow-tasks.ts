/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { create } from 'zustand';
import { WorkflowTask, WorkflowTaskDetail } from '../conversations/common';
import { createSelectors } from './create-selectors';

type WorkflowTasksState = {
  workflowTasks: WorkflowTask[];
  currentWorkflowTask?: WorkflowTaskDetail;
  unreadCount: number;
  loading: boolean;
  keyword: string;
  selectedJobStatus?: number;
};

type WorkflowTasksActions = {
  setWorkflowTasks: (workflowTasks: WorkflowTask[] | ((prev: WorkflowTask[]) => WorkflowTask[])) => void;
  setCurrentWorkflowTask: (
    workflowTask: WorkflowTaskDetail | undefined | ((prev?: WorkflowTaskDetail) => WorkflowTaskDetail | undefined),
  ) => void;
  setUnreadCount: (unreadCount: number | ((prev: number) => number)) => void;
  setLoading: (loading: boolean) => void;
  setKeyword: (keyword: string) => void;
  setSelectedJobStatus: (selectedJobStatus: number | undefined) => void;
};

const store = create<WorkflowTasksState & WorkflowTasksActions>((set) => ({
  workflowTasks: [],
  currentWorkflowTask: undefined,
  unreadCount: 0,
  loading: false,
  keyword: '',
  selectedJobStatus: undefined,

  setWorkflowTasks: (workflowTasks) =>
    set((state) => ({
      workflowTasks: typeof workflowTasks === 'function' ? workflowTasks(state.workflowTasks) : workflowTasks,
    })),

  setCurrentWorkflowTask: (currentWorkflowTask) =>
    set((state) => ({
      currentWorkflowTask:
        typeof currentWorkflowTask === 'function'
          ? currentWorkflowTask(state.currentWorkflowTask)
          : currentWorkflowTask,
    })),

  setUnreadCount: (unreadCount) =>
    set((state) => ({
      unreadCount: typeof unreadCount === 'function' ? unreadCount(state.unreadCount) : unreadCount,
    })),

  setLoading: (loading) => set({ loading }),

  setKeyword: (keyword) => set({ keyword }),

  setSelectedJobStatus: (selectedJobStatus) => set({ selectedJobStatus }),
}));

export const useWorkflowTasksStore = createSelectors(store);
