/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_STATUS, JOB_STATUS } from '../constants';

describe('workflow > Processor', () => {
  let app: MockServer;
  let db: MockDatabase;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let plugin;

  beforeEach(async () => {
    app = await getApp();
    plugin = app.pm.get('workflow');

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
  });

  afterEach(() => app.destroy());

  describe('base', () => {
    it.skipIf(process.env['DB_DIALECT'] === 'sqlite')('job id out of max safe integer', async () => {
      const JobModel = db.getModel('jobs');

      const records = await JobModel.bulkCreate([
        {
          id: '10267424896650240',
        },
        {
          id: '10267424930204672',
        },
      ]);

      expect(records.length).toBe(2);
    });

    it('empty workflow without any nodes', async () => {
      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.context.data.title).toEqual(post.title);
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);
    });

    it('execute resolved workflow', async () => {
      await workflow.createNode({
        type: 'echo',
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      // expect(execution.start()).rejects.toThrow();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(1);
    });

    it('workflow with single simple node', async () => {
      await workflow.createNode({
        type: 'echo',
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.context.data.title).toEqual(post.title);
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(1);
      const { status, result } = jobs[0].get();
      expect(status).toEqual(JOB_STATUS.RESOLVED);
      expect(result).toMatchObject({ data: JSON.parse(JSON.stringify(post.toJSON())) });
    });

    it('workflow with multiple simple nodes', async () => {
      const n1 = await workflow.createNode({
        title: 'echo 1',
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        title: 'echo 2',
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.context.data.title).toEqual(post.title);
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(2);
      const { status, result } = jobs[1].get();
      expect(status).toEqual(JOB_STATUS.RESOLVED);
      expect(result).toMatchObject({ data: JSON.parse(JSON.stringify(post.toJSON())) });
    });

    it('workflow with error node', async () => {
      await workflow.createNode({
        type: 'error',
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.ERROR);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(1);
      const { status, result } = jobs[0].get();
      expect(status).toEqual(JOB_STATUS.ERROR);
      expect(result.message).toBe('definite error');
    });

    it('workflow with customized success node', async () => {
      await workflow.createNode({
        type: 'customizedSuccess',
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(1);
      const { status, result } = jobs[0].get();
      expect(status).toEqual(100);
    });

    it('workflow with customized error node', async () => {
      await workflow.createNode({
        type: 'customizedError',
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.FAILED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(1);
      const { status, result } = jobs[0].get();
      expect(status).toEqual(-100);
    });
  });

  describe('manual nodes', () => {
    it('manual node should suspend execution, and could be manually resume', async () => {
      const n1 = await workflow.createNode({
        type: 'prompt',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.STARTED);
      const [pending] = await execution.getJobs();
      expect(pending.status).toEqual(JOB_STATUS.PENDING);
      expect(pending.result).toEqual(null);

      pending.set({
        status: JOB_STATUS.RESOLVED,
        result: 123,
      });
      pending.execution = execution;
      await plugin.resume(pending);

      await sleep(500);

      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toEqual(2);
      expect(jobs[0].status).toEqual(JOB_STATUS.RESOLVED);
      expect(jobs[0].result).toEqual(123);
      expect(jobs[1].status).toEqual(JOB_STATUS.RESOLVED);
      expect(jobs[1].result).toEqual(123);
    });

    it('manual node should suspend execution, resuming with error should end execution', async () => {
      const n1 = await workflow.createNode({
        type: 'prompt->error',
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.STARTED);
      const [pending] = await execution.getJobs();
      expect(pending.status).toEqual(JOB_STATUS.PENDING);
      expect(pending.result).toEqual(null);

      pending.set('result', 123);
      pending.execution = execution;
      await plugin.resume(pending);

      await sleep(500);

      expect(execution.status).toEqual(EXECUTION_STATUS.ERROR);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(1);
      expect(jobs[0].status).toEqual(JOB_STATUS.ERROR);
      expect(jobs[0].result.message).toEqual('input failed');
    });
  });

  describe('branch: condition', () => {
    it('condition node link to different downstreams', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
        // no config means always true
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        branchIndex: 1,
        upstreamId: n1.id,
      });

      await workflow.createNode({
        type: 'echo',
        branchIndex: 0,
        upstreamId: n1.id,
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toEqual(2);
      expect(jobs[0].nodeId).toEqual(n1.id);
      expect(jobs[1].nodeId).toEqual(n2.id);
      expect(jobs[1].result).toEqual(true);
    });

    it('suspend downstream in condition branch, then go on', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
        // no config means always true
      });

      const n2 = await workflow.createNode({
        type: 'prompt',
        branchIndex: 1,
        upstreamId: n1.id,
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n3);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.STARTED);

      const [pending] = await execution.getJobs({ where: { nodeId: n2.id } });
      pending.set({
        status: JOB_STATUS.RESOLVED,
        result: 123,
      });
      pending.execution = execution;
      await plugin.resume(pending);

      await sleep(500);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(3);
    });

    it('resume error downstream in condition branch, should error', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
        // no config means always true
      });

      const n2 = await workflow.createNode({
        type: 'prompt->error',
        branchIndex: 1,
        upstreamId: n1.id,
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n3);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.STARTED);

      const [pending] = await execution.getJobs({ where: { nodeId: n2.id } });
      pending.set('result', 123);
      pending.execution = execution;
      await plugin.resume(pending);

      await sleep(500);

      expect(execution.status).toEqual(EXECUTION_STATUS.ERROR);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(2);
    });
  });
});
