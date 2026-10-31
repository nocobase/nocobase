/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MockServer, ExtendedAgent } from '@nocobase/test';
import Database, { Repository, Model } from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_REASON, EXECUTION_STATUS, JOB_STATUS } from '../../constants';
import PluginWorkflowServer from '../../Plugin';
import { WorkflowModel, ExecutionModel, FlowNodeModel, JobModel } from '../../types';

describe('workflow > actions > executions', () => {
  let app: MockServer;
  let agent: ExtendedAgent;
  let db: Database;
  let PostRepo: Repository;
  let WorkflowRepo: Repository;
  let workflow: WorkflowModel;
  let users: Model[];
  let userAgents: ExtendedAgent[];

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'acl', 'auth', 'data-source-manager', 'system-settings'],
      acl: true,
    });
    db = app.db;
    const UserRepo = db.getCollection('users').repository;
    const user = await UserRepo.findOne();
    agent = await app.agent().loginUsingId(user.id);
    WorkflowRepo = db.getCollection('workflows').repository;
    PostRepo = db.getCollection('posts').repository;

    workflow = await WorkflowRepo.create({
      values: {
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
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

  describe('job history', () => {
    async function prepareHistory() {
      const node = await workflow.createNode({ type: 'echo' });
      const otherNode = await workflow.createNode({ type: 'echo' });
      const execution = await db.getRepository('executions').create({
        values: { workflowId: workflow.id, key: workflow.key, status: EXECUTION_STATUS.RESOLVED },
      });
      const otherExecution = await db.getRepository('executions').create({
        values: { workflowId: workflow.id, key: workflow.key, status: EXECUTION_STATUS.RESOLVED },
      });
      const Job = db.getModel('jobs');
      await Job.bulkCreate([
        ...Array.from({ length: 45 }, (_, index) => ({
          id: index + 1,
          executionId: execution.id,
          nodeId: node.id,
          nodeKey: node.key,
          status: JOB_STATUS.RESOLVED,
          result: { large: 'result' },
          meta: { large: 'meta' },
          log: 'large log',
        })),
        { id: 46, executionId: execution.id, nodeId: otherNode.id, status: JOB_STATUS.FAILED },
        { id: 47, executionId: otherExecution.id, nodeId: node.id, status: JOB_STATUS.RESOLVED },
      ]);
      return { execution, node, otherNode, Job };
    }

    it('loads only the latest lightweight job per node and preserves full single-job details', async () => {
      const { execution } = await prepareHistory();
      const response = await agent.resource('executions').get({
        filterByTk: execution.id,
      });
      expect(response.status).toBe(200);
      expect(response.body.data.jobs.map((job: { id: number }) => String(job.id))).toEqual(['45', '46']);
      expect(response.body.data.workflow.nodes).toHaveLength(2);
      for (const job of response.body.data.jobs) {
        expect(job).not.toHaveProperty('result');
        expect(job).not.toHaveProperty('meta');
        expect(job).not.toHaveProperty('log');
      }
      const detail = await agent.resource('jobs').get({ filterByTk: 45 });
      expect(detail.body.data.result).toEqual({ large: 'result' });
      expect(detail.body.data.meta).toEqual({ large: 'meta' });
      expect(detail.body.data.log).toBe('large log');
    });

    it('ignores caller projections and always returns the fixed detail shape', async () => {
      const { execution } = await prepareHistory();
      await workflow.update({ options: { large: 'workflow options' } });
      const response = await agent.resource('executions').get({
        filterByTk: execution.id,
        latestJobs: false,
        appends: ['jobs', 'jobs.node'],
        fields: ['id', 'jobs.result', 'jobs.meta', 'jobs.log', 'workflow.options'],
        except: ['workflow.nodes'],
      });
      expect(response.status).toBe(200);
      expect(response.body.data.workflow.nodes).toHaveLength(2);
      expect(response.body.data.workflow).not.toHaveProperty('options');
      expect(response.body.data.jobs.map((job: { id: number }) => String(job.id))).toEqual(['45', '46']);
      for (const job of response.body.data.jobs) {
        expect(job).not.toHaveProperty('result');
        expect(job).not.toHaveProperty('meta');
        expect(job).not.toHaveProperty('log');
        expect(job).not.toHaveProperty('node');
      }
    });

    it('paginates within one execution and node, keeping a stable upper bound', async () => {
      const { execution, node, otherNode, Job } = await prepareHistory();
      const params = { nodeId: node.id };
      const first = await agent.get(`/executions/${execution.id}/jobs`).query({ ...params, pageSize: 100000 });
      expect(first.status).toBe(200);
      expect(first.body.data.items).toHaveLength(20);
      expect(first.body.data.total).toBe(45);
      expect(first.body.data.snapshot).toBe('45');
      expect(first.body.data.nextCursor).toBe('26');
      expect(first.body.data.items[0]).not.toHaveProperty('meta');
      expect(first.body.data.items[0]).not.toHaveProperty('result');
      expect(first.body.data.items[0]).not.toHaveProperty('log');
      await Job.create({ id: 48, executionId: execution.id, nodeId: node.id, status: JOB_STATUS.RESOLVED });
      const second = await agent.resource('executions.jobs', execution.id).list({
        ...params,
        before: first.body.data.nextCursor,
        snapshot: first.body.data.snapshot,
      });
      expect(second.body.data.items).toHaveLength(20);
      expect(second.body.data).not.toHaveProperty('total');
      const last = await agent.resource('executions.jobs', execution.id).list({
        ...params,
        before: second.body.data.nextCursor,
        snapshot: second.body.data.snapshot,
      });
      expect(last.body.data.items).toHaveLength(5);
      expect(last.body.data.nextCursor).toBeNull();
      const ids = [...first.body.data.items, ...second.body.data.items, ...last.body.data.items].map(
        (job: { id: number }) => Number(job.id),
      );
      expect(ids).toEqual(Array.from({ length: 45 }, (_, index) => 45 - index));
      const single = await agent.resource('executions.jobs', execution.id).list({ nodeId: otherNode.id });
      expect(single.body.data.total).toBe(1);
      expect(single.body.data.nextCursor).toBeNull();
      const empty = await agent.resource('executions.jobs', execution.id).list({ ...params, nodeId: 0 });
      expect(empty.body.data).toMatchObject({ items: [], total: 0, nextCursor: null });
    });

    it('rejects invalid cursors and users without workflow permissions', async () => {
      const { execution, node } = await prepareHistory();
      const params = { nodeId: node.id };
      const invalid = await agent.resource('executions.jobs', execution.id).list({ ...params, before: 'invalid' });
      expect(invalid.status).toBe(400);
      const missingSnapshot = await agent.resource('executions.jobs', execution.id).list({ ...params, before: '20' });
      expect(missingSnapshot.status).toBe(400);
      const missing = await agent.resource('executions.jobs', 0).list(params);
      expect(missing.status).toBe(404);
      const forbidden = await userAgents[1].resource('executions.jobs', execution.id).list(params);
      expect(forbidden.status).toBe(403);
    });
  });

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

      const e1: ExecutionModel[] = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.RESOLVED);

      const { status } = await agent.resource('executions').cancel({
        filterByTk: e1[0].id,
      });

      expect(status).toBe(400);
    });

    it('pending execution could be cancel', async () => {
      await workflow.createNode({
        type: 'pending',
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1: ExecutionModel[] = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.STARTED);

      await agent.resource('executions').cancel({
        filterByTk: e1[0].id,
      });

      const e2: ExecutionModel[] = await workflow.getExecutions();
      expect(e2.length).toBe(1);
      expect(e2[0].get('status')).toBe(EXECUTION_STATUS.ABORTED);
      expect(e2[0].get('reason')).toBe(EXECUTION_REASON.MANUAL_CANCEL);
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

    async function prepareLongRunningStartedExecution() {
      const n1 = await workflow.createNode({
        type: 'timeConsume',
        config: {
          duration: 1000,
        },
      });
      const n2 = await workflow.createNode({
        type: 'pending',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await PostRepo.create({ values: { title: 't1' } });
      await sleep(1200);

      const [execution] = await workflow.getExecutions();
      const [pendingJob] = await execution.getJobs({ where: { nodeId: n2.id } });
      expect(execution.status).toBe(EXECUTION_STATUS.STARTED);
      expect(pendingJob.status).toBe(JOB_STATUS.PENDING);
      return { execution, pendingJob };
    }

    async function createJob(execution: ExecutionModel, node: FlowNodeModel, values = {}) {
      const workflowPlugin = app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
      const JobModel = db.getModel('jobs');
      return JobModel.create({
        id: workflowPlugin.snowflake.getUniqueID().toString(),
        executionId: execution.id,
        nodeId: node.id,
        nodeKey: node.key,
        status: JOB_STATUS.RESOLVED,
        ...values,
      });
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
      expect(res1.status).toBe(400);

      const queued = await workflow.createExecution({
        status: EXECUTION_STATUS.QUEUEING,
        context: {},
        key: workflow.key,
      });
      const res2 = await agent.resource('executions').rerun({
        filterByTk: queued.id,
      });
      expect(res2.status).toBe(400);
    });

    it('rerun without overwrite creates new jobs from head node', async () => {
      const { execution, n1, n2 } = await prepareStartedExecution();

      const res = await agent.resource('executions').rerun({
        filterByTk: execution.id,
      });
      expect(res.status).toBe(202);
      await sleep(500);

      const jobs: JobModel[] = await execution.getJobs({ order: [['id', 'ASC']] });
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

      const jobs: JobModel[] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.filter((job) => job.nodeId === n1.id).length).toBe(1);
      expect(jobs.filter((job) => job.nodeId === n2.id).length).toBe(2);
    });

    it('rerun with overwrite updates target latest job', async () => {
      const { execution, n1, n2 } = await prepareStartedExecution();
      const [firstJob] = await execution.getJobs({ where: { nodeId: n1.id } });
      await firstJob.update({
        status: JOB_STATUS.ERROR,
        result: {
          old: true,
        },
        meta: {
          old: true,
        },
      });

      const res = await agent.resource('executions').rerun({
        filterByTk: execution.id,
        values: {
          nodeId: n1.id,
          overwrite: true,
        },
      });
      expect(res.status).toBe(202);
      await sleep(500);

      const jobs: JobModel[] = await execution.getJobs({ order: [['id', 'ASC']] });
      const headJobs = jobs.filter((job) => job.nodeId === n1.id);
      expect(headJobs.length).toBe(1);
      expect(headJobs[0].id).toBe(firstJob.id);
      expect(headJobs[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(headJobs[0].result).toEqual(expect.objectContaining({ data: expect.objectContaining({ title: 't1' }) }));
      expect(headJobs[0].meta).toBeNull();
      expect(jobs.filter((job) => job.nodeId === n2.id).length).toBe(2);
    });

    it('rerun uses the latest upstream job as input', async () => {
      const n1 = await workflow.createNode({
        type: 'echo',
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      const n3 = await workflow.createNode({
        type: 'pending',
        upstreamId: n2.id,
      });
      await n1.setDownstream(n2);
      await n2.setDownstream(n3);

      await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const [execution] = await workflow.getExecutions();
      await createJob(execution, n1, {
        result: {
          source: 'latest',
        },
      });

      const res = await agent.resource('executions').rerun({
        filterByTk: execution.id,
        values: {
          nodeId: n2.id,
        },
      });
      expect(res.status).toBe(202);
      await sleep(500);

      const jobs: JobModel[] = await execution.getJobs({ where: { nodeId: n2.id }, order: [['id', 'ASC']] });
      expect(jobs[jobs.length - 1].result).toEqual({ source: 'latest' });
    });

    it('processing rerun blocks cancel', async () => {
      const { execution } = await prepareLongRunningStartedExecution();

      const rerunRes = await agent.resource('executions').rerun({
        filterByTk: execution.id,
      });
      expect(rerunRes.status).toBe(202);
      await sleep(100);

      const cancelRes = await agent.resource('executions').cancel({
        filterByTk: execution.id,
      });
      expect(cancelRes.status).toBe(409);
    });

    it('processing rerun blocks resume', async () => {
      const { execution, pendingJob } = await prepareLongRunningStartedExecution();

      const rerunRes = await agent.resource('executions').rerun({
        filterByTk: execution.id,
      });
      expect(rerunRes.status).toBe(202);
      await sleep(100);

      const resumeRes = await agent.resource('jobs').resume({
        filterByTk: pendingJob.id,
        values: {
          status: JOB_STATUS.RESOLVED,
        },
      });
      expect(resumeRes.status).toBe(409);
    });
  });
});
