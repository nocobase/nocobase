/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import Database from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { getApp } from '@nocobase/plugin-workflow-test';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';

import Plugin from '..';

describe('workflow > triggers > request-interception', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let root;
  let rootAgent;
  let users;
  let userAgents;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'auth', 'error-handler', 'workflow-response-message', Plugin],
    });

    db = app.db;

    PostRepo = db.getCollection('posts').repository;

    WorkflowModel = db.getModel('workflows');

    const UserRepo = db.getCollection('users').repository;

    root = await UserRepo.findOne({});
    rootAgent = await app.agent().login(root);

    users = await UserRepo.createMany({
      records: [
        { id: 2, nickname: 'a' },
        { id: 3, nickname: 'b' },
      ],
    });

    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));
  });

  afterEach(() => app.destroy());

  describe('miss configured', () => {
    it('no collection', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          global: true,
          actions: ['create'],
        },
      });

      const res = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res.status).toBe(200);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });

    it('no action', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          global: true,
          collection: 'posts',
        },
      });

      const res = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res.status).toBe(200);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });
  });

  describe('global', () => {
    it('false', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          global: false,
          actions: ['create'],
          collection: 'posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(200);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(0);

      const res2 = await userAgents[0].resource('posts').create({
        values: { title: 't2' },
        triggerWorkflows: workflow.key,
      });

      expect(res2.status).toBe(200);

      const [e2] = await workflow.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
    });

    it('true', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          global: true,
          actions: ['create'],
          collection: 'posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const res2 = await userAgents[0].resource('posts').create({
        values: { title: 't2' },
        triggerWorkflows: workflow.key,
      });

      expect(res2.status).toBe(200);

      const [, e2] = await workflow.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(e2.status).toEqual(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('actions', () => {
    it('create on associated collection', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          actions: ['create'],
          collection: 'posts',
        },
      });

      const category = await db.getRepository('categories').create({
        values: { title: 'c1' },
      });

      const res1 = await userAgents[0].resource('categories.posts', category.id).create({
        values: { title: 't1' },
        triggerWorkflows: workflow.key,
      });

      expect(res1.status).toBe(200);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(1);
      expect(e1s[0].status).toEqual(EXECUTION_STATUS.RESOLVED);
    });

    it('update', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          actions: ['update'],
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({
        values: { title: 't1' },
      });

      const res1 = await userAgents[0].resource('posts').update({
        filterByTk: p1.id,
        values: { title: 't2' },
        triggerWorkflows: workflow.key,
      });

      expect(res1.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
    });

    it('updateOrCreate', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          actions: ['updateOrCreate'],
          collection: 'posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').updateOrCreate({
        values: { title: 't1' },
        filterKeys: ['title'],
        triggerWorkflows: workflow.key,
      });

      expect(res1.status).toBe(200);
      expect(res1.body.data.read).toBe(0);
      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const res2 = await userAgents[0].resource('posts').updateOrCreate({
        values: {
          title: 't1',
          read: 1,
        },
        filterKeys: ['title'],
        triggerWorkflows: workflow.key,
      });

      expect(res2.status).toBe(200);
      // TODO(question): updateOrCreate result is array now
      expect(res2.body.data[0].read).toBe(1);

      const [, e2] = await workflow.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(e2.status).toEqual(EXECUTION_STATUS.RESOLVED);
    });

    it('destroy', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          actions: ['destroy'],
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({
        values: { title: 't1' },
      });

      const res1 = await userAgents[0].resource('posts').destroy({
        filterByTk: p1.id,
        triggerWorkflows: workflow.key,
      });

      expect(res1.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('end node', () => {
    it('fail', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          global: true,
          actions: ['create'],
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'end',
        config: {
          endStatus: JOB_STATUS.FAILED,
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });
      expect(res1.status).toBe(400);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.FAILED);
    });

    it('success', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          global: true,
          actions: ['create'],
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'end',
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });
      expect(res1.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('other nodes fail or error', () => {
    it('error', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          global: true,
          actions: ['create'],
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'error',
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.ERROR);
    });
  });

  describe('multiple data source', () => {
    beforeEach(async () => {
      await rootAgent.resource('roles.dataSourceResources', 'member').create({
        values: {
          dataSourceKey: 'another',
          name: 'posts',
          usingActionsConfig: true,
          actions: [
            {
              name: 'view',
              fields: ['title'],
            },
            {
              name: 'create',
              fields: ['title'],
            },
          ],
        },
      });
    });

    describe('pass through', () => {
      it('trigger on another data source', async () => {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'request-interception',
          config: {
            global: true,
            actions: ['create'],
            collection: 'another:posts',
          },
        });

        const res1 = await userAgents[0]
          .set('x-data-source', 'another')
          .post('/api/posts:create')
          .send({ title: 't2' });

        expect(res1.status).toBe(200);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      });
    });

    describe('end node', () => {
      it('fail', async () => {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'request-interception',
          config: {
            global: true,
            actions: ['create'],
            collection: 'another:posts',
          },
        });

        const n1 = await workflow.createNode({
          type: 'end',
          config: {
            endStatus: JOB_STATUS.FAILED,
          },
        });

        const res1 = await userAgents[0]
          .set('x-data-source', 'another')
          .post('/api/posts:create')
          .send({ title: 't2' });

        expect(res1.status).toBe(400);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toEqual(EXECUTION_STATUS.FAILED);
      });

      it('success', async () => {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'request-interception',
          config: {
            global: true,
            actions: ['create'],
            collection: 'another:posts',
          },
        });

        const n1 = await workflow.createNode({
          type: 'end',
        });

        const res1 = await userAgents[0]
          .set('x-data-source', 'another')
          .post('/api/posts:create')
          .send({ title: 't2' });

        expect(res1.status).toBe(200);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      });

      it('failure response-message', async () => {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'request-interception',
          config: {
            global: true,
            actions: ['create'],
            collection: 'another:posts',
          },
        });

        const n1 = await workflow.createNode({
          type: 'response-message',
          config: {
            message: 'aaa',
          },
        });

        const n2 = await workflow.createNode({
          type: 'end',
          config: {
            endStatus: JOB_STATUS.REJECTED,
          },
          upstreamId: n1.id,
        });

        await n1.setDownstream(n2);

        const res1 = await userAgents[0]
          .set('x-data-source', 'another')
          .post('/api/posts:create')
          .send({ title: 't2' });

        expect(res1.status).toBe(400);
        expect(res1.body.errors).toEqual([{ message: 'aaa' }]);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toEqual(EXECUTION_STATUS.REJECTED);
      });
    });
  });
});
