/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_STATUS, JOB_STATUS } from '../../constants';

describe('workflow > actions > executions', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let users;
  let userAgents;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'acl', 'auth', 'data-source-manager', 'system-settings'],
      acl: true,
    });
    agent = await app.agent().loginUsingId(1);
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
    const UserRepo = db.getCollection('users').repository;
    users = await UserRepo.createMany({
      records: [
        { id: 2, nickname: 'a', roles: ['admin'] },
        { id: 3, nickname: 'b' },
      ],
    });
    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));
  });

  afterEach(async () => await app.destroy());

  describe('destroy', () => {
    it('completed execution could be deleted', async () => {
      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.RESOLVED);

      const res1 = await agent.resource('executions').destroy({
        filter: {
          key: workflow.key,
        },
      });
      expect(res1.status).toBe(200);

      const e2 = await workflow.getExecutions();
      expect(e2.length).toBe(0);
    });

    it('started execution could not be deleted', async () => {
      await workflow.createNode({
        type: 'pending',
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.STARTED);

      await agent.resource('executions').destroy({
        filter: {
          key: workflow.key,
        },
      });

      const e2 = await workflow.getExecutions();
      expect(e2.length).toBe(1);
    });

    it('role as admin could delete execution', async () => {
      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.RESOLVED);

      const res1 = await userAgents[1].resource('executions').destroy({
        filter: {
          key: workflow.key,
        },
      });
      expect(res1.status).toBe(403);
      const res2 = await userAgents[0].resource('executions').destroy({
        filter: {
          key: workflow.key,
        },
      });
      expect(res2.status).toBe(200);

      const e2 = await workflow.getExecutions();
      expect(e2.length).toBe(0);
    });
  });

  describe('cancel', () => {
    it('execution not exists could not be canceled', async () => {
      const { status } = await agent.resource('executions').cancel({
        filterByTk: -1,
      });

      expect(status).toBe(404);
    });

    it('completed execution could not be canceled', async () => {
      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.RESOLVED);

      const { status } = await agent.resource('executions').cancel({
        filterByTk: e1.id,
      });

      expect(status).toBe(400);
    });

    it('pending execution could be cancel', async () => {
      await workflow.createNode({
        type: 'pending',
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.STARTED);

      await agent.resource('executions').cancel({
        filterByTk: e1.id,
      });

      const e2 = await workflow.getExecutions();
      expect(e2.length).toBe(1);
      expect(e2[0].get('status')).toBe(EXECUTION_STATUS.CANCELED);
      const jobs = await e2[0].getJobs();
      expect(jobs[0].status).toBe(JOB_STATUS.CANCELED);
    });
  });
});
