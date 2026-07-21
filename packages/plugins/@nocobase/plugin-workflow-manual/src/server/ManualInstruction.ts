/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi from 'joi';
import type { Database, Model, Transaction } from '@nocobase/database';
import { Registry } from '@nocobase/utils';
import WorkflowPlugin, { Instruction, JOB_STATUS, Processor } from '@nocobase/plugin-workflow';
import type { FlowNodeModel, JobModel } from '@nocobase/plugin-workflow';

import initFormTypes, { FormHandler } from './forms';

type FormType = {
  type: 'custom' | 'create' | 'update';
  actions: number[];
  options: {
    [key: string]: any;
  };
};

export interface ManualConfig {
  schema: { [key: string]: any };
  forms: { [key: string]: FormType };
  assignees?: (number | string)[];
  mode?: number;
  title?: string;
}

type ManualTaskModel = Model & {
  userId: number | string;
  status: number;
  result?: unknown;
};

type StatusDistribution = {
  status: number;
  count: number;
};

function getSubmittedRatio(tasks: ManualTaskModel[]) {
  if (!tasks.length) {
    return 0;
  }
  const submitted = tasks.reduce((count, item) => (item.status !== JOB_STATUS.PENDING ? count + 1 : count), 0);
  return submitted / tasks.length;
}

function getSingleModeStatus(distribution: StatusDistribution[]) {
  return distribution.find((item) => item.status !== JOB_STATUS.PENDING && item.count > 0)?.status ?? null;
}

function getAllModeStatus(distribution: StatusDistribution[], assignees: Array<number | string>) {
  const resolved = distribution.find((item) => item.status === JOB_STATUS.RESOLVED);
  if (resolved?.count === assignees.length) {
    return JOB_STATUS.RESOLVED;
  }
  const rejected = distribution.find((item) => item.status < JOB_STATUS.PENDING);
  return rejected?.count ? rejected.status : null;
}

function getAnyModeStatus(distribution: StatusDistribution[], assignees: Array<number | string>) {
  const resolved = distribution.find((item) => item.status === JOB_STATUS.RESOLVED);
  if (resolved?.count) {
    return JOB_STATUS.RESOLVED;
  }
  const rejectedCount = distribution.reduce(
    (count, item) => (item.status < JOB_STATUS.PENDING ? count + item.count : count),
    0,
  );
  return rejectedCount === assignees.length ? JOB_STATUS.REJECTED : null;
}

export default class extends Instruction {
  formTypes = new Registry<FormHandler>();

  constructor(public workflow: WorkflowPlugin) {
    super(workflow);

    initFormTypes(this);
  }

  async updateJobByManualTasks(
    job: JobModel,
    node: FlowNodeModel,
    database: Database = this.workflow.app.db,
    latestTask?: ManualTaskModel,
    transaction?: Transaction,
  ) {
    const mode = (node.config as ManualConfig).mode ?? 0;
    const tasks = await database.getModel<ManualTaskModel>('workflowManualTasks').findAll({
      where: {
        jobId: job.id,
      },
      transaction,
    });
    const assignees: Array<number | string> = [];
    const distributionMap = new Map<number, number>();

    for (const task of tasks) {
      distributionMap.set(task.status, (distributionMap.get(task.status) ?? 0) + 1);
      assignees.push(task.userId);
    }

    const distribution = Array.from(distributionMap.entries()).map(([status, count]) => ({ status, count }));
    const status =
      mode === 1
        ? getAllModeStatus(distribution, assignees)
        : mode === -1
          ? getAnyModeStatus(distribution, assignees)
          : getSingleModeStatus(distribution);

    job.set({
      status: status ?? JOB_STATUS.PENDING,
      result: mode ? getSubmittedRatio(tasks) : latestTask?.result ?? job.result,
    });
  }

  async run(node, prevJob, processor: Processor) {
    const { mode, ...config } = node.config as ManualConfig;
    const assignees = [...new Set(processor.getParsedValue(config.assignees, node.id).flat().filter(Boolean))];

    const job = processor.saveJob({
      status: assignees.length ? JOB_STATUS.PENDING : JOB_STATUS.RESOLVED,
      result: mode ? [] : null,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    if (!assignees.length) {
      return job;
    }
    const title = config.title ? processor.getParsedValue(config.title, node.id) : node.title;
    // NOTE: batch create users jobs
    const TaskRepo = this.workflow.app.db.getRepository('workflowManualTasks');
    await TaskRepo.createMany({
      records: assignees.map((userId) => ({
        userId,
        jobId: job.id,
        nodeId: node.id,
        executionId: job.executionId,
        workflowId: node.workflowId,
        status: JOB_STATUS.PENDING,
        title,
      })),
    });

    return job;
  }

  async resume(node: FlowNodeModel, job: JobModel, processor: Processor) {
    await this.updateJobByManualTasks(job, node);
    processor.logger.debug(`manual resume job and next status: ${job.status}`);
    return job;
  }
}
