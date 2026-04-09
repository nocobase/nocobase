/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { create } from 'zustand';
import { WorkflowTask } from '../conversations/common';
import { createSelectors } from './create-selectors';

type WorkflowTasksState = {
  workflowTasks: WorkflowTask[];
  unreadCount: number;
  loading: boolean;
  keyword: string;
};

type WorkflowTasksActions = {
  setWorkflowTasks: (workflowTasks: WorkflowTask[] | ((prev: WorkflowTask[]) => WorkflowTask[])) => void;
  setUnreadCount: (unreadCount: number | ((prev: number) => number)) => void;
  setLoading: (loading: boolean) => void;
  setKeyword: (keyword: string) => void;
};

const store = create<WorkflowTasksState & WorkflowTasksActions>((set) => ({
  workflowTasks: [],
  unreadCount: 0,
  loading: false,
  keyword: '',

  setWorkflowTasks: (workflowTasks) =>
    set((state) => ({
      workflowTasks: typeof workflowTasks === 'function' ? workflowTasks(state.workflowTasks) : workflowTasks,
    })),

  setUnreadCount: (unreadCount) =>
    set((state) => ({
      unreadCount: typeof unreadCount === 'function' ? unreadCount(state.unreadCount) : unreadCount,
    })),

  setLoading: (loading) => set({ loading }),

  setKeyword: (keyword) => set({ keyword }),
}));

export const useWorkflowTasksStore = createSelectors(store);
