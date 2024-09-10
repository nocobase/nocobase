/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockCluster, waitSecond } from '@nocobase/test';

describe('cluster', () => {
  let cluster;
  beforeEach(async () => {
    cluster = await createMockCluster({
      plugins: ['nocobase'],
      acl: false,
    });

    for (const node of cluster.nodes) {
      node.registerMockDataSource();
    }
  });

  afterEach(async () => {
    await cluster.destroy();
  });

  test('create data source', async () => {
    const app1 = cluster.nodes[0];

    await app1.db.getRepository('dataSources').create({
      values: {
        key: 'mockInstance1',
        type: 'mock',
        displayName: 'Mock',
        options: {},
      },
    });

    await waitSecond(2000);

    const dataSource = app1.dataSourceManager.get('mockInstance1');
    expect(dataSource).toBeDefined();

    const dataSourceInApp2 = cluster.nodes[1].dataSourceManager.get('mockInstance1');
    expect(dataSourceInApp2).toBeDefined();
  });
});
