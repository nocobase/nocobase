/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, Transaction } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_REASON, EXECUTION_STATUS, JOB_STATUS } from '../constants';
import Processor from '../Processor';
import { Instruction } from '../instructions';
import type { FlowNodeModel } from '../types';

type FinishedTransaction = Transaction & {
  finished?: string;
};

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

  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });

  describe('base', () => {
    it.skipIf(process.env['DB_DIALECT'] === 'sqlite')('updates job id out of max safe integer', async () => {
      const node = await workflow.createNode({ type: 'echo' });
      const execution = await workflow.createExecution({
        key: workflow.key,
        context: {},
        dispatched: true,
        status: EXECUTION_STATUS.STARTED,
      });
      // This value is rounded to 10267424896650240 when coerced to a JavaScript number.
      const id = '10267424896650241';
      vi.spyOn(plugin.snowflake, 'getUniqueID').mockReturnValue(BigInt(id));
      const processor = plugin.createProcessor(execution);
      const job = processor.saveJob({
        nodeId: node.id,
        nodeKey: node.key,
        status: JOB_STATUS.PENDING,
        result: null,
      });
      await processor.exit();
      expect(job.id).toBe(id);

      job.set({
        status: JOB_STATUS.RESOLVED,
        result: { value: 1 },
      });
      processor.saveJob(job);
      await processor.exit();

      const savedJob = await db.getRepository('jobs').findOne({
        filter: { executionId: execution.id },
      });
      expect(savedJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(savedJob.result).toEqual({ value: 1 });
    });

    it('saves new jobs in batches', async () => {
      const node = await workflow.createNode({ type: 'echo' });
      const execution = await workflow.createExecution({
        key: workflow.key,
        context: {},
        dispatched: true,
        status: EXECUTION_STATUS.STARTED,
      });
      const processor = plugin.createProcessor(execution);
      const JobModel = db.getModel('jobs');
      const bulkCreate = vi.spyOn(JobModel, 'bulkCreate');

      for (let index = 0; index < 201; index += 1) {
        processor.saveJob({
          nodeId: node.id,
          nodeKey: node.key,
          status: JOB_STATUS.RESOLVED,
          result: index,
        });
      }

      await processor.exit();

      expect(bulkCreate).toHaveBeenCalledTimes(3);
      expect(bulkCreate.mock.calls[0][0]).toHaveLength(100);
      expect(bulkCreate.mock.calls[1][0]).toHaveLength(100);
      expect(bulkCreate.mock.calls[2][0]).toHaveLength(1);
      expect(await execution.countJobs()).toBe(201);
    });

    it('updates existing jobs using model field mappings', async () => {
      await app.destroy();
      app = await getApp({
        database: {
          underscored: false,
        },
      });
      plugin = app.pm.get('workflow');
      db = app.db;

      const WorkflowModel = db.getCollection('workflows').model;
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'syncTrigger',
      });
      const node = await workflow.createNode({ type: 'echo' });
      const execution = await workflow.createExecution({
        key: workflow.key,
        context: {},
        dispatched: true,
        status: EXECUTION_STATUS.STARTED,
      });
      const processor = plugin.createProcessor(execution);
      const startedAt = new Date('2026-08-07T00:00:00.000Z');
      const job = processor.saveJob({
        nodeId: node.id,
        nodeKey: node.key,
        status: JOB_STATUS.PENDING,
        result: null,
      });

      await processor.exit();

      job.set({
        status: JOB_STATUS.RESOLVED,
        meta: { source: 'test' },
        result: { value: 1 },
        startedAt,
      });
      processor.saveJob(job);
      await processor.exit();

      const savedJob = await db.getRepository('jobs').findOne({
        filterByTk: job.id,
      });
      expect(savedJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(savedJob.meta).toEqual({ source: 'test' });
      expect(savedJob.result).toEqual({ value: 1 });
      expect(savedJob.startedAt).toEqual(startedAt);
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
        type: 'echoVariable',
        config: {
          variable: '{{$context}}',
        },
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
        type: 'echoVariable',
        config: {
          variable: '{{$context}}',
        },
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

    it('rolls back unclosed scope transactions on abnormal exit', async () => {
      const commit = vi.fn();
      const rollback = vi.fn();
      const transaction = {
        commit,
        rollback,
      } as unknown as Transaction;

      class LeakingScopeTransactionInstruction extends Instruction {
        run(node: FlowNodeModel, _input: unknown, processor: Processor) {
          processor.setScopeTransaction(node.key, {
            transaction,
            dataSource: 'main',
          });
          return null;
        }
      }

      plugin.registerInstruction('leakingScopeTransaction', LeakingScopeTransactionInstruction);
      await workflow.createNode({
        type: 'leakingScopeTransaction',
      });

      await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.ERROR);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(commit).not.toHaveBeenCalled();
    });

    it('marks pending jobs as error when an open scope transaction exits without status', async () => {
      const rollback = vi.fn();
      const transaction = {
        commit: vi.fn(),
        rollback,
      } as unknown as Transaction;

      class PendingScopeExitInstruction extends Instruction {
        run(node: FlowNodeModel, _input: unknown, processor: Processor) {
          const downstream = processor.nodes.find((item) => item.upstreamId === node.id) as FlowNodeModel;
          processor.setScopeTransaction(node.key, {
            transaction,
            dataSource: 'main',
          });
          processor.saveJob({
            status: JOB_STATUS.PENDING,
            result: null,
            nodeId: node.id,
            nodeKey: node.key,
            upstreamId: null,
          });
          processor.saveJob({
            status: JOB_STATUS.PENDING,
            result: null,
            nodeId: downstream.id,
            nodeKey: downstream.key,
            upstreamId: null,
          });
          return null;
        }
      }

      plugin.registerInstruction('pendingScopeExit', PendingScopeExitInstruction);
      const n1 = await workflow.createNode({
        type: 'pendingScopeExit',
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

      expect(execution.status).toEqual(EXECUTION_STATUS.ERROR);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(jobs.map((job) => job.status)).toEqual([JOB_STATUS.ERROR, JOB_STATUS.ERROR]);
      expect(jobs.map((job) => job.result)).toEqual([
        {
          message: 'Pending jobs are not allowed inside an open transaction scope',
        },
        {
          message: 'Pending jobs are not allowed inside an open transaction scope',
        },
      ]);
    });

    it('does not clean up scope transactions on exit(true)', async () => {
      const commit = vi.fn();
      const rollback = vi.fn();
      const transaction = {
        commit,
        rollback,
      } as unknown as Transaction;

      class YieldingScopeTransactionInstruction extends Instruction {
        run(node: FlowNodeModel, _input: unknown, processor: Processor) {
          processor.setScopeTransaction(node.key, {
            transaction,
            dataSource: 'main',
          });
        }
      }

      plugin.registerInstruction('yieldingScopeTransaction', YieldingScopeTransactionInstruction);
      await workflow.createNode({
        type: 'yieldingScopeTransaction',
      });

      await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.STARTED);
      expect(rollback).not.toHaveBeenCalled();
      expect(commit).not.toHaveBeenCalled();
    });

    it('rolls back commit-marked scope transactions on error exit', async () => {
      const commit = vi.fn();
      const rollback = vi.fn();
      const transaction = {
        commit,
        rollback,
      } as unknown as Transaction;

      class CommitMarkedScopeTransactionInstruction extends Instruction {
        run(node: FlowNodeModel, _input: unknown, processor: Processor) {
          processor.setScopeTransaction(node.key, {
            transaction,
            dataSource: 'main',
          });
          processor.markScopeTransactionClosing(node.key, 'commit');
          return {
            status: JOB_STATUS.ERROR,
            result: {
              message: 'commit failed',
            },
          };
        }
      }

      plugin.registerInstruction('commitMarkedScopeTransaction', CommitMarkedScopeTransactionInstruction);
      await workflow.createNode({
        type: 'commitMarkedScopeTransaction',
      });

      await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.ERROR);
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(commit).not.toHaveBeenCalled();
    });

    it.each([
      ['commit', 0],
      ['rollback', 0],
      [undefined, 1],
    ] as const)(
      'respects Sequelize finished flag when cleaning up scope transactions: %s',
      async (finished, rollbacks) => {
        const commit = vi.fn();
        const rollback = vi.fn();
        const transaction = {
          commit,
          rollback,
          finished,
        } as unknown as FinishedTransaction;

        class FinishedScopeTransactionInstruction extends Instruction {
          run(node: FlowNodeModel, _input: unknown, processor: Processor) {
            processor.setScopeTransaction(node.key, {
              transaction,
              dataSource: 'main',
            });
            return null;
          }
        }

        plugin.registerInstruction('finishedScopeTransaction', FinishedScopeTransactionInstruction);
        await workflow.createNode({
          type: 'finishedScopeTransaction',
        });

        await PostRepo.create({ values: { title: 't1' } });
        await sleep(500);

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toEqual(EXECUTION_STATUS.ERROR);
        expect(rollback).toHaveBeenCalledTimes(rollbacks);
        expect(commit).not.toHaveBeenCalled();
      },
    );

    it('cleans up nested scope transactions from inner to outer', async () => {
      const actions: string[] = [];
      const outer = {
        commit: vi.fn(),
        rollback: vi.fn(async () => {
          actions.push('outer');
        }),
      } as unknown as Transaction;
      const inner = {
        commit: vi.fn(),
        rollback: vi.fn(async () => {
          actions.push('inner');
        }),
      } as unknown as Transaction;

      class NestedScopeTransactionInstruction extends Instruction {
        run(_node: FlowNodeModel, _input: unknown, processor: Processor) {
          processor.setScopeTransaction('outer', {
            transaction: outer,
            dataSource: 'main',
          });
          processor.setScopeTransaction('inner', {
            transaction: inner,
            dataSource: 'main',
          });
          return null;
        }
      }

      plugin.registerInstruction('nestedScopeTransaction', NestedScopeTransactionInstruction);
      await workflow.createNode({
        type: 'nestedScopeTransaction',
      });

      await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.ERROR);
      expect(actions).toEqual(['inner', 'outer']);
      expect(outer.commit).not.toHaveBeenCalled();
      expect(inner.commit).not.toHaveBeenCalled();
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

      await execution.reload();
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

      await execution.reload();
      expect(execution.status).toEqual(EXECUTION_STATUS.ERROR);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(1);
      expect(jobs[0].status).toEqual(JOB_STATUS.ERROR);
      expect(jobs[0].result.message).toEqual('input failed');
    });

    it('workflow timeout should abort pending execution', async () => {
      workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        options: {
          timeout: 300,
        },
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      await workflow.createNode({
        type: 'prompt',
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(200);

      let [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.STARTED);
      expect(execution.startedAt).toBeTruthy();
      expect(execution.expiresAt).toBeTruthy();

      for (let i = 0; i < 10; i++) {
        [execution] = await workflow.getExecutions();
        if (execution.status === EXECUTION_STATUS.ABORTED) {
          break;
        }
        await sleep(100);
      }

      [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.ABORTED);
      expect(execution.reason).toEqual(EXECUTION_REASON.TIMEOUT);
      const [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.ABORTED);
    });

    it('workflow timeout should record timeout reason for running execution', async () => {
      workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        options: {
          timeout: 100,
        },
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      await workflow.createNode({
        type: 'timeConsume',
        config: {
          duration: 300,
        },
      });

      await PostRepo.create({ values: { title: 't1' } });

      for (let i = 0; i < 10; i++) {
        const [execution] = await workflow.getExecutions();
        if (execution?.status === EXECUTION_STATUS.ABORTED) {
          expect(execution.reason).toEqual(EXECUTION_REASON.TIMEOUT);
          return;
        }
        await sleep(100);
      }

      throw new Error('execution was not aborted by timeout in time');
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

      await execution.reload();
      expect(execution.status).toEqual(EXECUTION_STATUS.ERROR);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(2);
    });
  });

  describe('job log field', () => {
    let syncWorkflow;

    beforeEach(async () => {
      syncWorkflow = await WorkflowModel.create({
        enabled: true,
        type: 'syncTrigger',
      });
    });

    it('node returns log field which is saved to job', async () => {
      await syncWorkflow.createNode({
        type: 'log',
        config: {
          result: 42,
          log: 'test log output',
        },
      });

      const { execution } = (await plugin.trigger(syncWorkflow, {})) as Processor;
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
      expect(job.result).toBe(42);
      expect(job.log).toBe('test log output');
    });

    it('node without log field results in null log on job', async () => {
      await syncWorkflow.createNode({
        type: 'echo',
      });

      const { execution } = (await plugin.trigger(syncWorkflow, {})) as Processor;
      const [job] = await execution.getJobs();
      expect(job.log).toBeNull();
    });

    it('log field stores multi-line text independently from result', async () => {
      const logText = 'line1\nline2\nline3';
      await syncWorkflow.createNode({
        type: 'log',
        config: {
          result: { data: 'some result' },
          log: logText,
        },
      });

      const { execution } = (await plugin.trigger(syncWorkflow, {})) as Processor;
      const [job] = await execution.getJobs();
      expect(job.result).toEqual({ data: 'some result' });
      expect(job.log).toBe(logText);
    });

    it('node returning null log explicitly keeps log as null', async () => {
      await syncWorkflow.createNode({
        type: 'log',
        config: {
          result: 'ok',
          log: null,
        },
      });

      const { execution } = (await plugin.trigger(syncWorkflow, {})) as Processor;
      const [job] = await execution.getJobs();
      expect(job.result).toBe('ok');
      expect(job.log).toBeNull();
    });
  });
});
