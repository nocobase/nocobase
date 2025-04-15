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
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp } from '@nocobase/plugin-workflow-test';
import { MockServer } from '@nocobase/test';

import Plugin from '..';

describe.skip('workflow > instructions > response-message', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let users;
  let userAgents;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'auth', 'error-handler', 'workflow-request-interceptor', Plugin],
    });

    db = app.db;

    PostRepo = db.getCollection('posts').repository;

    WorkflowModel = db.getModel('workflows');
    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'request-interception',
      config: {
        global: true,
        actions: ['create'],
        collection: 'posts',
      },
    });

    const UserModel = db.getCollection('users').model;
    users = await UserModel.bulkCreate([
      { id: 2, nickname: 'a' },
      { id: 3, nickname: 'b' },
    ]);

    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));
  });

  afterEach(() => app.destroy());

  describe('no end, pass flow', () => {
    it('no message', async () => {
      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(200);
      expect(res1.body).toMatchObject({ data: { title: 't1' } });
      expect(res1.body.messages).toBeUndefined();

      const post = await PostRepo.findOne();
      expect(post).toBeDefined();
      expect(post.title).toBe('t1');

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs();
      expect(jobs.length).toBe(0);
    });

    it('has node, but null message', async () => {
      const n1 = await workflow.createNode({
        type: 'response-message',
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(200);
      expect(res1.body).toMatchObject({ data: { title: 't1' } });
      expect(res1.body.messages).toBeUndefined();

      const post = await PostRepo.findOne();
      expect(post).toBeDefined();
      expect(post.title).toBe('t1');

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs();
      expect(jobs.length).toBe(1);
    });

    it('has node, but empty message', async () => {
      const n1 = await workflow.createNode({
        type: 'response-message',
        config: {
          message: '',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(200);
      expect(res1.body).toMatchObject({ data: { title: 't1' } });
      expect(res1.body.messages).toBeUndefined();

      const post = await PostRepo.findOne();
      expect(post).toBeDefined();
      expect(post.title).toBe('t1');

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs();
      expect(jobs.length).toBe(1);
    });

    it('single static message', async () => {
      const n1 = await workflow.createNode({
        type: 'response-message',
        config: {
          message: 'm1',
        },
      });
      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(200);
      expect(res1.body).toMatchObject({ data: { title: 't1' } });
      expect(res1.body.messages).toEqual([{ message: 'm1' }]);

      const post = await PostRepo.findOne();
      expect(post).toBeDefined();
      expect(post.title).toBe('t1');

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs();
      expect(jobs.length).toBe(1);
    });

    it('multiple static messages', async () => {
      const n1 = await workflow.createNode({
        type: 'response-message',
        config: {
          message: 'm1',
        },
      });
      const n2 = await workflow.createNode({
        type: 'response-message',
        config: {
          message: 'm2',
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(200);
      expect(res1.body).toMatchObject({ data: { title: 't1' } });
      expect(res1.body.messages).toEqual([{ message: 'm1' }, { message: 'm2' }]);

      const post = await PostRepo.findOne();
      expect(post).toBeDefined();
      expect(post.title).toBe('t1');

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs();
      expect(jobs.length).toBe(2);
    });

    it('single dynamic message', async () => {
      const n1 = await workflow.createNode({
        type: 'response-message',
        config: {
          message: 'new post "{{ $context.params.values.title }}" by {{ $context.user.nickname }}',
        },
      });
      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(200);
      expect(res1.body).toMatchObject({ data: { title: 't1' } });
      expect(res1.body.messages).toEqual([{ message: `new post "t1" by ${users[0].nickname}` }]);

      const post = await PostRepo.findOne();
      expect(post).toBeDefined();
      expect(post.title).toBe('t1');

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs();
      expect(jobs.length).toBe(1);
    });
  });

  describe('end as success', () => {
    it('no message', async () => {
      const n1 = await workflow.createNode({
        type: 'end',
        config: {
          endStatus: JOB_STATUS.RESOLVED,
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(200);
      expect(res1.body.data).toBeUndefined();
      expect(res1.body.messages).toBeUndefined();

      const post = await PostRepo.findOne();
      expect(post).toBeNull();

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs();
      expect(jobs.length).toBe(1);

      const posts = await PostRepo.find();
      expect(posts.length).toBe(0);
    });

    it('single static message', async () => {
      const n1 = await workflow.createNode({
        type: 'response-message',
        config: {
          message: 'm1',
        },
      });

      const n2 = await workflow.createNode({
        type: 'end',
        config: {
          endStatus: JOB_STATUS.RESOLVED,
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(200);
      expect(res1.body.data).toBeUndefined();
      expect(res1.body.messages).toEqual([{ message: 'm1' }]);

      const post = await PostRepo.findOne();
      expect(post).toBeNull();

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs();
      expect(jobs.length).toBe(2);
    });
  });

  describe('end as failure', () => {
    it('no message', async () => {
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
      expect(res1.body.data).toBeUndefined();
      expect(res1.body.messages).toBeUndefined();

      const post = await PostRepo.findOne();
      expect(post).toBeNull();

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.FAILED);
      const jobs = await e1.getJobs();
      expect(jobs.length).toBe(1);
    });

    it('single static message', async () => {
      const n1 = await workflow.createNode({
        type: 'response-message',
        config: {
          message: 'm1',
        },
      });

      const n2 = await workflow.createNode({
        type: 'end',
        config: {
          endStatus: JOB_STATUS.FAILED,
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
      });

      expect(res1.status).toBe(400);
      expect(res1.body.data).toBeUndefined();
      expect(res1.body.errors).toEqual([{ message: 'm1' }]);

      const post = await PostRepo.findOne();
      expect(post).toBeNull();

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.FAILED);
      const jobs = await e1.getJobs();
      expect(jobs.length).toBe(2);
    });
  });
});
