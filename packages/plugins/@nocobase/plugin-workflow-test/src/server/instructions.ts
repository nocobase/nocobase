/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { lodash } from '@nocobase/utils';

export default {
  echo: {
    run({ config = {} }: any, { result }, processor) {
      return {
        status: 1,
        result: config.path == null ? result : lodash.get(result, config.path),
      };
    },
    test(config = {}) {
      return {
        status: 1,
        result: null,
      };
    },
  },

  echoVariable: {
    run({ id, config = {} }: any, job, processor) {
      return {
        status: 1,
        result: config.variable ? processor.getParsedValue(config.variable, id) : null,
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
    test() {
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
