/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';

import { ApplicationOptions, Plugin } from '@nocobase/server';
import {
  MockClusterOptions,
  MockServer,
  MockServerOptions,
  createMockCluster,
  createMockDatabase,
  createMockServer,
  mockDatabase,
  sleep,
} from '@nocobase/test';

import { SequelizeCollectionManager, SequelizeDataSource } from '@nocobase/data-source-manager';
import { uid } from '@nocobase/utils';
import functions from './functions';
import instructions from './instructions';
import triggers from './triggers';
import { getConfigByEnv } from '@nocobase/database';
export { sleep } from '@nocobase/test';

type WorkflowMockServerOptions = ApplicationOptions &
  MockServerOptions & {
    collectionsPath?: string;
  };

type WorkflowMockClusterOptions = MockClusterOptions & {
  collectionsPath?: string;
};

class TestCollectionPlugin extends Plugin {
  async load() {
    if (this.options.collectionsPath) {
      await this.db.import({ directory: this.options.collectionsPath });
    }
  }
}

export async function getApp({
  plugins = [],
  collectionsPath,
  ...options
}: WorkflowMockServerOptions = {}): Promise<MockServer> {
  const app = await createMockServer({
    ...options,
    plugins: [
      'field-sort',
      'file-manager',
      'system-settings',
      'users',
      'auth',
      'acl',
      'data-source-manager',
      [
        'workflow',
        {
          triggers,
          instructions,
          functions,
        },
      ],
      'workflow-test',
      [TestCollectionPlugin, { collectionsPath }],
      ...plugins,
    ],
  });

  app.dataSourceManager.factory.register('sequelize', SequelizeDataSource);
  const DataSourceRepo = app.db.getRepository('dataSources');
  await DataSourceRepo.create({
    values: {
      key: 'another',
      name: 'Another Data Source',
      type: 'sequelize',
      options: {
        collectionManager: {
          ...getConfigByEnv(),
          tablePrefix: `t${uid(5)}`,
        },
      },
    },
  });
  const loadStart = Date.now();
  let another = app.dataSourceManager.dataSources.get('another');
  // NOTE: wait for the data source to be loaded asynchronously
  while (!another?.collectionManager) {
    if (Date.now() - loadStart >= 5000) {
      throw new Error('Timed out waiting for the "another" data source to load');
    }
    await sleep(1000);
    another = app.dataSourceManager.dataSources.get('another');
  }

  const anotherDB = (another.collectionManager as SequelizeCollectionManager).db;

  await anotherDB.import({
    directory: path.resolve(__dirname, 'collections'),
  });
  await anotherDB.sync();

  return app;
}

export async function getCluster({ plugins = [], collectionsPath, ...options }: WorkflowMockClusterOptions) {
  return createMockCluster({
    ...options,
    plugins: [
      'field-sort',
      [
        'workflow',
        {
          triggers,
          instructions,
          functions,
        },
      ],
      'workflow-test',
      [TestCollectionPlugin, { collectionsPath }],
      ...plugins,
    ],
  });
}

export default class WorkflowTestPlugin extends Plugin {
  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));
  }
}
