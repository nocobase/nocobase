/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sleep } from '@nocobase/test';
import { lodash } from '@nocobase/utils';

export default {
  echo: {
    run({ config = {} }: any, { result }, processor) {
      return {
        status: 1,
        result: config.path == null ? result : lodash.get(result, config.path),
      };
    },
    duplicateConfig(node, { origin }) {
      if (origin?.config?.duplicateFlag) {
        return {
          ...origin.config,
          duplicated: true,
        };
      }
      return origin?.config ?? node.config;
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
    resume(node, job) {
      if (node.config.status != null) {
        job.set('status', node.config.status);
      }
      return job;
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

  asyncResume: {
    async run(node, input, processor) {
      const job = processor.saveJob({
        status: 0,
        nodeId: node.id,
        nodeKey: node.key,
        upstreamId: input?.id ?? null,
      });

      const plugin = processor.options.plugin;
      setTimeout(() => {
        // Check if app is still running before resuming to avoid "Database handle is closed" error
        if (!plugin.app || plugin.app.stopped) {
          return;
        }

        job.set({
          status: 1,
        });

        plugin.resume(job);
      }, node.config.duration ?? 100);

      return null;
    },
    resume(node, job, processor) {
      return job;
    },
  },

  timeConsume: {
    async run({ config }, input, processor) {
      const { duration = 1000 } = config;
      await sleep(duration);
      return {
        status: 1,
      };
    },
  },

  recordAppId: {
    run(node, input, processor) {
      return {
        status: 1,
        result: processor.options.plugin.app.instanceId,
      };
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
