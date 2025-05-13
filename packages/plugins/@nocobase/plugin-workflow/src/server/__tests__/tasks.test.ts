/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { getApp } from '@nocobase/plugin-workflow-test';

import Plugin from '..';

describe('workflow > tasks', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let plugin: Plugin;
  let TaskRepo;
  let UserRepo;
  let users;
  let userAgents;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'auth'],
    });
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    plugin = app.pm.get(Plugin) as Plugin;
    TaskRepo = db.getCollection('userWorkflowTasks').repository;
    UserRepo = db.getCollection('users').repository;

    await UserRepo.create({});
    users = await UserRepo.find();
    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));
  });

  afterEach(() => app.destroy());

  describe('filter', () => {
    it('only count current user tasks', async () => {
      const workflow = await WorkflowModel.create({
        sync: true,
        enabled: true,
        type: 'syncTrigger',
      });

      const tasks = await TaskRepo.createMany({
        records: [
          {
            userId: users[0].id,
            type: 'test1',
            stats: { pending: 1, all: 2 },
          },
          {
            userId: users[1].id,
            type: 'test1',
            stats: { pending: 0, all: 3 },
          },
          {
            userId: users[0].id,
            type: 'test2',
            stats: { pending: 0, all: 0 },
          },
          {
            userId: users[1].id,
            type: 'test2',
            stats: { pending: 2, all: 2 },
          },
          {
            userId: users[1].id,
            type: 'test3',
            stats: { pending: 0, all: 1 },
          },
        ],
      });

      const res1 = await userAgents[0].resource('userWorkflowTasks').listMine();

      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBe(2);
      expect(res1.body.data.find((item) => item.type === 'test1')).toMatchObject({
        userId: users[0].id,
        stats: { pending: 1, all: 2 },
      });

      const res2 = await userAgents[1].resource('userWorkflowTasks').listMine();
      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(3);
      expect(res2.body.data.find((item) => item.type === 'test3')).toMatchObject({
        userId: users[1].id,
        stats: { pending: 0, all: 1 },
      });
    });
  });
});
