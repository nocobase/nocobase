/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { action, define, observable } from '@nocobase/flow-engine';

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

type WorkflowTaskStateUpdater<T> = T | ((prev: T) => T);

export const JOB_STATUS = {
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

export const normalizeWorkflowTask = (workflowTask: WorkflowTask): WorkflowTask => {
  if (typeof workflowTask.jobStatus === 'number') {
    return workflowTask;
  }

  return {
    ...workflowTask,
    jobStatus: aiWorkflowTaskJobStatusMap[workflowTask.status] ?? JOB_STATUS.PENDING,
  };
};

export class WorkflowTaskModel {
  workflowTasks: WorkflowTask[] = observable.shallow([]);
  currentWorkflowTask: WorkflowTaskDetail | undefined = undefined;
  unreadCount = 0;
  loading = false;
  keyword = '';
  selectedJobStatus: number | undefined = undefined;

  constructor() {
    define(this, {
      workflowTasks: observable.shallow,
      currentWorkflowTask: observable.ref,
      unreadCount: observable.ref,
      loading: observable.ref,
      keyword: observable.ref,
      selectedJobStatus: observable.ref,
      setWorkflowTasks: action,
      setCurrentWorkflowTask: action,
      setUnreadCount: action,
      markWorkflowTaskRead: action,
      setLoading: action,
      setKeyword: action,
      setSelectedJobStatus: action,
    });
  }

  setWorkflowTasks = (workflowTasks: WorkflowTaskStateUpdater<WorkflowTask[]>) => {
    const nextWorkflowTasks = typeof workflowTasks === 'function' ? workflowTasks(this.workflowTasks) : workflowTasks;
    this.workflowTasks = nextWorkflowTasks.map(normalizeWorkflowTask);
  };

  setCurrentWorkflowTask = (
    currentWorkflowTask:
      | WorkflowTaskDetail
      | undefined
      | ((prev?: WorkflowTaskDetail) => WorkflowTaskDetail | undefined),
  ) => {
    this.currentWorkflowTask =
      typeof currentWorkflowTask === 'function' ? currentWorkflowTask(this.currentWorkflowTask) : currentWorkflowTask;
  };

  setUnreadCount = (unreadCount: WorkflowTaskStateUpdater<number>) => {
    this.unreadCount = typeof unreadCount === 'function' ? unreadCount(this.unreadCount) : unreadCount;
  };

  markWorkflowTaskRead = (sessionId: string) => {
    const target = this.workflowTasks.find((item) => item.sessionId === sessionId);
    if (!target || target.read) {
      return;
    }

    this.workflowTasks = this.workflowTasks.map((item) =>
      item.sessionId === sessionId
        ? {
            ...item,
            read: true,
          }
        : item,
    );
    this.unreadCount = Math.max(0, this.unreadCount - 1);
  };

  setLoading = (loading: boolean) => {
    this.loading = loading;
  };

  setKeyword = (keyword: string) => {
    this.keyword = keyword;
  };

  setSelectedJobStatus = (selectedJobStatus: number | undefined) => {
    this.selectedJobStatus = selectedJobStatus;
  };
}
