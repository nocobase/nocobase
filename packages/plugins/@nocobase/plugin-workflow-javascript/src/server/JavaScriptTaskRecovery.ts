/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type WorkflowPlugin from '@nocobase/plugin-workflow';
import { JOB_STATUS } from '@nocobase/plugin-workflow';

import { JavaScriptJobMeta, JavaScriptTaskQueue } from './JavaScriptTaskQueue';

const RECOVERY_BATCH_SIZE = 100;
const RECOVERY_MAX_SCAN_SIZE = 1000;
const RECOVERY_INTERVAL = 60_000;

type WorkflowJob = {
  id: number | string;
  status: number;
  meta?: JavaScriptJobMeta | null;
  startedAt?: Date | null;
};

function hasJavaScriptSnapshot(job: WorkflowJob) {
  return job.meta?.javascript?.version === 1;
}

export class JavaScriptTaskRecovery {
  private timer: NodeJS.Timeout | null = null;
  private ready = false;
  private recovering: Promise<void> | null = null;

  constructor(
    private readonly workflowPlugin: WorkflowPlugin,
    private readonly taskQueue: JavaScriptTaskQueue,
  ) {}

  start() {
    this.ready = true;
    this.recover();
    this.timer = setInterval(() => {
      this.recover();
    }, RECOVERY_INTERVAL);
  }

  async stop() {
    this.ready = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.recovering?.catch(() => undefined);
  }

  recover() {
    if (!this.ready || this.recovering) {
      return;
    }

    const recovering = this.recoverTasks()
      .catch(() => undefined)
      .finally(() => {
        if (this.recovering === recovering) {
          this.recovering = null;
        }
      });
    this.recovering = recovering;
  }

  private async recoverTasks() {
    const logger = this.workflowPlugin.getLogger('javascript');
    if (!this.workflowPlugin.serving()) {
      logger.warn('workflow:process is not serving on this instance, JavaScript job recovery will be ignored');
      return;
    }

    try {
      await this.republishQueuedJobs();
    } catch (error) {
      logger.error('JavaScript job recovery failed', { error });
    }
  }

  private async republishQueuedJobs() {
    let cursor: number | string | null = null;
    let scanned = 0;

    while (scanned < RECOVERY_MAX_SCAN_SIZE) {
      const jobs = (await this.workflowPlugin.db.getRepository('jobs').find({
        filter: {
          ...(cursor == null ? {} : { id: { $gt: cursor } }),
          status: JOB_STATUS.PENDING,
          startedAt: null,
        },
        sort: 'id',
        limit: Math.min(RECOVERY_BATCH_SIZE, RECOVERY_MAX_SCAN_SIZE - scanned),
      })) as WorkflowJob[];

      if (!jobs.length) {
        break;
      }

      for (const job of jobs) {
        if (hasJavaScriptSnapshot(job)) {
          await this.taskQueue.publish(job.id);
        }
      }

      scanned += jobs.length;
      cursor = jobs[jobs.length - 1].id;
    }
  }
}
