import path from 'path';

import { ApplicationOptions, Plugin } from '@nocobase/server';
import { MockServer, mockServer } from '@nocobase/test';

import functions from './functions';
import instructions from './instructions';

interface MockServerOptions extends ApplicationOptions {
  autoStart?: boolean;
  collectionsPath?: string;
  cleanDb?: boolean;
}

async function createMockServer({ ...options }: MockServerOptions) {
  const app = mockServer(options);
  await app.cleanDb();
  await app.runCommand('start', '--quickstart');
  return app;
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getApp(options: MockServerOptions = {}): Promise<MockServer> {
  const { plugins = [], collectionsPath, ...others } = options;
  class TestCollectionPlugin extends Plugin {
    async load() {
      if (collectionsPath) {
        await this.db.import({ directory: collectionsPath });
      }
    }
  }
  return createMockServer({
    ...others,
    plugins: [
      [
        'workflow',
        {
          instructions,
          functions,
        },
      ],
      WorkflowTestPlugin,
      TestCollectionPlugin,
      ...plugins,
    ],
  });
}

export default class WorkflowTestPlugin extends Plugin {
  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }
}
