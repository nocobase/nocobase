import { lodash } from '@nocobase/utils';
import { FlowNodeModel, JOB_STATUS } from '@nocobase/plugin-workflow';

export default {
  echo: {
    run({ config = {} }: FlowNodeModel, { result }, processor) {
      return {
        status: JOB_STATUS.RESOLVED,
        result: config.path == null ? result : lodash.get(result, config.path),
      };
    },
  },

  error: {
    run(node, input, processor) {
      throw new Error('definite error');
    },
  },

  pending: {
    run(node, input, processor) {
      return {
        status: JOB_STATUS.PENDING,
      };
    },
  },

  prompt: {
    run(node, input, processor) {
      return {
        status: JOB_STATUS.PENDING,
      };
    },
    resume(node, job, processor) {
      return job.set({
        status: JOB_STATUS.RESOLVED,
      });
    },
  },

  'prompt->error': {
    run(node, input, processor) {
      return {
        status: JOB_STATUS.PENDING,
      };
    },
    resume(node, input, processor) {
      throw new Error('input failed');
    },
  },

  customizedSuccess: {
    run(node, input, processor) {
      return {
        status: 100,
      };
    },
  },

  customizedError: {
    run(node, input, processor) {
      return {
        status: -100,
      };
    },
  },
};
