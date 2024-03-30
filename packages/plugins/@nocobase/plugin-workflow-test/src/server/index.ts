import path from 'path';

import { ApplicationOptions, Plugin } from '@nocobase/server';
import { MockServer, createMockServer, mockDatabase } from '@nocobase/test';

import functions from './functions';
import triggers from './triggers';
import instructions from './instructions';
import { Resourcer } from '@nocobase/resourcer';
import { SequelizeDataSource } from '@nocobase/data-source-manager';
import { uid } from '@nocobase/utils';

export interface MockServerOptions extends ApplicationOptions {
  collectionsPath?: string;
}

// async function createMockServer(options: MockServerOptions) {
//   const app = mockServer(options);
//   await app.cleanDb();
//   await app.runCommand('start', '--quickstart');
//   return app;
// }

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
  const app = await createMockServer({
    ...others,
    plugins: [
      [
        'workflow',
        {
          triggers,
          instructions,
          functions,
        },
      ],
      'workflow-test',
      TestCollectionPlugin,
      ...plugins,
    ],
  });

  await app.dataSourceManager.add(
    new SequelizeDataSource({
      name: 'another',
      collectionManager: {
        database: mockDatabase({
          tablePrefix: `t${uid(5)}`,
        }),
      },
      resourceManager: {},
    }),
  );
  const another = app.dataSourceManager.dataSources.get('another');
  // @ts-ignore
  const anotherDB = another.collectionManager.db;

  await anotherDB.import({
    directory: path.resolve(__dirname, 'collections'),
  });
  await anotherDB.sync();

  another.acl.allow('*', '*');

  return app;
}

export default class WorkflowTestPlugin extends Plugin {
  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));
  }
}
