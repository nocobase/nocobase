import Database from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import Plugin from '..';

describe('workflow > instructions > sql', () => {
  let app: MockServer;
  let db: Database;
  let agent;
  let PostRepo;
  let CommentRepo;
  let WorkflowModel;
  let UserModel;
  let users;
  let userAgents;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'auth', Plugin],
    });
    await app.getPlugin('auth').install();
    agent = app.agent();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    CommentRepo = db.getCollection('comments').repository;
    UserModel = db.getCollection('users').model;

    users = await UserModel.bulkCreate([
      { id: 1, nickname: 'a' },
      { id: 2, nickname: 'b' },
    ]);

    userAgents = users.map((user) => app.agent().login(user));
  });

  afterEach(() => app.destroy());

  describe('create', () => {
    it('enabled / disabled', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'form',
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
        type: 'form',
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
        type: 'form',
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
        type: 'form',
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
        type: 'form',
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
        type: 'form',
        config: {
          collection: 'posts',
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
    });
  });

  describe('directly trigger', () => {
    it('trigger data', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'form',
      });

      const res1 = await userAgents[0].resource('workflows').trigger({
        values: { title: 't1' },
        triggerWorkflows: `${workflow.key}`,
      });
      expect(res1.status).toBe(202);

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data).toMatchObject({ title: 't1' });
    });

    it('multi trigger', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'form',
      });

      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'form',
      });

      const res1 = await userAgents[0].resource('workflows').trigger({
        values: { title: 't1' },
        triggerWorkflows: `${w1.key},${w2.key}`,
      });
      expect(res1.status).toBe(202);

      await sleep(500);

      const [e1] = await w1.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data).toMatchObject({ title: 't1' });

      const [e2] = await w2.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e2.context.data).toMatchObject({ title: 't1' });
    });

    it('user submitted form', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'form',
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

  describe('context data path', () => {
    it('level: 1', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'form',
      });

      const res1 = await userAgents[0].resource('workflows').trigger({
        values: { title: 't1', category: { title: 'c1' } },
        triggerWorkflows: `${workflow.key}!category`,
      });
      expect(res1.status).toBe(202);

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data).toMatchObject({ title: 'c1' });
    });

    it('level: 2', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'form',
      });

      const res1 = await userAgents[0].resource('workflows').trigger({
        values: { content: 'comment1', post: { category: { title: 'c1' } } },
        triggerWorkflows: `${workflow.key}!post.category`,
      });
      expect(res1.status).toBe(202);

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data).toMatchObject({ title: 'c1' });
    });
  });

  describe('workflow key', () => {
    it('revision', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'form',
      });

      const res1 = await userAgents[0].resource('workflows').trigger({
        values: { title: 't1' },
        triggerWorkflows: `${w1.key}`,
      });
      expect(res1.status).toBe(202);

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

      const res3 = await userAgents[0].resource('workflows').trigger({
        values: { title: 't2' },
        triggerWorkflows: `${w1.key}`,
      });
      expect(res3.status).toBe(202);

      await sleep(500);

      const e2 = await w1.getExecutions();
      expect(e2.length).toBe(1);
      const e3 = await w2.getExecutions();
      expect(e3.length).toBe(1);
      expect(e3[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e3[0].context.data).toMatchObject({ title: 't2' });
    });
  });
});
