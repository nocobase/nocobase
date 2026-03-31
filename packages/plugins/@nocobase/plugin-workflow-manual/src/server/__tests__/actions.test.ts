/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { MockServer } from '@nocobase/test';

// NOTE: skipped because time is not stable on github ci, but should work in local
describe('workflow > instructions > manual > actions', () => {
  let app: MockServer;
  let root;
  let rootAgent;
  let userAgents;
  let db: Database;
  let PostRepo;
  let AnotherPostRepo;
  let WorkflowModel;
  let workflow;
  let UserRepo;
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
    UserRepo = db.getRepository('users');
    ManualTaskModel = db.getModel('workflowManualTasks');
    UserTaskRepo = db.getRepository('userWorkflowTasks');

    root = await UserRepo.findOne();
    rootAgent = await app.agent().login(root);
    users = await UserRepo.create({
      values: [
        { id: 2, nickname: 'a' },
        { id: 3, nickname: 'b' },
      ],
    });

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

  describe('listMine', () => {
    it('only list records by current user own', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              type: 'custom',
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
            },
          },
        },
      });

      const n2 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[1].id],
          forms: {
            f1: {
              type: 'custom',
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
            },
          },
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const res1 = await userAgents[0].resource('workflowManualTasks').listMine();
      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBe(1);
      expect(res1.body.meta.count).toBe(1);

      const res2 = await userAgents[1].resource('workflowManualTasks').listMine();
      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(0);
      expect(res2.body.meta.count).toBe(0);

      const j1s = await ManualTaskModel.findAll({
        filter: { userId: users[0].id },
      });
      expect(j1s.length).toBe(1);

      const res3 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: j1s[0].get('id'),
        values: {
          result: { f1: { title: 't1' }, _: 'resolve' },
        },
      });
      expect(res3.status).toBe(202);

      await sleep(500);

      const res4 = await userAgents[0].resource('workflowManualTasks').listMine();
      expect(res4.status).toBe(200);
      expect(res4.body.data.length).toBe(1);
      expect(res4.body.meta.count).toBe(1);

      const res5 = await userAgents[1].resource('workflowManualTasks').listMine();
      expect(res5.status).toBe(200);
      expect(res5.body.data.length).toBe(1);
      expect(res5.body.meta.count).toBe(1);

      const res6 = await rootAgent.resource('workflowManualTasks').listMine();
      expect(res6.status).toBe(200);
      expect(res6.body.data.length).toBe(0);
      expect(res6.body.meta.count).toBe(0);
    });
  });
});
