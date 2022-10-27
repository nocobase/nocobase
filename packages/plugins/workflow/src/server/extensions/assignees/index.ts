import path from 'path';

import { requireModule } from '@nocobase/utils';
import { Context } from '@nocobase/actions';

import Plugin from '../../Plugin';
import Prompt, { PromptConfig } from '../../instructions/prompt';
import { submit } from './actions';
import { JOB_STATUS } from '../../constants';



interface AssignedPromptConfig extends PromptConfig {
  assignees?: number[];
  mode?: number;
}

// NOTE: for single record mode (mode: 0/null)
async function middleware(context: Context, next) {
  const { body: job, state, action } = context;
  const { assignees, mode } = job.node.config as AssignedPromptConfig;

  // NOTE: skip to no user implementation
  if (!assignees) {
    return next();
  }

  if (!state.currentUser) {
    return context.throw(401);
  }

  if (!assignees.includes(state.currentUser.id)) {
    return context.throw(404);
  }

  // NOTE: multiple record mode could not use jobs:submit action
  // should use users_jobs:submit/:id instead
  if (mode) {
    return context.throw(400);
  }

  await next();

  const data = {
    userId: context.state.currentUser.id,
    jobId: job.id,
    nodeId: job.nodeId,
    executionId: job.executionId,
    workflowId: job.execution.workflowId,
    status: job.status,
    result: job.result
  };

  // NOTE: update users job after main job is done
  const UserJobModel = context.db.getModel('users_jobs');
  let userJob = await UserJobModel.findOne({
    where: {
      userId: context.state.currentUser.id,
      jobId: job.id,
    }
  });
  if (userJob) {
    await userJob.update(data);
  } else {
    userJob = await UserJobModel.create(data);
  }
}

async function run(node, prevJob, processor) {
  const { assignees, mode } = node.config as AssignedPromptConfig;
  if (!assignees) {
    const { plugin } = processor.options;
    const origin = plugin.instructions.get('prompt') as Prompt;
    return origin.constructor.prototype.run.call(this, node, prevJob, processor);
  }

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

async function resume(node, job, processor) {
  // NOTE: check all users jobs related if all done then continue as parallel
  const { assignees, mode } = node.config as AssignedPromptConfig;

  if (!assignees) {
    const { plugin } = processor.options;
    const origin = plugin.instructions.get('prompt') as Prompt;
    return origin.constructor.prototype.resume.call(this, node, job, processor);
  }

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

export default async function(plugin: Plugin) {
  const instruction = plugin.instructions.get('prompt') as Prompt;
  instruction.extend({
    run,
    resume
  });

  instruction.use(middleware);

  // TODO(bug): through table should be load first because primary
  // await plugin.db.import({
  //   directory: path.join(__dirname, './collections')
  // });
  plugin.db.collection(requireModule(path.join(__dirname, './collections/users_jobs')));
  plugin.db.extendCollection(requireModule(path.join(__dirname, './collections/users')));
  plugin.db.extendCollection(requireModule(path.join(__dirname, './collections/jobs')));

  plugin.app.actions({
    'users_jobs:submit': submit
  });
}
