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
import { createMessages } from './mock/db-funcs';
import defineMyInAppMessages from '../defineMyInAppMessages';

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
      plugins: ['field-sort', 'users', 'auth', 'notification-manager', 'notification-in-app-message'],
    });
    await app.pm.get('auth')?.install();
    db = app.db;
    UserRepo = db.getCollection('users').repository;
    channelsRepo = db.getRepository(ChannelsDefinition.name);
    messagesRepo = db.getRepository(MessagesDefinition.name);

    users = await UserRepo.create({
      values: [
        { id: 2, nickname: 'a', roles: [{ name: 'root' }] },
        { id: 3, nickname: 'b' },
      ],
    });

    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));
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
    test('user can get own channels and messages', async () => {
      defineMyInAppChannels(app);
      defineMyInAppMessages(app);
      const channelsRes = await channelsRepo.create({
        values: [
          {
            title: '测试渠道2(userId=2)',
            notificationType: 'in-app-message',
          },
          {
            title: '测试渠道3(userId=3)',
            notificationType: 'in-app-message',
          },
        ],
      });
      await createMessages(
        { messagesRepo },
        { unreadNum: 2, readNum: 2, channelName: channelsRes[0].name, startTimeStamp: Date.now(), userId: users[0].id },
      );
      await createMessages(
        { messagesRepo },
        { unreadNum: 2, readNum: 2, channelName: channelsRes[0].name, startTimeStamp: Date.now(), userId: users[1].id },
      );
      const res = await userAgents[0].resource('myInAppChannels').list();
      expect(res.body.data.length).toBe(1);
      const myMessages = await userAgents[0].resource('myInAppMessages').list();
      expect(myMessages.body.data.messages.length).toBe(4);
    });

    test('user can get own channel latestMesageTitle and latestMesageTimestamp', async () => {
      defineMyInAppChannels(app);
      defineMyInAppMessages(app);
      const channelsRes = await channelsRepo.create({
        values: [
          {
            title: '测试渠道',
            notificationType: 'in-app-message',
          },
        ],
      });
      const now = Date.now();
      await messagesRepo.create({
        values: [
          {
            channelName: channelsRes[0].name,
            userId: users[0].id,
            status: 'unread',
            title: 'user-0',
            content: 'unread',
            receiveTimestamp: now,
            options: {
              url: '/admin/pages',
            },
          },
          {
            channelName: channelsRes[0].name,
            userId: users[1].id,
            status: 'unread',
            title: 'user-1',
            content: 'unread',
            receiveTimestamp: now + 1000,
            options: {
              url: '/admin/pages',
            },
          },
          {
            channelName: channelsRes[0].name,
            userId: users[1].id,
            status: 'read',
            title: 'user-1',
            content: 'read',
            receiveTimestamp: now + 1001,
            options: {
              url: '/admin/pages',
            },
          },
        ],
      });

      const res = await userAgents[0].resource('myInAppChannels').list();
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].latestMsgTitle).toBe('user-0');
      expect(res.body.data[0].unreadMsgCnt).toBe(1);
      expect(res.body.data[0].latestMsgReceiveTimestamp).toBe(now);
    });

    test('filter channel by status', async () => {
      const channels = await channelsRepo.create({
        values: [
          {
            title: 'read_channel',
            notificationType: 'in-app-message',
          },
          {
            title: 'unread_channel',
            notificationType: 'in-app-message',
          },
          {
            title: 'mix_channel',
            notificationType: 'in-app-message',
          },
        ],
      });
      const allReadChannel = channels.find((channel) => channel.title === 'read_channel');
      const allUnreadChannel = channels.find((channel) => channel.title === 'unread_channel');
      const mixChannel = channels.find((channel) => channel.title === 'mix_channel');
      await createMessages(
        { messagesRepo },
        { unreadNum: 0, readNum: 4, channelName: allReadChannel.name, startTimeStamp: Date.now(), userId: currUserId },
      );

      await createMessages(
        { messagesRepo },
        {
          unreadNum: 4,
          readNum: 0,
          channelName: allUnreadChannel.name,
          startTimeStamp: Date.now(),
          userId: currUserId,
        },
      );

      await createMessages(
        { messagesRepo },
        {
          unreadNum: 2,
          readNum: 2,
          channelName: mixChannel.name,
          startTimeStamp: Date.now(),
          userId: currUserId,
        },
      );
      const readChannelsRes = await currUserAgent.resource('myInAppChannels').list({ filter: { status: 'read' } });
      const unreadChannelsRes = await currUserAgent.resource('myInAppChannels').list({ filter: { status: 'unread' } });
      const allChannelsRes = await currUserAgent.resource('myInAppChannels').list({ filter: { status: 'all' } });
      [allReadChannel, mixChannel].forEach((channel) => {
        expect(readChannelsRes.body.data.map((channel) => channel.name)).toContain(channel.name);
      });

      [allUnreadChannel, mixChannel].forEach((channel) => {
        expect(unreadChannelsRes.body.data.map((channel) => channel.name)).toContain(channel.name);
      });
      expect(allChannelsRes.body.data.length).toBe(3);
    });
    // test('channel last receive timestamp filter', () => {
    //   const currentTS = Date.now();
    // });
  });
});
