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
describe('workflow > instructions > manual > tasks', () => {
  let app: MockServer;
  let root;
  let rootAgent;
  let userAgents;
  let db: Database;
  let PostRepo;
  let AnotherPostRepo;
  let WorkflowModel;
  let workflow;
  let UserModel;
  let users;
  let ManualTaskModel;
  let UserTaskRepo;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'auth', 'workflow-manual'],
    });
    // await app.getPlugin('auth').install();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    AnotherPostRepo = app.dataSourceManager.dataSources.get('another').collectionManager.getRepository('posts');
    UserModel = db.getCollection('users').model;
    ManualTaskModel = db.getModel('workflowManualTasks');
    UserTaskRepo = db.getRepository('userWorkflowTasks');

    root = await UserModel.findOne();
    rootAgent = await app.agent().login(root);
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

  describe('node process', () => {
    it('create as configured', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              type: 'create',
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
              collection: 'posts',
              dataSource: 'another',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const pendingJobs = await ManualTaskModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(pendingJobs.length).toBe(1);

      const s1s = await UserTaskRepo.find();
      expect(s1s.length).toBe(1);
      expect(s1s[0].get('stats')).toMatchObject({
        pending: 1,
        all: 1,
      });

      const res1 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f1: { title: 't1' }, _: 'resolve' },
        },
      });
      expect(res1.status).toBe(202);

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.RESOLVED);
      expect(j1.result).toMatchObject({ f1: { title: 't1' } });

      const posts = await AnotherPostRepo.find();
      expect(posts.length).toBe(1);
      expect(posts[0]).toMatchObject({ title: 't1' });

      const s2s = await UserTaskRepo.find();
      expect(s2s.length).toBe(1);
      expect(s2s[0].get('stats')).toMatchObject({
        pending: 0,
        all: 1,
      });
    });
  });

  describe('execution', () => {
    it('cancel', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              type: 'create',
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
              collection: 'posts',
              dataSource: 'another',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const pendingJobs = await ManualTaskModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(pendingJobs.length).toBe(1);

      const s1s = await UserTaskRepo.find();
      expect(s1s.length).toBe(1);
      expect(s1s[0].get('stats')).toMatchObject({
        pending: 1,
        all: 1,
      });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.STARTED);

      const res1 = await rootAgent.resource('executions').cancel({
        filterByTk: execution.id,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const s2s = await UserTaskRepo.find();
      expect(s2s.length).toBe(1);
      expect(s2s[0].get('stats')).toMatchObject({
        pending: 0,
        all: 1,
      });
    });
  });

  describe('workflow status', () => {
    it('workflow disabled', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              type: 'create',
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
              collection: 'posts',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const s1s = await UserTaskRepo.find();
      expect(s1s.length).toBe(1);
      expect(s1s[0].get('stats')).toMatchObject({
        pending: 1,
        all: 1,
      });

      await workflow.update({ enabled: false });

      const s2s = await UserTaskRepo.find();
      expect(s2s.length).toBe(1);
      expect(s2s[0].get('stats')).toMatchObject({
        pending: 0,
        all: 0,
      });
    });

    it('workflow destroy', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              type: 'create',
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
              collection: 'posts',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const s1s = await UserTaskRepo.find();
      expect(s1s.length).toBe(1);
      expect(s1s[0].get('stats')).toMatchObject({
        pending: 1,
        all: 1,
      });

      await workflow.destroy();

      const s2s = await UserTaskRepo.find();
      expect(s2s.length).toBe(1);
      expect(s2s[0].get('stats')).toMatchObject({
        pending: 0,
        all: 0,
      });
    });
  });
});
