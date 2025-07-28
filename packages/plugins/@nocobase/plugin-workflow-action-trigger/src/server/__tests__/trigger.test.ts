/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { omit } from 'lodash';
import Database from '@nocobase/database';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { MockServer } from '@nocobase/test';

import Plugin from '..';

describe('workflow > action-trigger', () => {
  let app: MockServer;
  let db: Database;
  let agent;
  let PostRepo;
  let CategoryRepo;
  let WorkflowModel;
  let UserRepo;
  let root;
  let rootAgent;
  let users;
  let userAgents;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'auth', 'acl', 'data-source-manager', 'system-settings', 'error-handler', Plugin],
      acl: true,
    });
    await app.pm.get('auth').install();
    agent = app.agent();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    CategoryRepo = db.getCollection('categories').repository;
    UserRepo = db.getCollection('users').repository;

    root = await UserRepo.findOne({});
    rootAgent = await app.agent().login(root);

    users = await UserRepo.create({
      values: [
        { id: 2, nickname: 'a', roles: [{ name: 'root' }] },
        { id: 3, nickname: 'b' },
      ],
    });

    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));
  });

  afterEach(() => app.destroy());

  describe('create', () => {
    it('enabled / disabled', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1[0].context.data).toMatchObject({ title: 't1' });

      await workflow.update({
        enabled: false,
      });

      const res2 = await userAgents[0].resource('posts').create({
        values: { title: 't2' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res2.status).toBe(200);

      await sleep(500);

      const e2 = await workflow.getExecutions({ order: [['id', 'ASC']] });
      expect(e2.length).toBe(1);

      await workflow.update({
        enabled: true,
      });

      const res3 = await userAgents[0].resource('posts').create({
        values: { title: 't3' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res2.status).toBe(200);

      await sleep(500);

      const e3 = await workflow.getExecutions({ order: [['id', 'ASC']] });
      expect(e3.length).toBe(2);
      expect(e3[1].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e3[1].context.data).toMatchObject({ title: 't3' });
    });

    it('only trigger if params provided matching collection config', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1[0].context.data).toMatchObject({ title: 't1' });

      await workflow.update({
        config: {
          collection: 'comments',
        },
      });

      const res2 = await userAgents[0].resource('posts').create({
        values: { title: 't2' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res2.status).toBe(200);

      await sleep(500);

      const e2 = await workflow.getExecutions({ order: [['id', 'ASC']] });
      expect(e2.length).toBe(1);
      // expect(e2[1].status).toBe(EXECUTION_STATUS.RESOLVED);
      // expect(e2[1].context.data).toMatchObject({ title: 't2' });
    });

    it('system fields could be accessed', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1[0].context.data).toHaveProperty('createdAt');
    });

    it('appends', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
          appends: ['createdBy'],
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1[0].context.data).toHaveProperty('createdBy');
    });

    it('user submitted form', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
          appends: ['createdBy'],
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.user).toBeDefined();
      expect(e1.context.user.id).toBe(users[0].id);
    });
  });

  describe('update', () => {
    it('trigger after updated', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
          appends: ['createdBy'],
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(0);

      const res2 = await userAgents[0].resource('posts').update({
        filterByTk: res1.body.data.id,
        values: { title: 't2' },
        triggerWorkflows: `${workflow.key}`,
      });

      await sleep(500);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e2.context.data).toHaveProperty('title', 't2');
      expect(e2.context.data).toHaveProperty('createdBy');
    });

    it('bulk update', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({
        values: { title: 't1' },
      });
      const p2 = await PostRepo.create({
        values: { title: 't2' },
      });

      const res1 = await userAgents[0].resource('posts').update({
        filter: {
          id: [p1.id, p2.id],
        },
        values: { title: 't3' },
        triggerWorkflows: `${workflow.key}`,
      });

      await sleep(500);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(2);
      expect(e1s[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1s[0].context.data).toHaveProperty('title', 't3');
      expect(e1s[1].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1s[1].context.data).toHaveProperty('title', 't3');
    });
  });

  describe.skip('destroy', () => {
    it('trigger after destroyed', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({
        values: { title: 't1' },
      });
      const p2 = await PostRepo.create({
        values: { title: 't2' },
      });
      const res1 = await userAgents[0].resource('posts').destroy({
        filterByTk: p1.id,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(0);

      const res2 = await userAgents[0].resource('posts').destroy({
        filterByTk: p2.id,
        triggerWorkflows: `${workflow.key}`,
      });

      await sleep(500);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e2.context.data).toBe(1);
    });
  });

  describe('context data path', () => {
    it('level: 1', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'categories',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1', category: { title: 'c1' } },
        triggerWorkflows: `${workflow.key}!category`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data).toMatchObject({ title: 'c1' });
    });

    it('level: 2', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'categories',
        },
      });

      const res1 = await userAgents[0].resource('comments').create({
        values: { content: 'comment1', post: { category: { title: 'c1' } } },
        triggerWorkflows: `${workflow.key}!post.category`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data).toMatchObject({ title: 'c1' });
    });
  });

  describe('associations actions', () => {
    it('trigger on associated data', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
        },
      });

      const c1 = await CategoryRepo.create({ values: { title: 'c1' } });

      const res1 = await userAgents[0].resource('categories.posts', c1.id).create({
        values: { title: 'p1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(1);
      expect(e1s[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1s[0].context.data.title).toBe('p1');
      assert.equal(e1s[0].context.data.categoryId, c1.id);

      const res2 = await userAgents[0]
        .post(`/categories/${c1.id}/posts:create`)
        .query({ triggerWorkflows: `${workflow.key}` })
        .send({
          data: { title: 'p2' },
        });

      await sleep(500);

      const e2s = await workflow.getExecutions();
      expect(e2s.length).toBe(2);
    });
  });

  describe('manually execute', () => {
    it('root execute', async () => {
      const w1 = await WorkflowModel.create({
        type: 'action',
        config: {
          collection: 'posts',
          appends: ['category'],
        },
      });

      const p1 = await PostRepo.create({
        values: { title: 't1', category: { title: 'c1' } },
      });

      const { category, ...data } = p1.toJSON();
      const res1 = await rootAgent.resource('workflows').execute({
        filterByTk: w1.id,
        values: {
          data,
          userId: users[1].id,
        },
      });

      expect(res1.status).toBe(200);
      expect(res1.body.data.execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [e1] = await w1.getExecutions();
      assert.equal(e1.id, res1.body.data.execution.id);
      expect(e1.context.data).toMatchObject({ category: { title: 'c1' } });
      assert.equal(e1.context.data.id, data.id);
      assert.equal(e1.context.data.categoryId, category.id);
      expect(e1.context.user).toMatchObject(
        omit(users[1].toJSON(), ['id', 'createdAt', 'updatedAt', 'createdById', 'updatedById']),
      );
      assert.equal(e1.context.user.id, users[1].toJSON().id);
    });
  });

  describe('workflow key', () => {
    it('revision', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${w1.key}`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const [e1] = await w1.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data).toMatchObject({ title: 't1' });

      const res2 = await userAgents[0].resource('workflows').revision({
        filterByTk: w1.id,
        filter: {
          key: w1.key,
        },
      });
      const w2 = await WorkflowModel.findByPk(res2.body.data.id);
      await w2.update({
        enabled: true,
      });

      const res3 = await userAgents[0].resource('posts').create({
        values: { title: 't2' },
        triggerWorkflows: `${w1.key}`,
      });
      expect(res3.status).toBe(200);

      await sleep(500);

      const e2 = await w1.getExecutions();
      expect(e2.length).toBe(1);
      const e3 = await w2.getExecutions();
      expect(e3.length).toBe(1);
      expect(e3[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e3[0].context.data).toMatchObject({ title: 't2' });
    });
  });

  describe('sync', () => {
    it('sync form trigger', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        sync: true,
        config: {
          collection: 'posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(200);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].status).toBe(EXECUTION_STATUS.RESOLVED);
    });

    it('sync and async will all be triggered in one action', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
        },
      });

      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        sync: true,
        config: {
          collection: 'posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: [w1.key, w2.key].join(),
      });
      expect(res1.status).toBe(200);

      const e1s = await w1.getExecutions();
      expect(e1s.length).toBe(0);

      const e2s = await w2.getExecutions();
      expect(e2s.length).toBe(1);
      expect(e2s[0].status).toBe(EXECUTION_STATUS.RESOLVED);

      await sleep(500);

      const e3s = await w1.getExecutions();
      expect(e3s.length).toBe(1);
      expect(e3s[0].status).toBe(EXECUTION_STATUS.RESOLVED);
    });

    it('execution failed on node error', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        sync: true,
        config: {
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'error',
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(500);
    });

    it('execution failed on end node success', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        sync: true,
        config: {
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'end',
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(200);
    });

    it('execution failed on end node success', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        sync: true,
        config: {
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
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(400);
    });
  });

  describe('global workflow', () => {
    it('no action configured should not be triggered', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
          global: true,
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(0);

      const res2 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res2.status).toBe(200);

      await sleep(500);

      const e2 = await workflow.getExecutions();
      expect(e2.length).toBe(0);
    });

    it('trigger on both create and update actions', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
          global: true,
          actions: ['create', 'update'],
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1[0].context.data).toMatchObject({ title: 't1' });

      const res2 = await userAgents[0].resource('posts').update({
        filterByTk: res1.body.data.id,
        values: { title: 't2' },
      });

      await sleep(500);

      const e2 = await workflow.getExecutions({ order: [['id', 'ASC']] });
      expect(e2.length).toBe(2);
      expect(e2[1].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e2[1].context.data).toMatchObject({ title: 't2' });
    });

    it('trigger on action when bound to button', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
          global: true,
          actions: ['create', 'update'],
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1[0].context.data).toMatchObject({ title: 't1' });
    });

    it('trigger on action directly submit to workflow', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'posts',
          global: true,
          actions: ['create', 'update'],
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1[0].context.data).toMatchObject({ title: 't1' });
    });
  });

  describe('multiple data source', () => {
    it('trigger on different data source', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'action',
        config: {
          collection: 'another:posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(200);

      await sleep(500);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(0);

      // const res2 = await userAgents[0]
      //   .set('x-data-source', 'another')
      //   .resource('posts')
      //   .create({
      //     values: { title: 't2' },
      //     triggerWorkflows: `${workflow.key}`,
      //   });
      const res2 = await (
        await agent.login(users[0])
      )
        .set('x-data-source', 'another')
        .post('/api/posts:create')
        .query({ triggerWorkflows: `${workflow.key}` })
        .send({ title: 't2' });

      expect(res2.status).toBe(200);

      await sleep(500);

      const e2s = await workflow.getExecutions();
      expect(e2s.length).toBe(1);
      expect(e2s[0].status).toBe(EXECUTION_STATUS.RESOLVED);
    });
  });
});
