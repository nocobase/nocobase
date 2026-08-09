/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from 'sequelize';
import type WorkflowPlugin from '@nocobase/plugin-workflow';
import { JOB_STATUS, type JobModel } from '@nocobase/plugin-workflow';

import { SCRIPT_INSTRUCTION_TYPE } from '../common/constants';

const RECOVERY_BATCH_SIZE = 100;
const RECOVERY_MAX_SCAN_SIZE = 1000;
const RECOVERY_INTERVAL = 60_000;

export class TaskRecovery {
  private timer: NodeJS.Timeout | null = null;
  private ready = false;
  private recovering: Promise<void> | null = null;

  constructor(
    private readonly workflowPlugin: WorkflowPlugin,
    private readonly taskQueueChannel: string,
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
    const staleBefore = new Date(Date.now() - 120_000);
    const logger = this.workflowPlugin.getLogger('javascript');
    const JobModel = this.workflowPlugin.db.getModel('jobs');

    while (scanned < RECOVERY_MAX_SCAN_SIZE) {
      const jobs = (await JobModel.findAll({
        where: {
          ...(cursor == null ? {} : { id: { [Op.gt]: cursor } }),
          status: JOB_STATUS.PENDING,
        },
        attributes: ['id', 'startedAt', 'updatedAt'],
        include: [
          {
            association: 'node',
            attributes: [],
            where: {
              type: SCRIPT_INSTRUCTION_TYPE,
            },
            required: true,
          },
        ],
        order: [['id', 'ASC']],
        limit: Math.min(RECOVERY_BATCH_SIZE, RECOVERY_MAX_SCAN_SIZE - scanned),
      })) as JobModel[];

      if (!jobs.length) {
        break;
      }

      for (const job of jobs) {
        if (job.startedAt) {
          if (job.updatedAt && job.updatedAt <= staleBefore) {
            logger.warn(`JavaScript job (${job.id}) claim heartbeat timed out, manual recovery is required`);
          }
          continue;
        }
        await this.workflowPlugin.app.eventQueue.publish(this.taskQueueChannel, {
          jobId: job.id,
        });
      }

      scanned += jobs.length;
      cursor = jobs[jobs.length - 1].id;
    }
  }
}
