/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import { JOB_STATUS } from '@nocobase/plugin-workflow';

import type { ScriptArguments } from './ScriptWorkerRunner';

export type JavaScriptJobSnapshot = {
  version: 1;
  content: string;
  args: ScriptArguments;
  timeout?: number;
  continue?: boolean;
};

export type JavaScriptJobMeta = {
  javascript?: JavaScriptJobSnapshot;
  [key: string]: unknown;
};

export const WORKFLOW_JAVASCRIPT_ERROR_CODE = {
  QUEUE_FULL: 'WORKFLOW_JAVASCRIPT_QUEUE_FULL',
  QUEUE_TIMEOUT: 'WORKFLOW_JAVASCRIPT_QUEUE_TIMEOUT',
  WORKFLOW_ABORTED: 'WORKFLOW_JAVASCRIPT_WORKFLOW_ABORTED',
  SHUTDOWN: 'WORKFLOW_JAVASCRIPT_SHUTDOWN',
} as const;

const DEFAULT_QUEUE_CONCURRENCY = 2;
const DEFAULT_MAX_PENDING = 10_000;
const QUEUE_TASK_MAX_ATTEMPTS = 3;

function readNonNegativeInteger(value: string | undefined, defaultValue: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : defaultValue;
}

function readPositiveInteger(value: string | undefined, defaultValue: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

export function getJavaScriptQueueConcurrency() {
  return readPositiveInteger(process.env.WORKFLOW_JAVASCRIPT_QUEUE_CONCURRENCY, DEFAULT_QUEUE_CONCURRENCY);
}

export function getJavaScriptQueueMaxPending() {
  return readNonNegativeInteger(process.env.WORKFLOW_JAVASCRIPT_QUEUE_MAX_PENDING, DEFAULT_MAX_PENDING);
}

export function getJavaScriptQueueMaxWait() {
  return readNonNegativeInteger(process.env.WORKFLOW_JAVASCRIPT_QUEUE_MAX_WAIT, 0);
}

export type JavaScriptQueueTaskMessage = {
  jobId: number | string;
};

export class JavaScriptQueueFullError extends Error {
  code = WORKFLOW_JAVASCRIPT_ERROR_CODE.QUEUE_FULL;

  constructor(limit: number) {
    super(`JavaScript worker queue is full, max pending jobs: ${limit}`);
  }
}

export class JavaScriptTaskQueue {
  constructor(
    private readonly app: Application,
    private readonly channel: string,
  ) {}

  async assertCapacity() {
    const limit = getJavaScriptQueueMaxPending();
    if (limit <= 0) {
      return;
    }

    const pending = await this.app.db.getRepository('jobs').count({
      filter: {
        status: JOB_STATUS.PENDING,
        startedAt: null,
      },
    });
    if (pending >= limit) {
      throw new JavaScriptQueueFullError(limit);
    }
  }

  async publish(jobId: number | string) {
    await this.app.eventQueue.publish(this.channel, { jobId } satisfies JavaScriptQueueTaskMessage, {
      maxRetries: QUEUE_TASK_MAX_ATTEMPTS - 1,
    });
  }
}
