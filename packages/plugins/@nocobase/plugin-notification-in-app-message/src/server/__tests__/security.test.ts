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

describe('notificationInAppMessages vulnerability', () => {
  let app: MockServer;
  let db: Database;
  let UserRepo;
  let users;
  let userAgents;
  let messagesRepo;

  beforeEach(async () => {
    app = await createMockServer({
      acl: true,
      plugins: [
        'acl',
        'error-handler',
        'field-sort',
        'users',
        'ui-schema-storage',
        'data-source-main',
        'auth',
        'data-source-manager',
        'collection-tree',
        'system-settings',
        'notification-manager',
        'notification-in-app-message',
      ],
    });
    await app.pm.get('auth')?.install();
    db = app.db;
    UserRepo = db.getCollection('users').repository;
    messagesRepo = db.getRepository(MessagesDefinition.name);

    users = await UserRepo.create({
      values: [
        { id: 2, nickname: 'user1', roles: [{ name: 'member' }] },
        { id: 3, nickname: 'user2', roles: [{ name: 'member' }] },
      ],
    });

    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('user2 should NOT be able to list user1 messages via notificationInAppMessages', async () => {
    await messagesRepo.create({
      values: [
        {
          userId: users[0].id,
          status: 'unread',
          title: 'message for user1',
          content: 'secret content',
          receiveTimestamp: Date.now(),
        },
      ],
    });

    // user2 tries to list all messages
    const res = await userAgents[1].resource('notificationInAppMessages').list();

    // After fixed, it should be forbidden
    expect(res.status).toBe(403);
  });

  test('user2 should NOT be able to update user1 messages via notificationInAppMessages:update', async () => {
    const msg = await messagesRepo.create({
      values: {
        userId: users[0].id,
        status: 'unread',
        title: 'message for user1',
        content: 'secret content',
        receiveTimestamp: Date.now(),
      },
    });

    // user2 tries to update user1's message
    const res = await userAgents[1].resource('notificationInAppMessages').update({
      filterByTk: msg.id,
      values: {
        status: 'read',
      },
    });

    // After fixed, it should be forbidden
    expect(res.status).toBe(403);

    const updatedMsg = await messagesRepo.findOne({ filterByTk: msg.id });
    expect(updatedMsg.status).toBe('unread');
  });

  test('user1 should be able to list own messages via myInAppMessages', async () => {
    await messagesRepo.create({
      values: {
        userId: users[0].id,
        status: 'unread',
        title: 'message for user1',
        content: 'content',
        receiveTimestamp: Date.now(),
      },
    });

    const res = await userAgents[0].resource('myInAppMessages').list();
    expect(res.status).toBe(200);
    expect(res.body.data.messages.length).toBe(1);
    expect(res.body.data.messages[0].title).toBe('message for user1');
  });

  test('user1 should be able to update own message via notificationInAppMessages:updateMyOwn', async () => {
    const msg = await messagesRepo.create({
      values: {
        userId: users[0].id,
        status: 'unread',
        title: 'message for user1',
        content: 'content',
        receiveTimestamp: Date.now(),
      },
    });

    const res = await userAgents[0].resource('notificationInAppMessages').updateMyOwn({
      filterByTk: msg.id,
      values: {
        status: 'read',
      },
    });

    expect(res.status).toBe(200);
    const updatedMsg = await messagesRepo.findOne({ filterByTk: msg.id });
    expect(updatedMsg.status).toBe('read');
  });

  test('user2 should NOT be able to update user1 message via notificationInAppMessages:updateMyOwn', async () => {
    const msg = await messagesRepo.create({
      values: {
        userId: users[0].id,
        status: 'unread',
        title: 'message for user1',
        content: 'content',
        receiveTimestamp: Date.now(),
      },
    });

    const res = await userAgents[1].resource('notificationInAppMessages').updateMyOwn({
      filterByTk: msg.id,
      values: {
        status: 'read',
      },
    });

    // updateMyOwn uses filter: { userId } so it should not find the record, status 200 but nothing updated
    expect(res.status).toBe(200);

    const updatedMsg = await messagesRepo.findOne({ filterByTk: msg.id });
    expect(updatedMsg.status).toBe('unread');
  });

  test('user2 should NOT be able to get user1 message via notificationInAppMessages:get', async () => {
    const msg = await messagesRepo.create({
      values: {
        userId: users[0].id,
        status: 'unread',
        title: 'message for user1',
        content: 'secret content',
        receiveTimestamp: Date.now(),
      },
    });

    const res = await userAgents[1].resource('notificationInAppMessages').get({
      filterByTk: msg.id,
    });

    expect(res.status).toBe(403);
  });

  test('user2 should NOT be able to destroy user1 message via notificationInAppMessages:destroy', async () => {
    const msg = await messagesRepo.create({
      values: {
        userId: users[0].id,
        status: 'unread',
        title: 'message for user1',
        content: 'secret content',
        receiveTimestamp: Date.now(),
      },
    });

    const res = await userAgents[1].resource('notificationInAppMessages').destroy({
      filterByTk: msg.id,
    });

    expect(res.status).toBe(403);

    const stillExists = await messagesRepo.findOne({ filterByTk: msg.id });
    expect(stillExists).not.toBeNull();
  });

  test('user2 should NOT be able to create messages via notificationInAppMessages:create', async () => {
    const res = await userAgents[1].resource('notificationInAppMessages').create({
      values: {
        userId: users[0].id,
        status: 'unread',
        title: 'fake message',
        content: 'injected content',
        receiveTimestamp: Date.now(),
      },
    });

    expect(res.status).toBe(403);
  });

  test('updateMyOwn with filter should only affect own messages (markAllAsRead scenario)', async () => {
    const channelName = 'test-channel';
    // Create unread messages for both users under the same channel
    const msg1 = await messagesRepo.create({
      values: {
        userId: users[0].id,
        status: 'unread',
        title: 'user1 msg',
        content: 'content',
        channelName,
        receiveTimestamp: Date.now(),
      },
    });
    const msg2 = await messagesRepo.create({
      values: {
        userId: users[1].id,
        status: 'unread',
        title: 'user2 msg',
        content: 'content',
        channelName,
        receiveTimestamp: Date.now(),
      },
    });

    // user2 marks all messages as read in the channel via updateMyOwn
    const res = await userAgents[1].resource('notificationInAppMessages').updateMyOwn({
      filter: { status: 'unread', channelName },
      values: { status: 'read' },
    });
    expect(res.status).toBe(200);

    // user1's message should still be unread
    const user1Msg = await messagesRepo.findOne({ filterByTk: msg1.id });
    expect(user1Msg.status).toBe('unread');

    // user2's message should be read
    const user2Msg = await messagesRepo.findOne({ filterByTk: msg2.id });
    expect(user2Msg.status).toBe('read');
  });

  test('myInAppMessages:list should only return current user messages', async () => {
    await messagesRepo.create({
      values: [
        {
          userId: users[0].id,
          status: 'unread',
          title: 'user1 msg',
          content: 'content',
          receiveTimestamp: Date.now(),
        },
        {
          userId: users[1].id,
          status: 'unread',
          title: 'user2 msg',
          content: 'content',
          receiveTimestamp: Date.now(),
        },
      ],
    });

    // user1 should only see their own messages
    const res = await userAgents[0].resource('myInAppMessages').list();
    expect(res.status).toBe(200);
    const messages = res.body.data.messages;
    expect(messages.length).toBe(1);
    expect(messages[0].title).toBe('user1 msg');

    // user2 should only see their own messages
    const res2 = await userAgents[1].resource('myInAppMessages').list();
    expect(res2.status).toBe(200);
    const messages2 = res2.body.data.messages;
    expect(messages2.length).toBe(1);
    expect(messages2[0].title).toBe('user2 msg');
  });

  test('updateMyOwn should only allow updating status field', async () => {
    const msg = await messagesRepo.create({
      values: {
        userId: users[0].id,
        status: 'unread',
        title: 'original title',
        content: 'original content',
        receiveTimestamp: Date.now(),
      },
    });

    const res = await userAgents[0].resource('notificationInAppMessages').updateMyOwn({
      filterByTk: msg.id,
      values: {
        status: 'read',
        title: 'hacked title',
        content: 'hacked content',
      },
    });

    expect(res.status).toBe(200);
    const updatedMsg = await messagesRepo.findOne({ filterByTk: msg.id });
    expect(updatedMsg.status).toBe('read');
    expect(updatedMsg.title).toBe('original title');
    expect(updatedMsg.content).toBe('original content');
  });

  test('myInAppMessages:list should not be bypassed by injecting filter.userId', async () => {
    await messagesRepo.create({
      values: {
        userId: users[0].id,
        status: 'unread',
        title: 'user1 secret msg',
        content: 'secret',
        receiveTimestamp: Date.now(),
      },
    });

    // user2 tries to inject userId filter to access user1's messages
    const res = await userAgents[1].resource('myInAppMessages').list({
      filter: { userId: users[0].id },
    });
    expect(res.status).toBe(200);
    const messages = res.body.data.messages;
    // Should return empty since server overrides userId with current user
    expect(messages.length).toBe(0);
  });
});
