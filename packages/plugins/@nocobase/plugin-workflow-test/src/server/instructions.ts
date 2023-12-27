import { Instruction } from '@nocobase/plugin-workflow';
import { lodash } from '@nocobase/utils';

export default {
  echo: class extends Instruction {
    run({ config = {} }: any, { result }, processor) {
      return {
        status: 1,
        result: config.path == null ? result : lodash.get(result, config.path),
      };
    }
  },

  error: class extends Instruction {
    run(node, input, processor) {
      throw new Error('definite error');
      return null;
    }
  },

  pending: class extends Instruction {
    run(node, input, processor) {
      return {
        status: 0,
      };
    }
  },

  prompt: class extends Instruction {
    run(node, input, processor) {
      return {
        status: 0,
      };
    }
    resume(node, job, processor) {
      return job.set({
        status: 1,
      });
    }
  },

  'prompt->error': class extends Instruction {
    run(node, input, processor) {
      return {
        status: 0,
      };
    }
    resume(node, input, processor) {
      throw new Error('input failed');
      return null;
    }
  },

  customizedSuccess: class extends Instruction {
    run(node, input, processor) {
      return {
        status: 100,
      };
    }
  },

  customizedError: class extends Instruction {
    run(node, input, processor) {
      return {
        status: -100,
      };
    }
  },
};
