import path from 'path';
import { MockServer, mockServer } from '@nocobase/test';

import Plugin from '..';
import { JOB_STATUS } from '../constants';
import calculators from '../calculators';

export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export async function getApp(options = {}): Promise<MockServer> {
  const app = mockServer(options);

  app.plugin(Plugin, {
    instructions: {
      echo: {
        run({ result }, execution) {
          return {
            status: JOB_STATUS.RESOLVED,
            result
          };
        }
      },

      error: {
        run(input, execution) {
          throw new Error('definite error');
        }
      },

      'prompt->error': {
        run(this, input, execution) {
          return {
            status: JOB_STATUS.PENDING
          };
        },
        resume(this, input, execution) {
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

  await app.start();

  return app;
}
