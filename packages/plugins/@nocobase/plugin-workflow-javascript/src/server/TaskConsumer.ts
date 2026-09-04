/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type WorkflowPlugin from '@nocobase/plugin-workflow';
import type { ExecutionModel, JobModel } from '@nocobase/plugin-workflow';
import {
  EXECUTION_REASON,
  EXECUTION_STATUS,
  JOB_STATUS,
  WorkflowTimeoutError,
  isWorkflowTimeoutError,
} from '@nocobase/plugin-workflow';
import type { QueueEventOptions } from '@nocobase/server';

import { SCRIPT_INSTRUCTION_TYPE } from '../common/constants';
import { RunningJobs } from './RunningJobs';
import { ScriptArguments, ScriptWorkerRunner } from './ScriptWorkerRunner';

type ID = number | string;

type ScriptConfig = {
  content?: string;
  timeout?: number;
  continue?: boolean;
};

type JavaScriptQueueTaskMessage = {
  jobId: ID;
};

type JavaScriptExecutionPayload = {
  content: string;
  args: ScriptArguments;
  timeout?: number;
  continue?: boolean;
};

function isTaskMessage(message: unknown): message is JavaScriptQueueTaskMessage {
  return typeof message === 'object' && message !== null && 'jobId' in message;
}

function isScriptArguments(value: unknown): value is ScriptArguments {
  return value === null || Array.isArray(value) || (typeof value === 'object' && value !== null);
}

function getJavaScriptArguments(job: JobModel): ScriptArguments {
  if (!job.meta || !('args' in job.meta) || !isScriptArguments(job.meta.args)) {
    return {};
  }
  return job.meta.args;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isSameClaim(left: Date | null | undefined, right: Date | null | undefined) {
  return left?.getTime() === right?.getTime();
}

function createJobAbortController(
  workflowPlugin: WorkflowPlugin,
  runningJobs: RunningJobs,
  job: JobModel,
  execution: ExecutionModel,
) {
  const controller = new AbortController();
  let timeoutGuard: NodeJS.Timeout | null = null;

  const abort = (reason?: unknown) => {
    if (!controller.signal.aborted) {
      if (isWorkflowTimeoutError(reason)) {
        controller.abort(reason);
      } else if (reason === EXECUTION_REASON.TIMEOUT) {
        controller.abort(new WorkflowTimeoutError());
      } else {
        controller.abort(reason instanceof Error ? reason : new Error('Workflow execution has been aborted'));
      }
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

  const unregister = workflowPlugin.registerRunningExecution(execution.id, abort);
  const unregisterJob = runningJobs.register({
    jobId: job.id,
    executionId: execution.id,
    abort,
  });

  return {
    abort,
    signal: controller.signal,
    dispose: () => {
      if (timeoutGuard) {
        clearTimeout(timeoutGuard);
        timeoutGuard = null;
      }
      unregister();
      unregisterJob();
    },
  };
}

export class TaskConsumer {
  private ready = false;
  private closing = false;
  private readonly processing = new Set<Promise<void>>();

  constructor(
    private readonly workflowPlugin: WorkflowPlugin,
    private readonly runningJobs: RunningJobs,
  ) {}

  setReady(ready: boolean) {
    this.ready = ready;
  }

  idle() {
    return this.ready && !this.closing && this.workflowPlugin.serving();
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

    const processing = this.processWithPermit(message.jobId);
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

    const existingJob = (await this.workflowPlugin.db.getRepository('jobs').findOne({
      filterByTk: jobId,
    })) as JobModel | null;
    if (!existingJob) {
      return;
    }

    if (existingJob.status !== JOB_STATUS.PENDING) {
      return;
    }

    const node = await existingJob.getNode();
    if (node?.type !== SCRIPT_INSTRUCTION_TYPE) {
      return;
    }

    const claimedJob = await this.claimJob(existingJob);
    if (!claimedJob) {
      return;
    }

    const job = claimedJob;
    const config = node.config as ScriptConfig | null | undefined;
    const payload: JavaScriptExecutionPayload = {
      content: config?.content ?? '',
      args: getJavaScriptArguments(job),
      timeout: config?.timeout,
      continue: config?.continue,
    };
    const execution = await job.getExecution({ attributes: ['id', 'workflowId', 'status'] });
    if (!execution || execution.status !== EXECUTION_STATUS.STARTED) {
      await this.finishClaimedJob(job, {
        status: JOB_STATUS.ABORTED,
        result: `Execution (${job.executionId}) is not running`,
      });
      return;
    }

    const logger = this.workflowPlugin.getLogger(execution?.workflowId ?? 'javascript');
    const queueWaitMs = job.startedAt && job.createdAt ? job.startedAt.getTime() - job.createdAt.getTime() : 0;

    logger.info(`JavaScript job (${job.id}) claimed for node (${job.nodeId})`, {
      executionId: job.executionId,
      jobId: job.id,
      nodeId: job.nodeId,
      queueWaitMs,
    });

    if (!(await this.workflowPlugin.timeoutManager.shouldContinue(execution))) {
      await this.finishClaimedJob(job, {
        status: JOB_STATUS.ABORTED,
        result: 'Execution timeout reached before JavaScript Worker started',
      });
      return;
    }

    const abortHandle = createJobAbortController(this.workflowPlugin, this.runningJobs, job, execution);
    const stopHeartbeat = this.startClaimHeartbeat(job, abortHandle.abort);
    let values: { status: number; result: unknown };

    try {
      const result = await ScriptWorkerRunner.run(payload.content, payload.args, {
        timeout: payload.timeout,
        logger,
        signal: abortHandle.signal,
      });

      if (result.status === JOB_STATUS.RESOLVED) {
        logger.info(`script (#${job.nodeId}) get result success`);
        values = { status: JOB_STATUS.RESOLVED, result: result.result };
        logger.info(`run script execution success, node id: ${job.nodeId},the result is ${result.result}`);
      } else if (payload.continue) {
        logger.warn(`script (#${job.nodeId}) get result failed, the reason is ${result.result}`);
        values = { status: JOB_STATUS.RESOLVED, result: result.result };
      } else {
        logger.info(`script (#${job.nodeId}) get result failed, the reason is ${result.result}`);
        values = { status: JOB_STATUS.ERROR, result: result.result };
      }
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`script (#${job.nodeId}) get result failed, the reason is ${message}`);
      values = {
        status: abortHandle.signal.aborted || isWorkflowTimeoutError(error) ? JOB_STATUS.ABORTED : JOB_STATUS.ERROR,
        result: message,
      };
    } finally {
      abortHandle.dispose();
      await stopHeartbeat();
    }

    try {
      await this.settleClaimedJob(job, execution, values, logger);
    } catch (error) {
      logger.error(`JavaScript job (${job.id}) failed to resume workflow execution (${job.executionId})`, { error });
      throw error;
    }
  }

  private async claimJob(job: JobModel): Promise<JobModel | null> {
    if (job.startedAt != null) {
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
    return claimedJob;
  }

  private async finishClaimedJob(job: JobModel, values: { status: number; result: unknown }) {
    const updated = await this.updatePendingJob(job, values);
    if (updated) {
      await this.workflowPlugin.resume(job);
    }
  }

  private async settleClaimedJob(
    job: JobModel,
    execution: ExecutionModel,
    values: { status: number; result: unknown },
    logger: ReturnType<WorkflowPlugin['getLogger']>,
  ) {
    if (!(await this.workflowPlugin.timeoutManager.shouldContinue(execution))) {
      logger.warn(`script (#${job.nodeId}) result discarded because execution (${execution.id}) is ended`);
      return;
    }

    await execution.reload();
    await job.reload();
    if (execution.status !== EXECUTION_STATUS.STARTED || job.status !== JOB_STATUS.PENDING) {
      logger.warn(`script (#${job.nodeId}) result discarded because execution (${execution.id}) is ended`);
      return;
    }

    const updated = await this.updatePendingJob(job, values);
    if (updated) {
      await this.workflowPlugin.resume(job);
    }
  }

  private async updatePendingJob(job: JobModel, values: { status: number; result: unknown }) {
    const JobModel = this.workflowPlugin.db.getModel('jobs');
    const [affected] = await JobModel.update(
      {
        status: values.status,
        result: values.result,
      },
      {
        where: {
          id: job.id,
          status: JOB_STATUS.PENDING,
          startedAt: job.startedAt,
        },
      },
    );
    if (!affected) {
      return false;
    }

    await job.reload();
    return true;
  }

  private startClaimHeartbeat(job: JobModel, abort: (reason?: unknown) => void) {
    let heartbeat: Promise<void> | null = null;
    const beat = () => {
      if (heartbeat) {
        return;
      }
      const JobModel = this.workflowPlugin.db.getModel('jobs');
      heartbeat = JobModel.update(
        { updatedAt: new Date() },
        {
          where: {
            id: job.id,
            status: JOB_STATUS.PENDING,
            startedAt: job.startedAt,
          },
        },
      )
        .then(async ([affected]) => {
          if (affected) {
            return;
          }

          const currentJob = (await JobModel.findByPk(job.id, {
            attributes: ['status', 'startedAt'],
          })) as JobModel | null;
          if (
            !currentJob ||
            currentJob.status !== JOB_STATUS.PENDING ||
            !isSameClaim(currentJob.startedAt, job.startedAt)
          ) {
            abort();
          }
        })
        .catch((error) => {
          this.workflowPlugin.getLogger('javascript').error(`JavaScript job (${job.id}) claim heartbeat failed`, {
            error,
          });
        })
        .finally(() => {
          heartbeat = null;
        });
    };
    const timer = setInterval(beat, 30_000);

    return async () => {
      clearInterval(timer);
      await heartbeat;
    };
  }
}
