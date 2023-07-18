import { ApplicationOptions } from '@nocobase/server';
import { MockServer, mockServer } from '@nocobase/test';
import { lodash } from '@nocobase/utils';
import Plugin from '..';
import { default as WorkflowPlugin, JOB_STATUS } from '@nocobase/plugin-workflow';
import type { FlowNodeModel } from '@nocobase/plugin-workflow';

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface MockAppOptions extends ApplicationOptions {
  manual?: boolean;
}

export async function getApp({ manual, ...options }: MockAppOptions = {}): Promise<MockServer> {
  const app = mockServer(options);

  app.plugin(WorkflowPlugin, {
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
    },
    functions: {
      no1: () => 1,
    },
  });

  app.plugin(Plugin);

  await app.load();

  // await app.db.import({
  //   directory: path.resolve(__dirname, './collections'),
  // });

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
