/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type WorkflowPlugin from '@nocobase/plugin-workflow';

type ID = number | string;

type RunningJavaScriptJob = {
  jobId: ID;
  executionId: ID;
  abort(reason?: unknown): void;
};

export const JAVASCRIPT_SYNC_MESSAGE_CHANNEL = '@nocobase/plugin-workflow-javascript';
export const ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE = 'abortJavaScriptJob';

export type AbortJavaScriptJobSyncMessage = {
  type: typeof ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE;
  jobId: ID;
  executionId: ID;
  reason?: string;
};

export function getAbortReason(reason: unknown): string | undefined {
  if (reason instanceof Error) {
    return reason.message;
  }
  if (typeof reason === 'string') {
    return reason;
  }
  return undefined;
}

export class RunningJobs {
  private readonly jobs = new Map<string, RunningJavaScriptJob>();
  private readonly executionJobs = new Map<string, Set<string>>();

  register(job: RunningJavaScriptJob) {
    const jobId = String(job.jobId);
    const executionId = String(job.executionId);
    const executionJobs = this.executionJobs.get(executionId) ?? new Set<string>();

    this.jobs.set(jobId, job);
    executionJobs.add(jobId);
    this.executionJobs.set(executionId, executionJobs);

    return () => this.unregister(job.jobId);
  }

  unregister(jobId: ID) {
    const key = String(jobId);
    const job = this.jobs.get(key);
    if (!job) {
      return;
    }

    this.jobs.delete(key);
    const executionId = String(job.executionId);
    const executionJobs = this.executionJobs.get(executionId);
    executionJobs?.delete(key);
    if (!executionJobs?.size) {
      this.executionJobs.delete(executionId);
    }
  }

  abortJob(jobId: ID, reason?: unknown) {
    const job = this.jobs.get(String(jobId));
    if (!job) {
      return false;
    }

    job.abort(reason);
    return true;
  }

  abortExecution(executionId: ID, reason?: unknown) {
    const jobIds = this.executionJobs.get(String(executionId));
    if (!jobIds?.size) {
      return false;
    }

    for (const jobId of jobIds) {
      this.jobs.get(jobId)?.abort(reason);
    }
    return true;
  }
  async abortAcrossInstances(workflowPlugin: WorkflowPlugin, message: AbortJavaScriptJobSyncMessage) {
    if (this.abortJob(message.jobId, message.reason)) {
      return true;
    }

    await workflowPlugin.app.syncMessageManager.publish(JAVASCRIPT_SYNC_MESSAGE_CHANNEL, message);
    return false;
  }
}
