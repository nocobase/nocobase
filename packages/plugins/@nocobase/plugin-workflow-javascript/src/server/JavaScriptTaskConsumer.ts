/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Model } from '@nocobase/database';
import type WorkflowPlugin from '@nocobase/plugin-workflow';
import { EXECUTION_STATUS, JOB_STATUS, WorkflowTimeoutError, isWorkflowTimeoutError } from '@nocobase/plugin-workflow';
import type { QueueEventOptions } from '@nocobase/server';

import { getJavaScriptProcessLimiter } from './JavaScriptProcessLimiter';
import {
  getJavaScriptQueueMaxWait,
  JavaScriptJobMeta,
  JavaScriptJobSnapshot,
  JavaScriptQueueTaskMessage,
} from './JavaScriptTaskQueue';
import { ScriptWorkerRunner } from './ScriptWorkerRunner';

type ID = number | string;

type WorkflowJob = Model & {
  id: ID;
  executionId: ID;
  nodeId: ID;
  nodeKey: string;
  status: number;
  result?: unknown;
  meta?: JavaScriptJobMeta | null;
  startedAt?: Date | null;
  createdAt?: Date;
  set(values: { status?: number; result?: unknown; startedAt?: Date | null }): void;
  reload(): Promise<WorkflowJob>;
  getExecution(): Promise<WorkflowExecution | null>;
};

type WorkflowExecution = {
  id: ID;
  workflowId: ID;
  status: number;
  expiresAt?: Date | null;
};

function isTaskMessage(message: unknown): message is JavaScriptQueueTaskMessage {
  return typeof message === 'object' && message !== null && 'jobId' in message;
}

function isJavaScriptJobSnapshot(value: unknown): value is JavaScriptJobSnapshot {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    value.version === 1 &&
    'content' in value &&
    typeof value.content === 'string' &&
    'args' in value
  );
}

function getJavaScriptSnapshot(job: WorkflowJob) {
  const snapshot = job.meta?.javascript;
  return isJavaScriptJobSnapshot(snapshot) ? snapshot : null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function stringifyResult(result: unknown) {
  if (typeof result === 'string') {
    return result;
  }

  try {
    return JSON.stringify(result);
  } catch (error) {
    return String(result);
  }
}

function createExecutionAbortController(workflowPlugin: WorkflowPlugin, execution: WorkflowExecution) {
  const controller = new AbortController();
  let timeoutGuard: NodeJS.Timeout | null = null;

  const abort = (reason?: unknown) => {
    if (!controller.signal.aborted) {
      controller.abort(isWorkflowTimeoutError(reason) ? reason : new WorkflowTimeoutError());
    }
  };

  const remaining = execution.expiresAt ? execution.expiresAt.getTime() - Date.now() : null;
  if (remaining != null) {
    if (remaining <= 0) {
      abort();
    } else {
      timeoutGuard = setTimeout(abort, remaining);
    }
  }

  workflowPlugin.registerRunningExecution(execution.id, abort);

  return {
    signal: controller.signal,
    dispose: () => {
      if (timeoutGuard) {
        clearTimeout(timeoutGuard);
        timeoutGuard = null;
      }
      workflowPlugin.unregisterRunningExecution(execution.id);
    },
  };
}

export class JavaScriptTaskConsumer {
  private ready = false;
  private closing = false;
  private readonly processing = new Set<Promise<void>>();

  constructor(private readonly workflowPlugin: WorkflowPlugin) {}

  setReady(ready: boolean) {
    this.ready = ready;
  }

  idle() {
    return this.ready && !this.closing && this.workflowPlugin.serving() && getJavaScriptProcessLimiter().hasCapacity();
  }

  async beforeStop() {
    this.closing = true;
    await Promise.allSettled(Array.from(this.processing));
  }

  readonly process: QueueEventOptions['process'] = async (message) => {
    if (!isTaskMessage(message)) {
      this.workflowPlugin.getLogger('javascript').warn('invalid JavaScript queue job message ignored', { message });
      return;
    }

    const processing = getJavaScriptProcessLimiter().run(async () => {
      await this.processWithPermit(message.jobId);
    });
    this.processing.add(processing);
    try {
      await processing;
    } finally {
      this.processing.delete(processing);
    }
  };

  private async processWithPermit(jobId: ID) {
    if (this.closing) {
      return;
    }

    const claimed = await this.claimJob(jobId);
    if (!claimed) {
      return;
    }

    const { job, snapshot } = claimed;
    const execution = await job.getExecution();
    const logger = this.workflowPlugin.getLogger(execution?.workflowId ?? 'javascript');
    const queueWaitMs = job.startedAt && job.createdAt ? job.startedAt.getTime() - job.createdAt.getTime() : 0;

    logger.info(`JavaScript job (${job.id}) claimed for node (${job.nodeId})`, {
      executionId: job.executionId,
      jobId: job.id,
      nodeId: job.nodeId,
      queueWaitMs,
      active: getJavaScriptProcessLimiter().getActiveCount(),
      queued: getJavaScriptProcessLimiter().getQueuedCount(),
    });

    if (!execution || execution.status !== EXECUTION_STATUS.STARTED) {
      await this.finishClaimedJob(job, {
        status: JOB_STATUS.ABORTED,
        result: `Execution (${job.executionId}) is not running`,
      });
      return;
    }

    if (!(await this.workflowPlugin.timeoutManager.shouldContinue(execution))) {
      await this.finishClaimedJob(job, {
        status: JOB_STATUS.ABORTED,
        result: 'Execution timeout reached before JavaScript Worker started',
      });
      return;
    }

    const abortHandle = createExecutionAbortController(this.workflowPlugin, execution);

    try {
      const result = await ScriptWorkerRunner.run(snapshot.content, snapshot.args, {
        timeout: snapshot.timeout,
        logger,
        signal: abortHandle.signal,
      });

      if (result.status === JOB_STATUS.RESOLVED) {
        logger.info(`script (#${job.nodeId}) get result success`);
        job.set({ status: JOB_STATUS.RESOLVED, result: result.result });
        logger.info(`run script execution success, node id: ${job.nodeId},the result is ${result.result}`);
      } else if (snapshot.continue) {
        logger.warn(`script (#${job.nodeId}) get result failed, the reason is ${result.result}`);
        job.set({ status: JOB_STATUS.RESOLVED, result: result.result });
      } else {
        logger.info(`script (#${job.nodeId}) get result failed, the reason is ${result.result}`);
        job.set({ status: JOB_STATUS.ERROR, result: result.result });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`script (#${job.nodeId}) get result failed, the reason is ${message}`);
      job.set({
        status: isWorkflowTimeoutError(error) ? JOB_STATUS.ABORTED : JOB_STATUS.ERROR,
        result: message,
      });
    } finally {
      abortHandle.dispose();
    }

    try {
      await this.workflowPlugin.resume(job);
    } catch (error) {
      logger.error(`JavaScript job (${job.id}) failed to resume workflow execution (${job.executionId})`, { error });
    }
  }

  private async claimJob(jobId: ID): Promise<{ job: WorkflowJob; snapshot: JavaScriptJobSnapshot } | null> {
    const job = (await this.workflowPlugin.db.getRepository('jobs').findOne({
      filterByTk: jobId,
    })) as WorkflowJob | null;
    if (!job || job.status !== JOB_STATUS.PENDING || job.startedAt != null) {
      return null;
    }

    const snapshot = getJavaScriptSnapshot(job);
    if (!snapshot) {
      return null;
    }

    const maxWait = getJavaScriptQueueMaxWait();
    if (maxWait > 0 && job.createdAt && Date.now() - job.createdAt.getTime() > maxWait) {
      await this.failUnstartedJob(job, snapshot, `JavaScript worker queue wait timed out after ${maxWait}ms`);
      return null;
    }

    const now = new Date();
    const JobModel = this.workflowPlugin.db.getModel('jobs');
    const [affected] = await JobModel.update(
      {
        startedAt: now,
      },
      {
        where: {
          id: job.id,
          status: JOB_STATUS.PENDING,
          startedAt: null,
        },
      },
    );

    if (!affected) {
      return null;
    }

    const claimedJob = await job.reload();
    return { job: claimedJob, snapshot };
  }

  private async failUnstartedJob(job: WorkflowJob, snapshot: JavaScriptJobSnapshot, message: string) {
    const JobModel = this.workflowPlugin.db.getModel('jobs');
    const [affected] = await JobModel.update(
      {
        status: snapshot.continue ? JOB_STATUS.RESOLVED : JOB_STATUS.ERROR,
        result: message,
      },
      {
        where: {
          id: job.id,
          status: JOB_STATUS.PENDING,
          startedAt: null,
        },
      },
    );

    if (!affected) {
      return;
    }

    await job.reload();
    try {
      await this.workflowPlugin.resume(job);
    } catch (error) {
      this.workflowPlugin
        .getLogger('javascript')
        .error(`JavaScript job (${job.id}) failed to resume queue timeout result`, { error });
    }
  }

  private async finishClaimedJob(job: WorkflowJob, values: { status: number; result: unknown }) {
    job.set({
      status: values.status,
      result: stringifyResult(values.result),
    });
    try {
      await this.workflowPlugin.resume(job);
    } catch (error) {
      this.workflowPlugin
        .getLogger('javascript')
        .error(`JavaScript job (${job.id}) failed to resume after claim failure`, { error });
    }
  }
}
