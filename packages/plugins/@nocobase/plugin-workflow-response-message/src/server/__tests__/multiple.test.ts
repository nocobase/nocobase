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

describe.skip('workflow > multiple workflows', () => {
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

  describe('order', () => {
    it('workflow 2 run first and pass, workflow 1 ends as success', async () => {
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

      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          action: 'create',
          collection: 'posts',
        },
      });

      const n3 = await w2.createNode({
        type: 'response-message',
        config: {
          message: 'm2',
        },
      });

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: w2.key,
      });

      expect(res1.status).toBe(200);
      expect(res1.body.data).toBeUndefined();
      expect(res1.body.messages).toEqual([{ message: 'm2' }, { message: 'm1' }]);

      const post = await PostRepo.findOne();
      expect(post).toBeNull();

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
      const j1s = await e1.getJobs();
      expect(j1s.length).toBe(2);

      const [e2] = await w2.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
      const j2s = await e2.getJobs();
      expect(j2s.length).toBe(1);
    });

    it('local workflow in trigger key order', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          action: 'create',
          collection: 'posts',
        },
      });

      const n1 = await w1.createNode({
        type: 'response-message',
        config: {
          message: 'm1',
        },
      });

      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          action: 'create',
          collection: 'posts',
        },
      });

      const n2 = await w2.createNode({
        type: 'response-message',
        config: {
          message: 'm2',
        },
      });

      const n3 = await w2.createNode({
        type: 'end',
        config: {
          endStatus: JOB_STATUS.RESOLVED,
        },
        upstreamId: n2.id,
      });

      await n2.setDownstream(n3);

      const res1 = await userAgents[0].resource('posts').create({
        values: { title: 't1' },
        triggerWorkflows: [w2.key, w1.key].join(),
      });

      expect(res1.status).toBe(200);
      expect(res1.body.data).toBeUndefined();
      expect(res1.body.messages).toEqual([{ message: 'm2' }]);

      const post = await PostRepo.findOne();
      expect(post).toBeNull();

      const e1s = await w1.getExecutions();
      expect(e1s.length).toBe(0);
      const [e2] = await w2.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await e2.getJobs();
      expect(jobs.length).toBe(2);
    });
  });
});
