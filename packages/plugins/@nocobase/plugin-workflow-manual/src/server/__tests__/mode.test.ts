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
describe('workflow > instructions > manual', () => {
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
      },
    });
  });

  afterEach(() => app.destroy());

  describe('mode: 0 (single record)', () => {
    it('the only user assigned could submit', async () => {
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

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [pending] = await workflow.getExecutions();
      expect(pending.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await pending.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      const usersJobs = await UserJobModel.findAll();
      expect(usersJobs.length).toBe(1);
      expect(usersJobs[0].status).toBe(JOB_STATUS.PENDING);
      assert.equal(usersJobs[0].userId, users[0].id);
      assert.equal(usersJobs[0].jobId, j1.id);

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

    it('any user assigned could submit', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id, users[1].id],
          forms: {
            f1: {
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [pending] = await workflow.getExecutions();
      expect(pending.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await pending.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      const usersJobs = await UserJobModel.findAll({
        where: {
          jobId: j1.id,
        },
      });

      const res1 = await userAgents[1].resource('workflowManualTasks').submit({
        filterByTk: usersJobs.find((item) => item.userId == users[1].id).id,
        values: {
          result: { f1: { a: 1 }, _: 'resolve' },
        },
      });
      expect(res1.status).toBe(202);

      await sleep(1000);

      const [j2] = await pending.getJobs();
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
      expect(j2.result).toEqual({ f1: { a: 1 }, _: 'resolve' });

      const res2 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: usersJobs.find((item) => item.userId == users[0].id).id,
        values: {
          result: { f1: { a: 1 }, _: 'resolve' },
        },
      });
      expect(res2.status).toBe(400);
    });

    it('also could submit to workflowManualTasks api', async () => {
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

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const UserJobModel = db.getModel('workflowManualTasks');
      const usersJobs = await UserJobModel.findAll();
      expect(usersJobs.length).toBe(1);
      expect(usersJobs[0].get('status')).toBe(JOB_STATUS.PENDING);
      expect(usersJobs[0].get('userId')).toEqualNumberOrString(users[0].id);

      const res = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: usersJobs[0].get('id'),
        values: {
          result: { f1: { a: 1 }, _: 'resolve' },
        },
      });
      expect(res.status).toBe(202);

      await sleep(1000);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result).toEqual({ f1: { a: 1 }, _: 'resolve' });
    });
  });

  describe('mode: 1 (multiple record, all)', () => {
    it('all resolved', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id, users[1].id],
          mode: 1,
          forms: {
            f1: {
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const UserJobModel = db.getModel('workflowManualTasks');
      const pendingJobs = await UserJobModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(pendingJobs.length).toBe(2);

      const res1 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f1: { a: 1 }, _: 'resolve' },
        },
      });
      expect(res1.status).toBe(202);

      await sleep(1000);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);
      expect(j1.result).toBe(0.5);
      const usersJobs1 = await UserJobModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(usersJobs1.length).toBe(2);

      const res2 = await userAgents[1].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[1].get('id'),
        values: {
          result: { f1: { a: 2 }, _: 'resolve' },
        },
      });
      expect(res2.status).toBe(202);

      await sleep(1000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
      expect(j2.result).toBe(1);
    });

    it('first rejected', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id, users[1].id],
          mode: 1,
          forms: {
            f1: {
              actions: [{ status: JOB_STATUS.REJECTED, key: 'reject' }],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const UserJobModel = db.getModel('workflowManualTasks');
      const pendingJobs = await UserJobModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(pendingJobs.length).toBe(2);

      const res1 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f1: { a: 0 }, _: 'reject' },
        },
      });
      expect(res1.status).toBe(202);

      await sleep(1000);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.REJECTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.REJECTED);
      expect(j1.result).toBe(0.5);
      const usersJobs1 = await UserJobModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(usersJobs1.length).toBe(2);

      const res2 = await userAgents[1].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[1].get('id'),
        values: {
          result: { f1: { a: 0 }, _: 'reject' },
        },
      });
      expect(res2.status).toBe(400);
    });

    it('last rejected', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id, users[1].id],
          mode: 1,
          forms: {
            f1: {
              actions: [
                { status: JOB_STATUS.RESOLVED, key: 'resolve' },
                { status: JOB_STATUS.REJECTED, key: 'reject' },
              ],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const UserJobModel = db.getModel('workflowManualTasks');
      const pendingJobs = await UserJobModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(pendingJobs.length).toBe(2);

      const res1 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f1: { a: 1 }, _: 'resolve' },
        },
      });
      expect(res1.status).toBe(202);

      await sleep(1000);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);
      expect(j1.result).toBe(0.5);
      const usersJobs1 = await UserJobModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(usersJobs1.length).toBe(2);

      const res2 = await userAgents[1].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[1].get('id'),
        values: {
          result: { f1: { a: 0 }, _: 'reject' },
        },
      });
      expect(res2.status).toBe(202);

      await sleep(1000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.REJECTED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.REJECTED);
      expect(j2.result).toBe(1);
    });
  });

  describe('mode: -1 (multiple record, any)', () => {
    it('first resolved', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id, users[1].id],
          mode: -1,
          forms: {
            f1: {
              actions: [
                { status: JOB_STATUS.RESOLVED, key: 'resolve' },
                { status: JOB_STATUS.REJECTED, key: 'reject' },
              ],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const UserJobModel = db.getModel('workflowManualTasks');
      const pendingJobs = await UserJobModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(pendingJobs.length).toBe(2);

      const res1 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f1: { a: 1 }, _: 'resolve' },
        },
      });
      expect(res1.status).toBe(202);

      await sleep(1000);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.RESOLVED);
      expect(j1.result).toBe(0.5);

      const res2 = await userAgents[1].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[1].get('id'),
        values: {
          result: { f1: { a: 0 }, _: 'reject' },
        },
      });
      expect(res2.status).toBe(400);
    });

    it('any resolved', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id, users[1].id],
          mode: -1,
          forms: {
            f1: {
              actions: [
                { status: JOB_STATUS.RESOLVED, key: 'resolve' },
                { status: JOB_STATUS.REJECTED, key: 'reject' },
              ],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const UserJobModel = db.getModel('workflowManualTasks');
      const pendingJobs = await UserJobModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(pendingJobs.length).toBe(2);

      const res1 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f1: { a: 0 }, _: 'reject' },
        },
      });
      expect(res1.status).toBe(202);

      await sleep(1000);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);
      expect(j1.result).toBe(0.5);

      const res2 = await userAgents[1].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[1].get('id'),
        values: {
          result: { f1: { a: 1 }, _: 'resolve' },
        },
      });
      expect(res2.status).toBe(202);

      await sleep(1000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
      expect(j2.result).toBe(1);
    });

    it('all rejected', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id, users[1].id],
          mode: -1,
          forms: {
            f1: {
              actions: [{ status: JOB_STATUS.REJECTED, key: 'reject' }],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const UserJobModel = db.getModel('workflowManualTasks');
      const pendingJobs = await UserJobModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(pendingJobs.length).toBe(2);

      const res1 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f1: { a: 0 }, _: 'reject' },
        },
      });
      expect(res1.status).toBe(202);

      await sleep(1000);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);
      expect(j1.result).toBe(0.5);

      const res2 = await userAgents[1].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[1].get('id'),
        values: {
          result: { f1: { a: 0 }, _: 'reject' },
        },
      });
      expect(res2.status).toBe(202);

      await sleep(1000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.REJECTED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.REJECTED);
      expect(j2.result).toBe(1);
    });
  });
});
