/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import { InAppMessagesDefinition as MessagesDefinition } from '../../types';
import defineMyInAppChannels from '../defineMyInAppChannels';
import { ChannelsCollectionDefinition as ChannelsDefinition } from '@nocobase/plugin-notification-manager';

describe('inapp message channels', () => {
  let app: MockServer;
  let db: Database;
  let UserRepo;
  let users;
  let userAgents;
  let channelsRepo;
  let messagesRepo;
  let currUserAgent;
  let currUserId;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth', 'notification-manager', 'notification-in-app'],
    });
    await app.pm.get('auth')?.install();
    db = app.db;
    UserRepo = db.getCollection('users').repository;
    channelsRepo = db.getRepository(ChannelsDefinition.name);
    const messagesRepo = db.getRepository(MessagesDefinition.name);

    users = await UserRepo.create({
      values: [
        { id: 2, nickname: 'a', roles: [{ name: 'root' }] },
        { id: 3, nickname: 'b' },
      ],
    });

    userAgents = users.map((user) => app.agent().login(user));
    currUserAgent = userAgents[0];
    currUserId = users[0].id;
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('myInappChannels', async () => {
    beforeEach(async () => {
      await channelsRepo.destroy({ truncate: true });
      await messagesRepo.destroy({ truncate: true });
    });
    test('user can get own channels', async () => {
      defineMyInAppChannels({ app });
      await channelsRepo.create({
        values: [
          {
            id: '3f04ebff-25fe-4e98-9dcc-e3f2b9ebecc3',
            senderId: 'c72b1bb7-664f-4f7e-a08a-9bfae1bd78d9',
            userId: 2,
            title: '测试1',
          },
          {
            id: '3f04ebff-25fe-4e98-9dcc-e3f2b9ebefff',
            senderId: 'c72b1bb7-664f-4f7e-a08a-9bfae1bd7fff',
            userId: 3,
            title: '测试2',
          },
        ],
      });
      const res = await userAgents[0].resource('myInAppChannels').list();
      expect(res.body.data.length).toBe(1);
    });

    test('filter channels by status', async () => {});
  });
});
