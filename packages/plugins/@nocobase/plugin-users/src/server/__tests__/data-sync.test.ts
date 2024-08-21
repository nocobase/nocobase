/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UserDataResourceManager } from '@nocobase/plugin-user-data-sync';
import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import PluginUserDataSyncServer from 'packages/plugins/@nocobase/plugin-user-data-sync/src/server/plugin';

describe('user data sync', () => {
  let app: MockServer;
  let db: MockDatabase;
  let resourceManager: UserDataResourceManager;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['user-data-sync', 'users'],
    });
    db = app.db;
    const plugin = app.pm.get('user-data-sync') as PluginUserDataSyncServer;
    resourceManager = plugin.resourceManager;
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  it('should create user', async () => {
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'user',
      uniqueKey: 'email',
      records: [
        {
          id: 1,
          nickname: 'test',
          email: 'test@nocobase.com',
        },
      ],
    });
    const user = await db.getRepository('users').findOne({
      filter: {
        email: 'test@nocobase.com',
      },
    });
    expect(user).toBeTruthy();
    expect(user.nickname).toBe('test');
  });

  it('should update existing user when creating', async () => {
    const user = await db.getRepository('users').create({
      values: {
        email: 'test@nocobase.com',
      },
    });
    expect(user.nickname).toBeFalsy();
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'user',
      uniqueKey: 'email',
      records: [
        {
          id: 1,
          nickname: 'test',
          email: 'test@nocobase.com',
        },
      ],
    });
    const user2 = await db.getRepository('users').findOne({
      filter: {
        id: user.id,
      },
    });
    expect(user2).toBeTruthy();
    expect(user2.nickname).toBe('test');
  });

  it('shoud update user', async () => {
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'user',
      uniqueKey: 'email',
      records: [
        {
          id: 1,
          nickname: 'test',
          email: 'test@nocobase.com',
        },
      ],
    });
    const user = await db.getRepository('users').findOne({
      filter: {
        email: 'test@nocobase.com',
      },
    });
    expect(user).toBeTruthy();
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'user',
      uniqueKey: 'email',
      records: [
        {
          id: 1,
          nickname: 'test2',
          email: 'test@nocobase.com',
        },
      ],
    });
    const user2 = await db.getRepository('users').findOne({
      filter: {
        id: user.id,
      },
    });
    expect(user2).toBeTruthy();
    expect(user2.nickname).toBe('test2');
  });
});