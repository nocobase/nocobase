/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { UserDataResourceManager } from '../user-data-resource-manager';
import { MockUsersResource } from './mock-resource';
import PluginUserDataSyncServer from '../plugin';

describe('api', async () => {
  let app: MockServer;
  let agent: any;
  let resourceManager: UserDataResourceManager;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-sort', 'user-data-sync'],
    });
    agent = app.agent();
    const plugin = app.pm.get('user-data-sync') as PluginUserDataSyncServer;
    resourceManager = plugin.resourceManager;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('push data', async () => {
    const usersResource = new MockUsersResource(app.db, app.logger);
    resourceManager.registerResource(usersResource);
    const res = await agent.resource('userData').push({
      values: {
        dataType: 'user',
        records: [
          {
            uid: '1',
            nickname: 'test',
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(usersResource.data.length).toBe(1);
    expect(usersResource.data[0]).toMatchObject({
      uid: '1',
      nickname: 'test',
    });
  });
});
