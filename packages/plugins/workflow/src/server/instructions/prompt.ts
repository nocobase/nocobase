import compose from 'koa-compose';

import { Context, utils } from '@nocobase/actions';

import Plugin from '..';
import { JOB_STATUS } from "../constants";
import { Instruction } from '.';



export interface PromptConfig {
  fields: [];
  actions;
}

async function loadJob(context: Context, next) {
  const { filterByTk, values } = context.action.params;
  if (!context.body) {
    const jobRepo = utils.getRepositoryFromParams(context);
    const job = await jobRepo.findOne({
      filterByTk,
      appends: ['node', 'execution'],
      context
    });

    if (!filterByTk || !job) {
      return context.throw(404);
    }

    // cache
    context.body = job;
  }

  const { type, config } = context.body.node;
  if (type === 'prompt'
    && config.actions
    && !config.actions[values.status]) {
    return context.throw(400);
  }

  await next();
}

export default class implements Instruction {
  middlewares = [];

  constructor(protected plugin: Plugin) {
    plugin.app.resourcer.use(this.middleware);
  }

  middleware = async (context: Context, next) => {
    const { actionName, resourceName } = context.action;
    if (actionName === 'submit'
      && resourceName === 'jobs'
      // && this.middlewares.length
    ) {
      return compose([loadJob, ...this.middlewares])(context, next);
    }
    await next();
  };

  use(middleware) {
    this.middlewares.push(middleware);
  }

  run(node, input, processor) {
    return {
      status: JOB_STATUS.PENDING
    };
  }

  resume(node, job, processor) {
    if (!node.config.actions) {
      job.set('status', JOB_STATUS.RESOLVED);
    }
    return job;
  }

  extend(options: Instruction) {
    Object.assign(this, options);
  }
};
