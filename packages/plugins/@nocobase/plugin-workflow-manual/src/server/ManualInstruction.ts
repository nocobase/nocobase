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
    const assignees = [...new Set(processor.getParsedValue(config.assignees, node.id) || [])];

    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      result: mode ? [] : null,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    // NOTE: batch create users jobs
    const UserJobModel = this.workflow.app.db.getModel('users_jobs');
    await UserJobModel.bulkCreate(
      assignees.map((userId) => ({
        userId,
        jobId: job.id,
        nodeId: node.id,
        executionId: job.executionId,
        workflowId: node.workflowId,
        status: JOB_STATUS.PENDING,
      })),
      {
        // transaction: processor.transaction,
      },
    );

    return job;
  }

  async resume(node, job, processor: Processor) {
    // NOTE: check all users jobs related if all done then continue as parallel
    const { assignees = [], mode } = node.config as ManualConfig;

    const UserJobModel = this.workflow.app.db.getModel('users_jobs');
    const distribution = await UserJobModel.count({
      where: {
        jobId: job.id,
      },
      group: ['status'],
      // transaction: processor.transaction,
    });

    const submitted = distribution.reduce(
      (count, item) => (item.status !== JOB_STATUS.PENDING ? count + item.count : count),
      0,
    );
    const status = job.status || (getMode(mode).getStatus(distribution, assignees) ?? JOB_STATUS.PENDING);
    const result = mode ? (submitted || 0) / assignees.length : job.latestUserJob?.result ?? job.result;
    processor.logger.debug(`manual resume job and next status: ${status}`);
    job.set({
      status,
      result,
    });

    return job;
  }
}
