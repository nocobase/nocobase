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
import { TASK_STATUS } from '../../common/constants';

// NOTE: skipped because time is not stable on github ci, but should work in local
describe('workflow > instructions > manual > task center', () => {
  let app: MockServer;
  let agent;
  let userAgents;
  let db: Database;
  let PostRepo;
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

  describe('listMine', () => {
    it('member', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              type: 'update',
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
              collection: 'posts',
              filter: {
                id: '{{$context.data.id}}',
              },
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
      expect(pendingJobs.length).toBe(1);

      const res1 = await userAgents[0].resource('workflowManualTasks').listMine();
      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBe(1);

      const res2 = await userAgents[0].resource('workflowManualTasks').listMine({
        filter: {
          status: TASK_STATUS.PENDING,
        },
      });
      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(1);

      const res3 = await userAgents[0].resource('workflowManualTasks').listMine({
        filter: {
          status: TASK_STATUS.RESOLVED,
        },
      });
      expect(res3.status).toBe(200);
      expect(res3.body.data.length).toBe(0);

      const res4 = await userAgents[0].resource('workflowManualTasks').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f1: { title: 't2' }, _: 'resolve' },
        },
      });
      expect(res4.status).toBe(202);

      await sleep(500);

      const [e1] = await workflow.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.RESOLVED);
      expect(j1.result).toMatchObject({ f1: { title: 't2' } });

      const posts = await PostRepo.find({ order: [['createdAt', 'ASC']] });
      expect(posts.length).toBe(1);
      expect(posts[0]).toMatchObject({ title: 't2' });

      const res5 = await userAgents[0].resource('workflowManualTasks').listMine({
        filter: {
          status: TASK_STATUS.PENDING,
        },
      });
      expect(res5.status).toBe(200);
      expect(res5.body.data.length).toBe(0);

      const res6 = await userAgents[0].resource('workflowManualTasks').listMine({
        filter: {
          status: TASK_STATUS.RESOLVED,
        },
      });
      expect(res6.status).toBe(200);
      expect(res6.body.data.length).toBe(1);

      const res7 = await userAgents[0].resource('workflowManualTasks').listMine();
      expect(res7.status).toBe(200);
      expect(res7.body.data.length).toBe(1);
    });
  });
});
