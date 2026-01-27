/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { createMockCluster, waitSecond } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import { PluginMultiAppManagerServer } from '../server';

describe('cluster', () => {
  let cluster;
  beforeEach(async () => {
    PluginMultiAppManagerServer.staticImport();
    cluster = await createMockCluster({
      plugins: ['nocobase', 'field-sort', 'multi-app-manager'],
      acl: false,
    });
  });

  afterEach(async () => {
    await cluster.destroy();
  });

  it('should start sub app after app created between nodes', async () => {
    const [app1, app2] = cluster.nodes;
    const name = `td_${uid()}`;

    const fn = vi.fn();

    await app2.syncMessageManager.subscribe(
      'app_supervisor:sync',
      async (message: { type: string; appName: string }) => {
        const { type } = message;
        if (type === 'app:started') {
          fn(name);
        }
      },
    );

    await app1.db.getRepository('applications').create({
      values: {
        name,
        options: {
          skipSupervisor: true,
          plugins: [],
          database: {
            underscored: true,
          },
        },
      },
      context: {
        waitSubAppInstall: true,
      },
    });

    await waitSecond(5000);
    expect(fn).toBeCalledWith(name);
  });
});
