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

  describe('no', () => {
    it('empty assignees', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [],
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
      expect(pending.status).toBe(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('multiple', () => {
    it('assignees from nested array', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [`{{$context.data.category.posts.createdById}}`],
          forms: {
            f1: {
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
            },
          },
        },
      });

      const post = await PostRepo.create({
        updateAssociationValues: ['category'],
        values: { title: 't1', category: { title: 'c1' } },
        context: { state: { currentUser: users[0] } },
      });

      await sleep(500);

      const [pending] = await workflow.getExecutions();
      expect(pending.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await pending.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      const usersJobs = await UserJobModel.findAll();
      expect(usersJobs.length).toBe(1);
      expect(usersJobs[0].status).toBe(JOB_STATUS.PENDING);
      expect(usersJobs[0].userId).toBe(users[0].id);
      expect(usersJobs[0].jobId).toBe(j1.id);

      const res1 = await agent.resource('workflowManualTasks').submit({
        filterByTk: usersJobs[0].id,
        values: { result: { f1: {}, _: 'resolve' } },
      });
      expect(res1.status).toBe(401);

      const res2 = await userAgents[1].resource('workflowManualTasks').submit({
        filterByTk: usersJobs[0].id,
        values: {
          result: { f1: {}, _: 'resolve' },
        },
      });
      expect(res2.status).toBe(403);

      const res3 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: usersJobs[0].id,
        values: {
          result: { f1: { a: 1 }, _: 'resolve' },
        },
      });
      expect(res3.status).toBe(202);

      await sleep(1000);

      const [j2] = await pending.getJobs();
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
      expect(j2.result).toEqual({ f1: { a: 1 }, _: 'resolve' });

      const usersJobsAfter = await UserJobModel.findAll();
      expect(usersJobsAfter.length).toBe(1);
      expect(usersJobsAfter[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(usersJobsAfter[0].result).toEqual({ f1: { a: 1 }, _: 'resolve' });

      const res4 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: usersJobs[0].id,
        values: {
          result: { f1: { a: 2 }, _: 'resolve' },
        },
      });
      expect(res4.status).toBe(400);
    });
  });
});
