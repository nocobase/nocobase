/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockCluster, MockCluster, sleep } from '@nocobase/test';

describe('cluster', () => {
  let cluster: MockCluster;
  beforeEach(async () => {
    cluster = await createMockCluster({
      plugins: ['acl', 'field-sort', 'error-handler', 'data-source-main', 'data-source-manager', 'ui-schema-storage'],
      acl: false,
    });
  });

  afterEach(async () => {
    await cluster.destroy();
  });

  it('should sync roles when snippet update', async () => {
    const [app1, app2] = cluster.nodes;

    await app1.db.getRepository('roles').create({
      values: {
        name: 'role1',
        snippets: ['test1'],
      },
    });

    const role1 = app1.acl.getRole('role1');
    expect(role1.snippets.has('test1')).toBeTruthy();

    // update snippet
    await app1.db.getRepository('roles').update({
      filter: {
        name: 'role1',
      },
      values: {
        snippets: ['test2'],
      },
    });
    await sleep(2000);
    expect(role1.snippets.has('test2')).toBeTruthy();

    const role1InApp2 = app2.acl.getRole('role1');
    expect(role1InApp2.snippets.has('test2')).toBeTruthy();
  });
});
