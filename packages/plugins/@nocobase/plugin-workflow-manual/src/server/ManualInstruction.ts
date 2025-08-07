/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import WorkflowPlugin, { Processor, JOB_STATUS, Instruction } from '@nocobase/plugin-workflow';

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

const MULTIPLE_ASSIGNED_MODE = {
  SINGLE: Symbol('single'),
  ALL: Symbol('all'),
  ANY: Symbol('any'),
  ALL_PERCENTAGE: Symbol('all percentage'),
  ANY_PERCENTAGE: Symbol('any percentage'),
};

const Modes = {
  [MULTIPLE_ASSIGNED_MODE.SINGLE]: {
    getStatus(distribution, assignees) {
      const done = distribution.find((item) => item.status !== JOB_STATUS.PENDING && item.count > 0);
      return done ? done.status : null;
    },
  },
  [MULTIPLE_ASSIGNED_MODE.ALL]: {
    getStatus(distribution, assignees) {
      const resolved = distribution.find((item) => item.status === JOB_STATUS.RESOLVED);
      if (resolved && resolved.count === assignees.length) {
        return JOB_STATUS.RESOLVED;
      }
      const rejected = distribution.find((item) => item.status < JOB_STATUS.PENDING);
      if (rejected && rejected.count) {
        return rejected.status;
      }

      return null;
    },
  },
  [MULTIPLE_ASSIGNED_MODE.ANY]: {
    getStatus(distribution, assignees) {
      const resolved = distribution.find((item) => item.status === JOB_STATUS.RESOLVED);
      if (resolved && resolved.count) {
        return JOB_STATUS.RESOLVED;
      }
      const rejectedCount = distribution.reduce(
        (count, item) => (item.status < JOB_STATUS.PENDING ? count + item.count : count),
        0,
      );
      // NOTE: all failures are considered as rejected for now
      if (rejectedCount === assignees.length) {
        return JOB_STATUS.REJECTED;
      }

      return null;
    },
  },
};

function getMode(mode) {
  switch (true) {
    case mode === 1:
      return Modes[MULTIPLE_ASSIGNED_MODE.ALL];
    case mode === -1:
      return Modes[MULTIPLE_ASSIGNED_MODE.ANY];
    case mode > 0:
      return Modes[MULTIPLE_ASSIGNED_MODE.ALL_PERCENTAGE];
    case mode < 0:
      return Modes[MULTIPLE_ASSIGNED_MODE.ANY_PERCENTAGE];
    default:
      return Modes[MULTIPLE_ASSIGNED_MODE.SINGLE];
  }
}

export default class extends Instruction {
  formTypes = new Registry<FormHandler>();

  constructor(public workflow: WorkflowPlugin) {
    super(workflow);

    initFormTypes(this);
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
      transaction: processor.mainTransaction,
    });

    return job;
  }

  async resume(node, job, processor: Processor) {
    // NOTE: check all users jobs related if all done then continue as parallel
    const { mode } = node.config as ManualConfig;

    const TaskRepo = this.workflow.app.db.getRepository('workflowManualTasks');
    const tasks = await TaskRepo.find({
      where: {
        jobId: job.id,
      },
      transaction: processor.mainTransaction,
    });
    const assignees = [];
    const distributionMap = tasks.reduce((result, item) => {
      if (result[item.status] == null) {
        result[item.status] = 0;
      }
      result[item.status] += 1;
      assignees.push(item.userId);
      return result;
    }, {});
    const distribution = Object.keys(distributionMap).map((status) => ({
      status: Number.parseInt(status, 10),
      count: distributionMap[status],
    }));

    const submitted = tasks.reduce((count, item) => (item.status !== JOB_STATUS.PENDING ? count + 1 : count), 0);
    const status = job.status || (getMode(mode).getStatus(distribution, assignees) ?? JOB_STATUS.PENDING);
    const result = mode ? (submitted || 0) / assignees.length : job.latestTask?.result ?? job.result;
    processor.logger.debug(`manual resume job and next status: ${status}`);
    job.set({
      status,
      result,
    });

    return job;
  }
}
