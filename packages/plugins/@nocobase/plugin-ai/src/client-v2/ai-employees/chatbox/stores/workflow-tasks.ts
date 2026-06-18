/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createObservableStore, createSelectors } from './create-selectors';
import { getOrCreateGlobalStore } from './global-store';

export type WorkflowTask = {
  id: string;
  sessionId: string;
  executionId?: number | string;
  workflowTitle: string;
  nodeTitle: string;
  status: string;
  jobStatus?: number;
  read?: boolean;
  config?: {
    username?: string;
    [key: string]: unknown;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkflowTaskOutputSchema = {
  title?: string;
  type?: string;
  properties?: Record<string, WorkflowTaskOutputSchema>;
};

export type WorkflowTaskDetail = WorkflowTask & {
  readonly?: boolean;
  structuredOutputSchema?: WorkflowTaskOutputSchema | string | null;
  config?: {
    username?: string;
    model?: {
      llmService: string;
      model: string;
    } | null;
    [key: string]: unknown;
  } | null;
};

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
  markWorkflowTaskRead: (sessionId: string) => void;
  setLoading: (loading: boolean) => void;
  setKeyword: (keyword: string) => void;
  setSelectedJobStatus: (selectedJobStatus: number | undefined) => void;
};

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

const aiWorkflowTaskJobStatusMap: Record<string, number> = {
  processing: JOB_STATUS.PENDING,
  pending_acceptance: JOB_STATUS.PENDING,
  pending_approval: JOB_STATUS.PENDING,
  approved: JOB_STATUS.RESOLVED,
  failed: JOB_STATUS.FAILED,
  error: JOB_STATUS.ERROR,
  canceled: JOB_STATUS.CANCELED,
  rejected: JOB_STATUS.REJECTED,
  aborted: JOB_STATUS.ABORTED,
  retry_needed: JOB_STATUS.RETRY_NEEDED,
};

const normalizeWorkflowTask = (workflowTask: WorkflowTask): WorkflowTask => {
  if (typeof workflowTask.jobStatus === 'number') {
    return workflowTask;
  }

  return {
    ...workflowTask,
    jobStatus: aiWorkflowTaskJobStatusMap[workflowTask.status] ?? JOB_STATUS.PENDING,
  };
};

const store = getOrCreateGlobalStore('@nocobase/plugin-ai/workflow-tasks-store', () =>
  createObservableStore<WorkflowTasksState & WorkflowTasksActions>((set) => ({
    workflowTasks: [],
    currentWorkflowTask: undefined,
    unreadCount: 0,
    loading: false,
    keyword: '',
    selectedJobStatus: undefined,

    setWorkflowTasks: (workflowTasks) =>
      set((state) => {
        const nextWorkflowTasks =
          typeof workflowTasks === 'function' ? workflowTasks(state.workflowTasks) : workflowTasks;
        return {
          workflowTasks: nextWorkflowTasks.map(normalizeWorkflowTask),
        };
      }),

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

    markWorkflowTaskRead: (sessionId) =>
      set((state) => {
        const target = state.workflowTasks.find((item) => item.sessionId === sessionId);
        if (!target || target.read) {
          return {
            workflowTasks: state.workflowTasks,
            unreadCount: state.unreadCount,
          };
        }
        return {
          workflowTasks: state.workflowTasks.map((item) =>
            item.sessionId === sessionId
              ? {
                  ...item,
                  read: true,
                }
              : item,
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }),

    setLoading: (loading) => set({ loading }),

    setKeyword: (keyword) => set({ keyword }),

    setSelectedJobStatus: (selectedJobStatus) => set({ selectedJobStatus }),
  })),
);

export const useWorkflowTasksStore = createSelectors(store);
