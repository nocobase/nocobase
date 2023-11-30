import lodash from 'lodash';

import { ApplicationOptions } from '@nocobase/server';
import { MockServer, mockServer } from '@nocobase/test';

import Plugin from '..';
import { JOB_STATUS } from './constants';
import type { FlowNodeModel } from './types';

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface MockAppOptions extends ApplicationOptions {
  manual?: boolean;
  collectionPath?: string;
}

export async function getApp({
  manual,
  collectionPath,
  plugins = [],
  ...options
}: MockAppOptions = {}): Promise<MockServer> {
  plugins.unshift([
    Plugin,
    {
      name: 'workflow',
      instructions: {
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
      },
      functions: {
        no1: () => 1,
      },
    },
  ]);
  const app = mockServer({ ...options, plugins });

  await app.load();

  if (collectionPath) {
    await app.db.import({
      directory: collectionPath,
    });
  }

  try {
    await app.db.sync();
  } catch (error) {
    console.error(error);
  }

  if (!manual) {
    await app.start();
  }

  return app;
}
