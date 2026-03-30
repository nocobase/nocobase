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
});
