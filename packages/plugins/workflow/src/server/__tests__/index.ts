import path from 'path';

import { ApplicationOptions } from '@nocobase/server';
import { MockServer, mockServer } from '@nocobase/test';

import Plugin from '..';
import { JOB_STATUS } from '../constants';

export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

interface MockAppOptions extends ApplicationOptions {
  manual?: boolean;
}

export async function getApp({ manual, ...options }: MockAppOptions = {}): Promise<MockServer> {
  const app = mockServer(options);

  app.plugin(Plugin, {
    name: 'workflow',
    instructions: {
      echo: {
        run(node, { result }, processor) {
          return {
            status: JOB_STATUS.RESOLVED,
            result
          };
        }
      },

      error: {
        run(node, input, processor) {
          throw new Error('definite error');
        }
      },

      'prompt->error': {
        run(node, input, processor) {
          return {
            status: JOB_STATUS.PENDING
          };
        },
        resume(node, input, processor) {
          throw new Error('input failed');
        }
      },

      customizedSuccess: {
        run(node, input, processor) {
          return {
            status: 100
          }
        }
      },

      customizedError: {
        run(node, input, processor) {
          return {
            status: -100
          }
        }
      },
    },
    functions: {
      no1: () => 1
    }
  });

  await app.load();

  await app.db.import({
    directory: path.resolve(__dirname, './collections')
  });

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
