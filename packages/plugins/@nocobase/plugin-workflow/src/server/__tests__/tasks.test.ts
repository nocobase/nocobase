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
    TaskRepo = db.getCollection('workflowTasks').repository;
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

      await plugin.trigger(workflow, {});

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(1);

      const tasks = await TaskRepo.createMany({
        records: [
          {
            userId: users[0].id,
            workflowId: workflow.id,
            type: 'test',
          },
          {
            userId: users[0].id,
            workflowId: workflow.id,
            type: 'test',
          },
          {
            userId: users[1].id,
            workflowId: workflow.id,
            type: 'test',
          },
        ],
      });

      const res1 = await userAgents[0].resource('workflowTasks').countMine();

      expect(res1.status).toBe(200);
      expect(res1.body.data[0].count).toBe(2);

      const res2 = await userAgents[1].resource('workflowTasks').countMine();
      expect(res2.status).toBe(200);
      expect(res2.body.data[0].count).toBe(1);

      await workflow.destroy();

      const res3 = await userAgents[0].resource('workflowTasks').countMine();
      expect(res3.status).toBe(200);
      expect(res3.body.data.length).toBe(0);
      const res4 = await userAgents[1].resource('workflowTasks').countMine();
      expect(res4.status).toBe(200);
      expect(res4.body.data.length).toBe(0);
    });
  });
});
