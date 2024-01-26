import { lodash } from '@nocobase/utils';

export default {
  echo: {
    run({ config = {} }: any, { result }, processor) {
      return {
        status: 1,
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
        status: 0,
      };
    },
  },

  prompt: {
    run(node, input, processor) {
      return {
        status: 0,
      };
    },
    resume(node, job, processor) {
      return job.set({
        status: 1,
      });
    },
  },

  'prompt->error': {
    run(node, input, processor) {
      return {
        status: 0,
      };
    },
    resume(node, input, processor) {
      throw new Error('input failed');
      return null;
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
