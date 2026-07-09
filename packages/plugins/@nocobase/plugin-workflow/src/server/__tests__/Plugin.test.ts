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
import { vi } from 'vitest';

import Plugin, { Processor } from '..';
import { EXECUTION_STATUS } from '../constants';
import type { ExecutionModel } from '../types';

describe('workflow > Plugin', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let plugin: Plugin;

  beforeEach(async () => {
    app = await getApp();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    plugin = app.pm.get(Plugin) as Plugin;
  });

  afterEach(() => app.destroy());

  describe('create', () => {
    it('create with enabled', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      expect(workflow.current).toBe(true);

      expect(workflow.stats).toBeDefined();
      expect(workflow.stats.executed).toBe(0);
      expect(workflow.versionStats).toBeDefined();
      expect(workflow.versionStats.executed).toBe(0);
    });

    it('create with disabled', async () => {
      const workflow = await WorkflowModel.create({
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      expect(workflow.current).toBe(true);
    });
  });

  describe('update', () => {
    it('toggle on', async () => {
      const workflow = await WorkflowModel.create({
        enabled: false,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });
      expect(workflow.current).toBe(true);

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const count = await workflow.countExecutions();
      expect(count).toBe(0);

      await workflow.update({ enabled: true });
      expect(workflow.current).toBe(true);

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
    });

    it('toggle off', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });
      expect(workflow.current).toBe(true);

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const c1 = await workflow.countExecutions();
      expect(c1).toBe(1);

      await workflow.update({ enabled: false });
      expect(workflow.current).toBe(true);

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const c2 = await workflow.countExecutions();
      expect(c2).toBe(1);
    });

    it('toggle off then on', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const c1 = await workflow.countExecutions();
      expect(c1).toBe(1);

      await workflow.update({
        enabled: false,
      });
      expect(workflow.current).toBe(true);

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const c2 = await workflow.countExecutions();
      expect(c2).toBe(1);

      await workflow.update({
        enabled: true,
      });
      expect(workflow.current).toBe(true);

      const p3 = await PostRepo.create({ values: { title: 't3' } });

      await sleep(500);

      const c3 = await workflow.countExecutions();
      expect(c3).toBe(2);
    });

    it('update config', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const c1 = await workflow.countExecutions();
      expect(c1).toBe(1);

      await workflow.update({
        config: {
          mode: 1,
          collection: 'tags',
        },
      });

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const c2 = await workflow.countExecutions();
      expect(c2).toBe(1);
    });
  });

  describe('destroy', () => {
    it('destroyed workflow will not be trigger any more', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'update',
        config: {
          collection: 'posts',
          params: {
            filter: {
              id: '{{$context.data.id}}',
            },
            values: {
              title: 't2',
            },
          },
        },
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const { model: JobModel } = db.getCollection('jobs');

      const e1c = await workflow.countExecutions();
      expect(e1c).toBe(1);
      const j1c = await JobModel.count();
      expect(j1c).toBe(1);
      const p1 = await PostRepo.findOne();
      expect(p1.title).toBe('t2');

      await workflow.destroy();

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const p2c = await PostRepo.count({ filter: { title: 't1' } });
      expect(p2c).toBe(1);
    });
  });

  describe('dispatcher', () => {
    it.skipIf(process.env['DB_DIALECT'] === 'sqlite')(
      'should acquire pending execution only once under concurrent dispatch',
      async () => {
        const w1 = await WorkflowModel.create({
          enabled: true,
          type: 'asyncTrigger',
        });

        const e1 = await w1.createExecution({
          key: w1.key,
          context: {},
          dispatched: false,
          status: EXECUTION_STATUS.QUEUEING,
        });
        const sameExecution = (await db.getRepository('executions').findOne({
          filterByTk: e1.id,
        })) as ExecutionModel;

        type PendingDispatcher = {
          acquirePendingExecution(execution: ExecutionModel): Promise<ExecutionModel | null>;
        };
        const dispatcher = (plugin as unknown as { dispatcher: PendingDispatcher }).dispatcher;

        const acquired = await Promise.all([
          dispatcher.acquirePendingExecution(e1),
          dispatcher.acquirePendingExecution(sameExecution),
        ]);

        const acquiredExecutions = acquired.filter((execution): execution is ExecutionModel => Boolean(execution));
        expect(acquiredExecutions.map((execution) => execution.id)).toEqual([e1.id]);

        await e1.reload();
        expect(e1.dispatched).toBe(true);
        expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
      },
    );

    it('should not acquire pending execution when acquire transaction fails', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const e1 = await w1.createExecution({
        key: w1.key,
        context: {},
        dispatched: false,
        status: EXECUTION_STATUS.QUEUEING,
      });

      type PendingDispatcher = {
        acquirePendingExecution(execution: ExecutionModel): Promise<ExecutionModel | null>;
      };
      const dispatcher = (plugin as unknown as { dispatcher: PendingDispatcher }).dispatcher;
      const transaction = db.sequelize.transaction;
      db.sequelize.transaction = (async () => {
        throw new Error('simulated transaction failure');
      }) as typeof db.sequelize.transaction;

      try {
        const acquired = await dispatcher.acquirePendingExecution(e1);
        expect(acquired).toBeNull();
      } finally {
        db.sequelize.transaction = transaction;
      }

      await e1.reload();
      expect(e1.dispatched).toBe(false);
      expect(e1.status).toBe(EXECUTION_STATUS.QUEUEING);
    });

    it('should notify trigger failure callback when async execution creation fails', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      const error = new Error('duplicate execution id');
      const createExecution = vi.spyOn(workflow, 'createExecution').mockRejectedValueOnce(error);
      const onTriggerFail = vi.fn(async () => {
        await sleep(10);
      });

      plugin.trigger(workflow, { data: true }, { eventKey: 'failed-event', onTriggerFail });

      for (let i = 0; i < 20; i++) {
        if (onTriggerFail.mock.calls.length) {
          break;
        }
        await sleep(50);
      }

      expect(createExecution).toHaveBeenCalledTimes(1);
      expect(onTriggerFail).toHaveBeenCalledTimes(1);
      expect(onTriggerFail.mock.calls[0]).toEqual([
        workflow,
        { data: true },
        { eventKey: 'failed-event', onTriggerFail },
        error,
      ]);
    });

    it('should notify trigger failure callback when async event context is null', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      const onTriggerFail = vi.fn(async () => {
        await sleep(10);
      });

      await plugin.trigger(workflow, null as unknown as object, { eventKey: 'invalid-context-event', onTriggerFail });

      expect(onTriggerFail).toHaveBeenCalledTimes(1);
      expect(onTriggerFail.mock.calls[0][0]).toBe(workflow);
      expect(onTriggerFail.mock.calls[0][1]).toBeNull();
      expect(onTriggerFail.mock.calls[0][2]).toEqual({ eventKey: 'invalid-context-event', onTriggerFail });
      expect(onTriggerFail.mock.calls[0][3]).toBeInstanceOf(Error);
    });

    it('should treat postgres deadlock as concurrent acquire error', () => {
      type ConcurrentAcquireDispatcher = {
        isConcurrentAcquireError(error: unknown): boolean;
      };
      const dispatcher = (plugin as unknown as { dispatcher: ConcurrentAcquireDispatcher }).dispatcher;
      const error = Object.assign(new Error('deadlock detected'), { parent: { code: '40P01' } });

      expect(dispatcher.isConcurrentAcquireError(error)).toBe(true);
    });

    it.skipIf(process.env['DB_DIALECT'] === 'sqlite')(
      'should acquire queueing execution only once under concurrent dispatch',
      async () => {
        const w1 = await WorkflowModel.create({
          enabled: true,
          type: 'asyncTrigger',
        });

        const e1 = await w1.createExecution({
          key: w1.key,
          context: {},
          dispatched: false,
          status: EXECUTION_STATUS.QUEUEING,
        });

        type QueueingDispatcher = {
          acquireQueueingExecution(): Promise<ExecutionModel | null>;
        };
        const dispatcher = (plugin as unknown as { dispatcher: QueueingDispatcher }).dispatcher;

        const acquired = await Promise.all([
          dispatcher.acquireQueueingExecution(),
          dispatcher.acquireQueueingExecution(),
        ]);

        const acquiredExecutions = acquired.filter((execution): execution is ExecutionModel => Boolean(execution));
        expect(acquiredExecutions.map((execution) => execution.id)).toEqual([e1.id]);

        await e1.reload();
        expect(e1.dispatched).toBe(true);
        expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
      },
    );

    it('multiple triggers in same event', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const w3 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [e1] = await w1.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);

      const [e2] = await w2.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);

      const [e3] = await w3.getExecutions();
      expect(e3.status).toBe(EXECUTION_STATUS.RESOLVED);
    });

    it('multiple events on same workflow', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });
      const p2 = await PostRepo.create({ values: { title: 't2' } });
      const p3 = await PostRepo.create({ values: { title: 't3' } });

      await sleep(500);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(3);
      expect(executions.map((item) => item.status)).toEqual(Array(3).fill(EXECUTION_STATUS.RESOLVED));
    });

    it('duplicated event trigger', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await w1.createNode({
        type: 'asyncResume',
      });

      plugin.trigger(w1, {}, { eventKey: 'a' });
      plugin.trigger(w1, {}, { eventKey: 'a' });

      await sleep(1000);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(1);
      const jobs = await executions[0].getJobs();
      expect(jobs.length).toBe(1);
    });

    it('when server starts, process all created executions', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      await app.stop();

      await db.reconnect();

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      const ExecutionModel = db.getCollection('executions').model;
      const e1 = await w1.createExecution({
        key: w1.key,
        context: {
          data: p1.get(),
        },
      });

      const e1s = await w1.getExecutions();
      expect(e1s.length).toBe(1);

      await app.start();

      await sleep(500);

      const w1_1 = plugin.enabledCache.get(w1.id);
      expect(w1_1.stats).toBeDefined();
      expect(w1_1.stats.executed).toBe(0);

      await e1.reload();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);

      await w1.update({ enabled: false });

      await app.stop();

      await db.reconnect();

      const e2 = await w1.createExecution({
        key: w1.key,
        context: {
          data: p1.get(),
        },
        createdAt: p1.createdAt,
      });

      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const e3 = await w2.createExecution({
        key: w2.key,
        context: {
          data: p1.get(),
        },
      });

      await app.start();

      await sleep(500);

      await e2.reload();
      expect(e2.status).toBe(EXECUTION_STATUS.QUEUEING);
      expect(e2.dispatched).toBe(false);

      // queueing execution of disabled workflow should not effect other executions
      await e3.reload();
      expect(e3.status).toBe(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('options.deleteExecutionOnStatus', () => {
    it('no configured should not be deleted', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(1);
    });

    it('status on started should not be deleted', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        options: {
          deleteExecutionOnStatus: [EXECUTION_STATUS.STARTED],
        },
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      await w1.createNode({
        type: 'pending',
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].status).toBe(EXECUTION_STATUS.STARTED);
    });

    it('configured resolved status should be deleted', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        options: {
          deleteExecutionOnStatus: [EXECUTION_STATUS.RESOLVED],
        },
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(0);
    });

    it('configured error status should be deleted', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        options: {
          deleteExecutionOnStatus: [EXECUTION_STATUS.ERROR],
        },
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      await w1.createNode({
        type: 'error',
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(0);
    });
  });

  describe('deffered', () => {
    it('deffered will not be process immediately, and can be start', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      plugin.trigger(w1, {}, { deferred: true });

      await sleep(500);

      const e1s = await w1.getExecutions();
      expect(e1s.length).toBe(1);
      expect(e1s[0].dispatched).toBe(true);
      expect(e1s[0].status).toBe(EXECUTION_STATUS.STARTED);

      plugin.start(e1s[0]);

      await sleep(500);

      const e2s = await w1.getExecutions();
      expect(e2s.length).toBe(1);
      expect(e2s[0].status).toBe(EXECUTION_STATUS.RESOLVED);
    });

    it('sync workflow will ignore the deferred option, and start it immediately', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'syncTrigger',
      });

      const processor = await plugin.trigger(w1, {}, { deferred: true });

      const e1s = await w1.getExecutions();
      expect(e1s.length).toBe(1);
      expect(e1s[0].status).toBe(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('sync trigger', () => {
    it('sync on trigger class', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'syncTrigger',
      });

      const processor = (await plugin.trigger(w1, {})) as Processor;

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(processor.execution.id).toBe(executions[0].id);
      expect(processor.execution.status).toBe(executions[0].status);
    });

    it('sync on workflow instance', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
        sync: true,
      });

      const processor = (await plugin.trigger(w1, {})) as Processor;

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(processor.execution.id).toBe(executions[0].id);
      expect(processor.execution.status).toBe(executions[0].status);
    });
  });

  describe('stats', () => {
    it('stats record should be created after start', async () => {
      const app1 = await getApp({
        skipStart: true,
        name: 'abc',
      });

      const WModel = app1.db.getCollection('workflows').model;

      const w1 = await WModel.create(
        {
          id: 10000,
          enabled: true,
          type: 'syncTrigger',
          key: 'abc',
          current: true,
        },
        {
          // Can't generate id automatically when disabling hooks
          hooks: false,
        },
      );

      const s1 = await w1.getStats();
      const vs1 = await w1.getVersionStats();
      expect(s1).toBeNull();
      expect(vs1).toBeNull();

      await app1.start();

      const s2 = await w1.getStats();
      const vs2 = await w1.getVersionStats();
      expect(s2.executed).toBe(0);
      expect(vs2.executed).toBe(0);
    });

    it.skipIf(process.env.DB_DIALECT === 'sqlite')('bigint stats', async () => {
      const WorkflowRepo = app.db.getRepository('workflows');

      const w1 = await WorkflowRepo.create({
        values: {
          id: 10001,
          enabled: true,
          type: 'syncTrigger',
          key: 'abc',
          current: true,
        },
        hooks: false,
      });
      await w1.createStats({ executed: '10000000000000001' });
      await w1.createVersionStats({ executed: '10000000000000001' });

      const s1 = await w1.getStats();
      const vs1 = await w1.getVersionStats();
      expect(s1.executed).toBe('10000000000000001');
      expect(vs1.executed).toBe('10000000000000001');
    });
  });
});
