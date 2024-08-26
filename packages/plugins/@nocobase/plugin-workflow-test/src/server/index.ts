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
import { MockClusterOptions, MockServer, createMockCluster, createMockServer, mockDatabase } from '@nocobase/test';

import functions from './functions';
import triggers from './triggers';
import instructions from './instructions';
import { SequelizeDataSource } from '@nocobase/data-source-manager';
import { uid } from '@nocobase/utils';
export { sleep } from '@nocobase/test';

interface WorkflowMockServerOptions extends ApplicationOptions {
  collectionsPath?: string;
}

interface WorkflowMockClusterOptions extends MockClusterOptions {
  collectionsPath?: string;
}

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

export async function getCluster({ plugins = [], collectionsPath, ...options }: WorkflowMockClusterOptions) {
  return createMockCluster({
    ...options,
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
