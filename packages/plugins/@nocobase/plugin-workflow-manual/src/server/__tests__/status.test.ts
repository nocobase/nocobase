/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { MockServer } from '@nocobase/test';

// NOTE: skipped because time is not stable on github ci, but should work in local
describe('workflow > instructions > manual > assignees', () => {
  let app: MockServer;
  let agent;
  let userAgents;
  let db: Database;
  let PostRepo;
  let CommentRepo;
  let WorkflowModel;
  let workflow;
  let UserModel;
  let users;
  let UserJobModel;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'auth', 'workflow-manual'],
    });
    // await app.getPlugin('auth').install();
    agent = app.agent();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    CommentRepo = db.getCollection('comments').repository;
    UserModel = db.getCollection('users').model;
    UserJobModel = db.getModel('workflowManualTasks');

    users = await UserModel.bulkCreate([
      { id: 2, nickname: 'a' },
      { id: 3, nickname: 'b' },
    ]);

    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
        appends: ['category', 'category.posts'],
      },
    });
  });

  afterEach(() => app.destroy());

  describe('workflow status', () => {
    it('enabled', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
            },
          },
        },
      });

      const post = await PostRepo.create({
        values: { title: 't1', category: { title: 'c1' } },
        context: { state: { currentUser: users[0] } },
      });

      await sleep(500);

      const [pending] = await workflow.getExecutions();
      expect(pending.status).toBe(EXECUTION_STATUS.STARTED);

      const usersJobs = await UserJobModel.findAll();
      expect(usersJobs.length).toBe(1);

      const res1 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: usersJobs[0].id,
        values: { result: { f1: {}, _: 'resolve' } },
      });
      expect(res1.status).toBe(202);

      await sleep(500);

      const [resolved] = await workflow.getExecutions();
      expect(resolved.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [j1] = await resolved.getJobs();
      expect(j1.status).toBe(JOB_STATUS.RESOLVED);
    });

    it('disabled after triggered', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
            },
          },
        },
      });

      const post = await PostRepo.create({
        values: { title: 't1', category: { title: 'c1' } },
        context: { state: { currentUser: users[0] } },
      });

      await sleep(500);

      const [pending] = await workflow.getExecutions();
      expect(pending.status).toBe(EXECUTION_STATUS.STARTED);

      const usersJobs = await UserJobModel.findAll();
      expect(usersJobs.length).toBe(1);

      await workflow.update({
        enabled: false,
      });

      const res1 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: usersJobs[0].id,
        values: { result: { f1: {}, _: 'resolve' } },
      });
      expect(res1.status).toBe(202);

      await sleep(500);

      const [resolved] = await workflow.getExecutions();
      expect(resolved.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [j1] = await resolved.getJobs();
      expect(j1.status).toBe(JOB_STATUS.RESOLVED);
    });
  });
});
