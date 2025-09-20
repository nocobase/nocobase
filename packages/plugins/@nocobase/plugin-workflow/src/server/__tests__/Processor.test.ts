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
import Instruction from '../instructions';

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
      expect(jobs[0].nodeId).toEqualNumberOrString(n1.id);
      expect(jobs[1].nodeId).toEqualNumberOrString(n2.id);
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

  describe('edge cases', () => {
    it('loop with delay inside, bigint job id', async () => {
      class BigIntIdBranchInstruction extends Instruction {
        async run(node, prevJob, processor) {
          const [branch] = processor.getBranches(node);
          if (!branch) {
            return {
              status: JOB_STATUS.RESOLVED,
              result: { looped: 0 },
            };
          }
          const job = processor.saveJob({
            id: '16033386100689920',
            status: JOB_STATUS.PENDING,
            result: { looped: 0 },
            nodeId: node.id,
            nodeKey: node.key,
            upstreamId: prevJob?.id ?? null,
          });

          await processor.run(branch, job);

          return null;
        }
        async resume(node, branchJob, processor) {
          const [branch] = processor.getBranches(node);
          const job = processor.findBranchParentJob(branchJob, node);
          const { result, status } = job;
          if (status !== JOB_STATUS.PENDING) {
            processor.logger.warn(`job (#${job.id}) is not pending, status: ${status}`);
            return null;
          }

          if (!result.looped) {
            job.set({
              result: { looped: 1 },
            });
            processor.saveJob(job);
            await processor.run(branch, job);
            return null;
          }

          job.set({
            status: JOB_STATUS.RESOLVED,
          });
          return job;
        }
      }
      class BigIntIdInstruction extends Instruction {
        run(node, prevJob, processor) {
          const lastJob = processor.lastSavedJob;
          const job = processor.saveJob({
            id: lastJob.result.looped ? '16033386100689922' : '16033386100689921',
            status: JOB_STATUS.PENDING,
            nodeId: node.id,
            nodeKey: node.key,
            upstreamId: prevJob?.id ?? null,
          });

          setTimeout(() => {
            this.workflow.resume(job);
          }, 500);

          return null;
        }
        async resume(node, prevJob, processor) {
          console.log(
            '--------',
            processor.execution.jobs.map((item) => ({
              id: item.id,
              nodeId: item.nodeId,
              nodeType: processor.nodesMap.get(item.nodeId)?.type,
              status: item.status,
            })),
          );
          prevJob.set('status', JOB_STATUS.RESOLVED);
          return prevJob;
        }
      }
      plugin.registerInstruction('bigIntIdBranch', BigIntIdBranchInstruction);
      plugin.registerInstruction('bigIntId', BigIntIdInstruction);
      const asyncWorkflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
        config: {},
      });
      const n1 = await asyncWorkflow.createNode({
        type: 'bigIntIdBranch',
      });

      const n2 = await asyncWorkflow.createNode({
        type: 'bigIntId',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      plugin.trigger(asyncWorkflow, {});

      await sleep(100);

      const [e1] = await asyncWorkflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
      const j1s = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(j1s.length).toBe(2);
      expect(j1s[0].status).toBe(JOB_STATUS.PENDING);
      expect(j1s[1].status).toBe(JOB_STATUS.PENDING);

      await sleep(600);
      const [e2] = await asyncWorkflow.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.STARTED);
      const j2s = await e2.getJobs({ order: [['id', 'ASC']] });
      expect(j2s.length).toBe(3);
      expect(j2s[0].status).toBe(JOB_STATUS.PENDING);
      expect(j2s[1].status).toBe(JOB_STATUS.RESOLVED);
      expect(j2s[2].status).toBe(JOB_STATUS.PENDING);

      await sleep(500);
      const [e3] = await asyncWorkflow.getExecutions();
      expect(e3.status).toBe(EXECUTION_STATUS.RESOLVED);
      const j3s = await e3.getJobs({ order: [['id', 'ASC']] });
      expect(j3s.length).toBe(3);
      expect(j3s[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(j3s[1].status).toBe(JOB_STATUS.RESOLVED);
      expect(j3s[2].status).toBe(JOB_STATUS.RESOLVED);
    });
  });
});
