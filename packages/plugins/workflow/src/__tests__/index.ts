import path from 'path';
import { MockServer, mockServer } from '@nocobase/test';

import Plugin from '..';
import { JOB_STATUS } from '../constants';
import calculators from '../calculators';
import { ApplicationOptions } from '@nocobase/server';

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
    instructions: {
      echo: {
        run(node, { result }, execution) {
          return {
            status: JOB_STATUS.RESOLVED,
            result
          };
        }
      },

      error: {
        run(node, input, execution) {
          throw new Error('definite error');
        }
      },

      'prompt->error': {
        run(node, input, execution) {
          return {
            status: JOB_STATUS.PENDING
          };
        },
        resume(node, input, execution) {
          throw new Error('input failed');
        }
      }
    }
  });

  if (!calculators.get('no1')) {
    calculators.register('no1', () => 1);
  }

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
