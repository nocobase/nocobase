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

import Database, { Op } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { SequelizeCollectionManager, SequelizeDataSource } from '@nocobase/data-source-manager';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';

import Plugin from '..';
import { CONTEXT_TYPE } from '../../common/constants';

describe('workflow: custom action trigger', () => {
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
      acl: true,
      plugins: ['system-settings', 'users', 'auth', 'acl', 'data-source-manager', 'error-handler', Plugin],
    });

    db = app.db;

    PostRepo = db.getCollection('posts').repository;

    WorkflowModel = db.getModel('workflows');

    const UserRepo = db.getCollection('users').repository;
    root = await UserRepo.findOne();
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
    it('no type', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        config: {},
      });

      const res = await userAgents[0].resource('posts').trigger({
        values: { title: 't1' },
        triggerWorkflows: workflow.key,
      });

      expect(res.status).toBe(200);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });

    it('no triggerWorkflows params', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const res = await userAgents[0].resource('posts').trigger({
        values: { title: 't1' },
      });

      expect(res.status).toBe(400);

      await sleep(500);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });
  });

  describe('async', () => {
    it('without filterByTk', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').trigger({
        values: { title: 't2' },
        triggerWorkflows: workflow.key,
      });

      expect(res1.status).toBe(200);

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data.title).toBe('t2');
      expect(e1.context.data.id).toBeUndefined();

      expect(e1.context.user.id).toBe(users[0].id);
    });

    it('with filterByTk', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({
        values: { title: 't1' },
      });

      const res1 = await userAgents[0].resource('posts').trigger({
        filterByTk: p1.id,
        values: {
          title: 't2',
          tags: [
            { id: 1, name: 'tag1' },
            { id: 2, name: 'tag2' },
          ],
        },
        triggerWorkflows: workflow.key,
      });

      expect(res1.status).toBe(200);

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data).toMatchObject({
        title: 't2',
        tags: [
          { id: 1, name: 'tag1' },
          { id: 2, name: 'tag2' },
        ],
      });
    });

    it('with filterByTk and appends', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
          appends: ['tags'],
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const p1 = await PostRepo.create({
        values: {
          title: 't1',
          tags: [
            { id: 1, name: 'tag1' },
            { id: 2, name: 'tag2' },
          ],
        },
      });

      const res1 = await userAgents[0].resource('posts').trigger({
        filterByTk: p1.id,
        values: { title: 't2' },
        triggerWorkflows: workflow.key,
      });

      expect(res1.status).toBe(200);

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data).toMatchObject({
        title: 't2',
        tags: [
          { id: 1, name: 'tag1' },
          { id: 2, name: 'tag2' },
        ],
      });

      const j1s = await e1.getJobs();
      expect(j1s.length).toBe(1);
      expect(j1s[0].result.data).toMatchObject({
        title: 't2',
        tags: [
          { id: 1, name: 'tag1' },
          { id: 2, name: 'tag2' },
        ],
      });
    });

    it('trigger on association', async () => {
      const c1 = await db.getCollection('categories').repository.create({
        values: { title: 'c1' },
      });

      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const res = await userAgents[0].resource('categories.posts', c1.id).trigger({
        values: { title: 't1' },
        triggerWorkflows: workflow.key,
      });

      expect(res.status).toBe(200);

      await sleep(500);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(1);
      expect(e1s[0].context.data.title).toBe('t1');
    });

    it('end node will end later', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'end',
        config: {
          endStatus: JOB_STATUS.FAILED,
        },
      });

      const res1 = await userAgents[0].resource('posts').trigger({
        values: { title: 't1' },
        triggerWorkflows: workflow.key,
      });
      expect(res1.status).toBe(200);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(0);

      await sleep(500);
      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.FAILED);
    });
  });

  describe('sync', () => {
    it('process to end', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        sync: true,
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const res1 = await userAgents[0].resource('posts').trigger({
        values: { title: 't1' },
        triggerWorkflows: workflow.key,
      });
      expect(res1.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
    });

    it('end as failed', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        sync: true,
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'end',
        config: {
          endStatus: JOB_STATUS.FAILED,
        },
      });

      const res1 = await userAgents[0].resource('posts').trigger({
        values: { title: 't1' },
        triggerWorkflows: workflow.key,
      });
      expect(res1.status).toBe(400);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.FAILED);
    });

    it('end as success', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        sync: true,
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'end',
      });

      const res1 = await userAgents[0].resource('posts').trigger({
        values: { title: 't1' },
        triggerWorkflows: workflow.key,
      });
      expect(res1.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('context type', () => {
    it('global', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.GLOBAL,
        },
      });

      const res1 = await userAgents[0].resource('workflows').trigger({
        triggerWorkflows: workflow.key,
        values: { a: 123 },
      });
      expect(res1.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data).toEqual({ a: 123 });
      expect(e1.context.user.id).toBe(users[0].id);
      expect(e1.context.roleName).toBe('member');
    });

    it('collection bulk action', async () => {
      const [p1, p2] = await PostRepo.createMany({
        records: [{ title: 't1' }, { title: 't2' }],
      });
      const workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.MULTIPLE_RECORDS,
          collection: 'posts',
        },
      });

      const res1 = await userAgents[0].resource('posts').trigger({
        triggerWorkflows: workflow.key,
        filterByTk: [p1.id, p2.id],
      });
      expect(res1.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      expect(e1.context.data.length).toBe(2);
      expect(e1.context.data[0].title).toBe('t1');
      expect(e1.context.data[1].title).toBe('t2');
      // expect(e1.context.data).toEqual({ a: 123 });

      const res2 = await userAgents[0].resource('posts').trigger({
        triggerWorkflows: workflow.key,
        filterByTk: [p1.id],
        values: { title: 't3' },
      });
      expect(res2.status).toBe(200);

      const [e2] = await workflow.getExecutions({
        where: {
          id: {
            [Op.gt]: e1.id,
          },
        },
      });
      expect(e2.status).toEqual(EXECUTION_STATUS.RESOLVED);
      expect(e2.context.data.length).toBe(1);
      expect(e2.context.data[0].title).toBe('t3');
    });
  });

  describe('multiple data source', () => {
    describe('pass through', () => {
      it('trigger on another data source', async () => {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'custom-action',
          sync: true,
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
            collection: 'another:posts',
          },
        });

        const res1 = await userAgents[0]
          .set('x-data-source', 'another')
          .post(`/api/posts:trigger?triggerWorkflows=${workflow.key}`)
          .send({ title: 't2' });

        expect(res1.status).toBe(200);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
        expect(e1.context.data.title).toBe('t2');
      });
    });

    describe('miss configured', () => {
      it('data source not exist', async () => {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'custom-action',
          sync: true,
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
            collection: 'nonexist:posts',
          },
        });

        const res1 = await userAgents[0]
          .set('x-data-source', 'nonexist')
          .post(`/api/posts:trigger?triggerWorkflows=${workflow.key}`)
          .send({ title: 't2' });

        expect(res1.status).toBe(500);
        expect(res1.body.errors).toBeDefined();
        expect(res1.body.errors).toHaveLength(1);
        expect(res1.body.errors[0].message).toBe('data source nonexist does not exist');

        const e1s = await workflow.getExecutions();
        expect(e1s.length).toBe(0);
      });

      it('collection not exist', async () => {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'custom-action',
          sync: true,
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
            collection: 'another:notExist',
          },
        });

        const res1 = await userAgents[0]
          .set('x-data-source', 'another')
          .post(`/api/notExist:trigger?triggerWorkflows=${workflow.key}`)
          .send({ title: 't2' });

        expect(res1.status).toBe(404);

        const e1s = await workflow.getExecutions();
        expect(e1s.length).toBe(0);
      });
    });

    describe('end node', () => {
      it('fail', async () => {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'custom-action',
          sync: true,
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
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
          .post(`/api/posts:trigger?triggerWorkflows=${workflow.key}`)
          .send({ title: 't2' });

        expect(res1.status).toBe(400);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toEqual(EXECUTION_STATUS.FAILED);
      });

      it('success', async () => {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'custom-action',
          sync: true,
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
            collection: 'another:posts',
          },
        });

        const n1 = await workflow.createNode({
          type: 'end',
        });

        const res1 = await userAgents[0]
          .set('x-data-source', 'another')
          .post(`/api/posts:trigger?triggerWorkflows=${workflow.key}`)
          .send({ title: 't2' });

        expect(res1.status).toBe(200);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      });
    });

    describe('associations', () => {
      it('belongsTo', async () => {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'custom-action',
          sync: true,
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
            collection: 'another:categories',
          },
        });

        const p1 = await db.getCollection('posts').repository.create({
          values: { title: 'p1', category: { title: 'c1' } },
        });

        const res1 = await userAgents[0]
          .set('x-data-source', 'another')
          .post(`/api/posts/${p1.id}/category:trigger?triggerWorkflows=${workflow.key}`)
          .send({ filterByTk: `${p1.categoryId}`, values: { title: 'c2' } });

        expect(res1.status).toBe(200);

        const e1s = await workflow.getExecutions();
        expect(e1s.length).toBe(1);
        expect(e1s[0].context.data.filterByTk).toBe(`${p1.categoryId}`);
        expect(e1s[0].context.data.values.title).toBe('c2');
      });
    });

    describe('context type', () => {
      it('collection bulk action', async () => {
        const { collectionManager } = app.dataSourceManager.dataSources.get('another') as SequelizeDataSource;
        const AnotherPostRepo = (collectionManager as SequelizeCollectionManager).db.getRepository('posts');
        const [p1, p2] = await AnotherPostRepo.createMany({
          records: [{ title: 't1' }, { title: 't2' }],
        });
        const workflow = await WorkflowModel.create({
          enabled: true,
          sync: true,
          type: 'custom-action',
          config: {
            type: CONTEXT_TYPE.MULTIPLE_RECORDS,
            collection: 'another:posts',
          },
        });

        const res1 = await userAgents[0]
          .set('x-data-source', 'another')
          .post(`/api/posts:trigger?triggerWorkflows=${workflow.key}&filterByTk[]=${p1.id}&filterByTk[]=${p2.id}`)
          .send({});

        expect(res1.status).toBe(200);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
        expect(e1.context.data.length).toBe(2);
        expect(e1.context.data[0].title).toBe('t1');
        expect(e1.context.data[1].title).toBe('t2');
      });
    });
  });
});
