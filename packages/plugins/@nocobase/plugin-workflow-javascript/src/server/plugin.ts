/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import WorkflowPlugin, { JOB_STATUS, type JobModel } from '@nocobase/plugin-workflow';
import type { UpdateOptions } from 'sequelize';

import { SCRIPT_INSTRUCTION_TYPE } from '../common/constants';
import ScriptInstruction from './ScriptInstruction';
import { PENDING_JAVASCRIPT_TASK_CHANNEL } from './constants';
import { ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE, RunningJobs } from './RunningJobs';
import { TaskConsumer } from './TaskConsumer';
import { TaskRecovery } from './TaskRecovery';

type JobsAfterBulkUpdateOptions = UpdateOptions<Record<string, unknown>> & {
  attributes?: Record<string, unknown>;
};

export class PluginWorkflowScriptServer extends Plugin {
  private readonly runningJobs = new RunningJobs();
  private workflowPlugin: WorkflowPlugin;
  private taskConsumer: TaskConsumer;
  private taskRecovery: TaskRecovery;

  private readonly handleJobsAfterBulkUpdate = async (options: JobsAfterBulkUpdateOptions) => {
    if (options.attributes?.status !== JOB_STATUS.ABORTED) {
      return;
    }

    const JobModel = this.db.getModel('jobs');
    const jobs = (await JobModel.findAll({
      attributes: ['id', 'executionId'],
      where: options.where,
      include: [
        {
          association: 'node',
          attributes: [],
          where: {
            type: SCRIPT_INSTRUCTION_TYPE,
          },
          required: true,
        },
        {
          association: 'execution',
          attributes: ['reason'],
          required: false,
        },
      ],
      transaction: options.transaction,
    })) as JobModel[];

    const abortJobs = async () => {
      for (const job of jobs) {
        try {
          await this.runningJobs.abortAcrossInstances(this.workflowPlugin, {
            type: ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE,
            jobId: job.id,
            executionId: job.executionId,
            reason: job.execution?.reason ?? undefined,
          });
        } catch (error) {
          this.workflowPlugin.getLogger('javascript').error(`aborting JavaScript job (${job.id}) failed`, { error });
        }
      }
    };

    if (options.transaction) {
      options.transaction.afterCommit(abortJobs);
      return;
    }
    await abortJobs();
  };

  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    this.taskConsumer = new TaskConsumer(this.workflowPlugin, this.runningJobs);
    this.taskRecovery = new TaskRecovery(this.workflowPlugin, PENDING_JAVASCRIPT_TASK_CHANNEL);

    this.workflowPlugin.registerInstruction(
      SCRIPT_INSTRUCTION_TYPE,
      new ScriptInstruction(this.workflowPlugin, this.runningJobs),
    );
    this.db.on('jobs.afterBulkUpdate', this.handleJobsAfterBulkUpdate);
    const workerConcurrency = Number.parseInt(process.env.WORKFLOW_SCRIPT_WORKER_CONCURRENCY, 10);
    this.app.eventQueue.subscribe(PENDING_JAVASCRIPT_TASK_CHANNEL, {
      concurrency: Number.isInteger(workerConcurrency) && workerConcurrency >= 0 ? workerConcurrency : 0,
      idle: () => this.taskConsumer.idle(),
      process: this.taskConsumer.process,
    });

    this.app.on('afterStart', () => {
      this.taskConsumer.setReady(true);
      this.taskRecovery.start();
    });

    this.app.on('beforeStop', async () => {
      this.taskConsumer.setReady(false);
      await this.taskConsumer.beforeStop();
      await this.taskRecovery.stop();
      this.db.off('jobs.afterBulkUpdate', this.handleJobsAfterBulkUpdate);
    });
  }

  async handleSyncMessage(message: unknown) {
    if (typeof message !== 'object' || message === null) {
      return;
    }

    const { type, jobId, reason } = message as Record<string, unknown>;
    if (type !== ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE) {
      return;
    }

    if (typeof jobId === 'string' || typeof jobId === 'number') {
      this.runningJobs.abortJob(jobId, typeof reason === 'string' ? reason : undefined);
    }
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginWorkflowScriptServer;
