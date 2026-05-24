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
    db = app.db;
    const UserRepo = db.getCollection('users').repository;
    const user = await UserRepo.findOne();
    agent = await app.agent().loginUsingId(user.id);
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
      expect(e2[0].get('status')).toBe(EXECUTION_STATUS.ABORTED);
      const jobs = await e2[0].getJobs();
      expect(jobs[0].status).toBe(JOB_STATUS.ABORTED);
    });
  });

  describe('rerun', () => {
    async function prepareStartedExecution() {
      const n1 = await workflow.createNode({
        type: 'echo',
      });
      const n2 = await workflow.createNode({
        type: 'pending',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(execution.status).toBe(EXECUTION_STATUS.STARTED);
      expect(jobs.length).toBe(2);
      return { execution, n1, n2 };
    }

    it('only root could rerun executions', async () => {
      const { execution } = await prepareStartedExecution();

      const res1 = await userAgents[0].resource('executions').rerun({
        filterByTk: execution.id,
      });
      expect(res1.status).toBe(403);

      const res2 = await agent.resource('executions').rerun({
        filterByTk: execution.id,
      });
      expect(res2.status).toBe(202);
    });

    it('execution not exists could not be rerun', async () => {
      const { status } = await agent.resource('executions').rerun({
        filterByTk: -1,
      });

      expect(status).toBe(404);
    });

    it('only started execution could be rerun', async () => {
      await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);

      const res1 = await agent.resource('executions').rerun({
        filterByTk: execution.id,
      });
      expect(res1.status).toBe(409);

      const queued = await workflow.createExecution({
        status: EXECUTION_STATUS.QUEUEING,
        context: {},
        key: workflow.key,
      });
      const res2 = await agent.resource('executions').rerun({
        filterByTk: queued.id,
      });
      expect(res2.status).toBe(409);
    });

    it('rerun without overwrite creates new jobs from head node', async () => {
      const { execution, n1, n2 } = await prepareStartedExecution();

      const res = await agent.resource('executions').rerun({
        filterByTk: execution.id,
      });
      expect(res.status).toBe(202);
      await sleep(500);

      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.filter((job) => job.nodeId === n1.id).length).toBe(2);
      expect(jobs.filter((job) => job.nodeId === n2.id).length).toBe(2);
    });

    it('rerun with nodeId starts from the specified node', async () => {
      const { execution, n1, n2 } = await prepareStartedExecution();

      const res = await agent.resource('executions').rerun({
        filterByTk: execution.id,
        values: {
          nodeId: n2.id,
        },
      });
      expect(res.status).toBe(202);
      await sleep(500);

      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.filter((job) => job.nodeId === n1.id).length).toBe(1);
      expect(jobs.filter((job) => job.nodeId === n2.id).length).toBe(2);
    });

    it('rerun with overwrite updates target latest job', async () => {
      const { execution, n1, n2 } = await prepareStartedExecution();
      const [firstJob] = await execution.getJobs({ where: { nodeId: n1.id } });

      const res = await agent.resource('executions').rerun({
        filterByTk: execution.id,
        values: {
          nodeId: n1.id,
          overwrite: true,
        },
      });
      expect(res.status).toBe(202);
      await sleep(500);

      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      const headJobs = jobs.filter((job) => job.nodeId === n1.id);
      expect(headJobs.length).toBe(1);
      expect(headJobs[0].id).toBe(firstJob.id);
      expect(jobs.filter((job) => job.nodeId === n2.id).length).toBe(2);
    });

    it('rerun fails when node does not exist', async () => {
      const { execution } = await prepareStartedExecution();

      const res = await agent.resource('executions').rerun({
        filterByTk: execution.id,
        values: {
          nodeId: -1,
        },
      });
      expect(res.status).toBe(400);
    });

    it('rerun fails when workflow revision does not exist', async () => {
      const { execution } = await prepareStartedExecution();
      await workflow.destroy();

      const res = await agent.resource('executions').rerun({
        filterByTk: execution.id,
      });
      expect(res.status).toBe(400);
    });

    it('rerun fails when target node has no latest job', async () => {
      const n1 = await workflow.createNode({
        type: 'echo',
      });
      const execution = await workflow.createExecution({
        status: EXECUTION_STATUS.STARTED,
        context: {},
        key: workflow.key,
      });

      const res = await agent.resource('executions').rerun({
        filterByTk: execution.id,
        values: {
          nodeId: n1.id,
        },
      });
      expect(res.status).toBe(400);
    });
  });
});
