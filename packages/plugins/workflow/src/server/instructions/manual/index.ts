import Plugin from '../..';
import { JOB_STATUS } from "../../constants";
import { Instruction } from '..';
import jobsCollection from './collecions/jobs';
import usersCollection from './collecions/users';
import usersJobsCollection from './collecions/users_jobs';
import { submit } from './actions';



export interface ManualConfig {
  schema: {
    collection: {
      name: string;
      fields: any[];
    };
    blocks: { [key: string]: any },
    actions: { [key: string]: any },
  };
  actions: number[];
  assignees?: number[];
  mode?: number;
}

const PROMPT_ASSIGNED_MODE = {
  SINGLE: Symbol('single'),
  ALL: Symbol('all'),
  ANY: Symbol('any'),
  ALL_PERCENTAGE: Symbol('all percentage'),
  ANY_PERCENTAGE: Symbol('any percentage')
};

const Modes = {
  [PROMPT_ASSIGNED_MODE.SINGLE]: {
    getStatus(distribution, assignees) {
      const done = distribution.find(item => item.status !== JOB_STATUS.PENDING && item.count > 0);
      return done ? done.status : null
    }
  },
  [PROMPT_ASSIGNED_MODE.ALL]: {
    getStatus(distribution, assignees) {
      const resolved = distribution.find(item => item.status === JOB_STATUS.RESOLVED);
      if (resolved && resolved.count === assignees.length) {
        return JOB_STATUS.RESOLVED;
      }
      // NOTE: `rejected` or `canceled`
      const failed = distribution.find(item => item.status < JOB_STATUS.PENDING);
      if (failed && failed.count) {
        return failed.status;
      }

      return null;
    }
  },
  [PROMPT_ASSIGNED_MODE.ANY]: {
    getStatus(distribution, assignees) {
      const resolved = distribution.find(item => item.status === JOB_STATUS.RESOLVED);
      if (resolved && resolved.count) {
        return JOB_STATUS.RESOLVED;
      }
      const failedCount = distribution.reduce((count, item) => item.status < JOB_STATUS.PENDING ? count + item.count : count, 0);
      // NOTE: all failures are considered as rejected for now
      if (failedCount === assignees.length) {
        return JOB_STATUS.REJECTED;
      }

      return null;
    }
  }
};

function getMode(mode) {
  switch (true) {
    case mode === 1:
      return Modes[PROMPT_ASSIGNED_MODE.ALL];
    case mode === -1:
      return Modes[PROMPT_ASSIGNED_MODE.ANY];
    case mode > 0:
      return Modes[PROMPT_ASSIGNED_MODE.ALL_PERCENTAGE];
    case mode < 0:
      return Modes[PROMPT_ASSIGNED_MODE.ANY_PERCENTAGE];
    default:
      return Modes[PROMPT_ASSIGNED_MODE.SINGLE];
  }
}

export default class implements Instruction {
  middlewares = [];

  constructor(protected plugin: Plugin) {
    plugin.db.collection(usersJobsCollection);
    plugin.db.extendCollection(usersCollection);
    plugin.db.extendCollection(jobsCollection);

    plugin.app.actions({
      'users_jobs:submit': submit
    });
  }

  async run(node, prevJob, processor) {
    const { assignees = [], mode } = node.config as ManualConfig;

    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      result: mode ? [] : null,
      nodeId: node.id,
      upstreamId: prevJob?.id ?? null
    });

    // NOTE: batch create users jobs
    const UserJobModel = processor.options.plugin.db.getModel('users_jobs');
    await UserJobModel.bulkCreate(assignees.map(userId => ({
      userId,
      jobId: job.id,
      nodeId: node.id,
      executionId: job.executionId,
      workflowId: node.workflowId,
      status: JOB_STATUS.PENDING
    })), {
      transaction: processor.transaction
    });

    return job;
  }

  async resume(node, job, processor) {
    // NOTE: check all users jobs related if all done then continue as parallel
    const { assignees = [], mode } = node.config as ManualConfig;

    const UserJobModel = processor.options.plugin.db.getModel('users_jobs');
    const distribution = await UserJobModel.count({
      where: {
        jobId: job.id
      },
      group: ['status']
    });

    const submitted = distribution.reduce((count, item) => item.status !== JOB_STATUS.PENDING ? count + item.count : count, 0);
    const result = mode ? (submitted || 0) / assignees.length : job.latestUserJob?.result ?? job.result;
    job.set({
      status: getMode(mode).getStatus(distribution, assignees) ?? JOB_STATUS.PENDING,
      result
    });

    return job;
  }
};
