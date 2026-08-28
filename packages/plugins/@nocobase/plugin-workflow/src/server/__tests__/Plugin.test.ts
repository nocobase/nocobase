/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs/promises';

import { MockServer } from '@nocobase/test';
import Database, { Transaction } from '@nocobase/database';
import { storagePathJoin } from '@nocobase/utils';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { vi } from 'vitest';

import Plugin, { Processor } from '..';
import { EXECUTION_STATUS, JOB_STATUS } from '../constants';
import type { ExecutionModel, JobModel } from '../types';

describe('workflow > Plugin', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let plugin: Plugin;

  const removeEventQueueStorage = async (appName = 'main') => {
    await fs.rm(storagePathJoin('apps', appName, 'event-queue.json'), { force: true });
  };

  beforeEach(async () => {
    await removeEventQueueStorage();
    app = await getApp();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    plugin = app.pm.get(Plugin) as Plugin;
  });

  afterEach(async () => {
    if (!app) {
      await removeEventQueueStorage();
      return;
    }

    const appName = app.name;
    await app.destroy();
    await removeEventQueueStorage(appName);
  });

  describe('useDataSourceTransaction', () => {
    it('create should reuse the incoming same-datasource transaction', async () => {
      const sourceTransaction = await db.sequelize.transaction();
      try {
        const transaction = await plugin.useDataSourceTransaction('main', sourceTransaction, true);

        expect(transaction).toBe(sourceTransaction);
      } finally {
        await sourceTransaction.rollback();
      }
    });

    it.skipIf(process.env['DB_DIALECT'] === 'sqlite')(
      'create with null transaction should open a transaction isolated from the incoming same-datasource transaction',
      async () => {
        const sourceTransaction = await db.sequelize.transaction();
        let historyTransaction: Transaction | undefined;
        try {
          historyTransaction = await plugin.useDataSourceTransaction('main', null, true);

          expect(historyTransaction).toBeDefined();
          expect(historyTransaction).not.toBe(sourceTransaction);
        } finally {
          if (historyTransaction) {
            await historyTransaction.rollback();
          }
          await sourceTransaction.rollback();
        }
      },
    );
  });

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
    type DispatcherState = {
      saving: Promise<unknown> | null;
      executing: Promise<unknown> | null;
    };

    type PersistedWorkflowQueueTask = {
      executionId: number | string;
      jobId?: number | string;
      rerun?: {
        nodeId?: number | string;
        overwrite?: boolean;
      };
    };

    type PersistedQueueMessage = {
      id: string;
      content: PersistedWorkflowQueueTask;
      options?: unknown;
    };

    const getDispatcher = () => (plugin as unknown as { dispatcher: DispatcherState }).dispatcher;

    const waitFor = async <T>(load: () => Promise<T>, matched: (value: T) => boolean): Promise<T> => {
      let value = await load();
      for (let i = 0; i < 40; i++) {
        if (matched(value)) {
          return value;
        }
        await sleep(100);
        value = await load();
      }
      return value;
    };

    const drainDispatcher = async () => {
      const dispatcher = getDispatcher();
      await dispatcher.saving?.catch(() => null);
      await dispatcher.executing?.catch(() => null);
    };

    const closeQueueAndReadPersistedTasks = async (): Promise<PersistedQueueMessage[]> => {
      await app.eventQueue.close();
      const raw = await fs.readFile(storagePathJoin('apps', app.name, 'event-queue.json'), 'utf8');
      const queues = JSON.parse(raw) as Record<string, PersistedQueueMessage[]>;
      return queues[app.eventQueue.getFullChannel(plugin.channelPendingExecution)] ?? [];
    };

    it('should preserve resume save errors for awaiting callers', async () => {
      const error = new Error('simulated save failure');
      const job = {
        id: 'job-1',
        executionId: 'execution-1',
        changed: () => true,
        save: vi.fn().mockRejectedValue(error),
      } as unknown as JobModel;

      await expect(plugin.resume(job)).rejects.toBe(error);
    });

    it('should preserve resume publish errors for awaiting callers', async () => {
      type EnqueueDispatcher = DispatcherState & {
        enqueue(task: { executionId: number | string; jobId: number | string }): Promise<void>;
      };
      const dispatcher = (plugin as unknown as { dispatcher: EnqueueDispatcher }).dispatcher;
      const error = new Error('simulated publish failure');
      const enqueue = vi.spyOn(dispatcher, 'enqueue').mockRejectedValueOnce(error);
      const job = {
        id: 'job-1',
        executionId: 'execution-1',
        changed: () => false,
      } as unknown as JobModel;

      await expect(plugin.resume(job)).rejects.toBe(error);
      expect(enqueue).toHaveBeenCalledWith({ executionId: job.executionId, jobId: job.id });
    });

    it('should serialize queue callbacks delivered concurrently by an adapter', async () => {
      type SerialDispatcher = DispatcherState & {
        onQueueTask(event: { executionId: string }, options?: unknown): Promise<void>;
        resolveTask(task: { executionId: string }): Promise<null>;
      };
      const dispatcher = (plugin as unknown as { dispatcher: SerialDispatcher }).dispatcher;
      const calls: string[] = [];
      let notifyFirstEntered!: () => void;
      let releaseFirst!: () => void;
      const firstEntered = new Promise<void>((resolve) => {
        notifyFirstEntered = resolve;
      });
      const firstBlocked = new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      const resolveTask = vi.spyOn(dispatcher, 'resolveTask').mockImplementation(async (task) => {
        calls.push(`start:${task.executionId}`);
        if (task.executionId === 'first') {
          notifyFirstEntered();
          await firstBlocked;
        }
        calls.push(`end:${task.executionId}`);
        return null;
      });

      const first = dispatcher.onQueueTask({ executionId: 'first' });
      await firstEntered;
      const second = dispatcher.onQueueTask({ executionId: 'second' });
      await new Promise((resolve) => setImmediate(resolve));
      expect(calls).toEqual(['start:first']);

      releaseFirst();
      await Promise.all([first, second]);
      expect(calls).toEqual(['start:first', 'end:first', 'start:second', 'end:second']);
      expect(dispatcher.executing).toBeNull();
      resolveTask.mockRestore();
    });

    it.skipIf(process.env['DB_DIALECT'] === 'sqlite')(
      'should acquire queueing execution only once under concurrent prepare',
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

        type QueueingDispatcher = {
          prepare(input: ExecutionModel, options?: { immediate?: boolean }): Promise<ExecutionModel | null>;
        };
        const dispatcher = (plugin as unknown as { dispatcher: QueueingDispatcher }).dispatcher;

        const acquired = await Promise.all([
          dispatcher.prepare(e1, { immediate: true }),
          dispatcher.prepare(sameExecution, { immediate: true }),
        ]);

        const acquiredExecutions = acquired.filter((execution): execution is ExecutionModel => Boolean(execution));
        expect(acquiredExecutions.map((execution) => execution.id)).toEqual([e1.id]);

        await e1.reload();
        expect(e1.dispatched).toBe(true);
        expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
      },
    );

    it('should not acquire queueing execution when acquire transaction fails', async () => {
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
        prepare(input: ExecutionModel, options?: { immediate?: boolean }): Promise<ExecutionModel | null>;
      };
      const dispatcher = (plugin as unknown as { dispatcher: QueueingDispatcher }).dispatcher;
      const transaction = db.sequelize.transaction;
      db.sequelize.transaction = (async () => {
        throw new Error('simulated transaction failure');
      }) as typeof db.sequelize.transaction;

      try {
        const acquired = await dispatcher.prepare(e1, { immediate: true });
        expect(acquired).toBeNull();
      } finally {
        db.sequelize.transaction = transaction;
      }

      await e1.reload();
      expect(e1.dispatched).toBe(false);
      expect(e1.status).toBe(EXECUTION_STATUS.QUEUEING);
    });

    it('should notify trigger failure callback when async execution creation fails', async () => {
      type SavingDispatcher = {
        saving: Promise<unknown> | null;
      };
      const dispatcher = (plugin as unknown as { dispatcher: SavingDispatcher }).dispatcher;
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

      await dispatcher.saving?.catch(() => null);

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

    it('should recover after unexpected recovery error before cleanup', async () => {
      type RecoveringDispatcher = {
        recover(): Promise<void>;
        executing: Promise<unknown> | null;
        saving: Promise<unknown> | null;
        idle: boolean;
      };
      const dispatcher = (plugin as unknown as { dispatcher: RecoveringDispatcher }).dispatcher;
      const serving = plugin.serving;

      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      await w1.createNode({
        type: 'echo',
      });
      await w1.createExecution({
        key: w1.key,
        context: { first: true },
        dispatched: false,
        status: EXECUTION_STATUS.QUEUEING,
      });

      plugin.serving = (() => {
        const stack = new Error().stack;
        if (stack?.includes('Dispatcher.ts')) {
          throw new Error('simulated serving check failure');
        }
        return serving.call(plugin);
      }) as typeof plugin.serving;

      try {
        await dispatcher.recover();
        await dispatcher.saving?.catch(() => null);
        await dispatcher.executing?.catch(() => null);

        for (let i = 0; i < 20; i++) {
          if (!dispatcher.executing && !dispatcher.saving) {
            break;
          }
          await sleep(50);
        }
        await dispatcher.saving?.catch(() => null);

        expect(dispatcher.executing).toBeNull();
        expect(dispatcher.saving).toBeNull();
        expect(dispatcher.idle).toBe(true);

        plugin.serving = serving;

        const w2 = await WorkflowModel.create({
          enabled: true,
          type: 'asyncTrigger',
        });
        await w2.createNode({
          type: 'echo',
        });

        plugin.trigger(w2, { second: true });

        let e2: ExecutionModel | null = null;
        for (let i = 0; i < 20; i++) {
          [e2] = await w2.getExecutions();
          if (e2?.status === EXECUTION_STATUS.RESOLVED) {
            break;
          }
          await sleep(50);
        }

        expect(e2?.status).toBe(EXECUTION_STATUS.RESOLVED);
        expect(e2?.dispatched).toBe(true);
      } finally {
        plugin.serving = serving;
        await dispatcher.saving?.catch(() => null);
        await dispatcher.executing?.catch(() => null);
        dispatcher.saving = null;
        dispatcher.executing = null;
      }
    });

    it('should stop retrying queued task after repeated unexpected queue errors', async () => {
      type RecoveringDispatcher = {
        enqueue(task: { executionId: number | string; jobId?: number | string; rerun?: unknown }): Promise<void>;
        prepare(input: ExecutionModel, options?: { immediate?: boolean }): Promise<ExecutionModel | null>;
        executing: Promise<unknown> | null;
        saving: Promise<unknown> | null;
      };
      const dispatcher = (plugin as unknown as { dispatcher: RecoveringDispatcher }).dispatcher;
      const prepare = dispatcher.prepare;
      let prepareCalls = 0;

      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      await w1.createNode({
        type: 'echo',
      });
      const e1 = await w1.createExecution({
        key: w1.key,
        context: { first: true },
        dispatched: false,
        status: EXECUTION_STATUS.QUEUEING,
      });

      dispatcher.prepare = (async () => {
        prepareCalls += 1;
        throw new Error('simulated prepare failure');
      }) as typeof dispatcher.prepare;

      try {
        await dispatcher.enqueue({ executionId: e1.id });

        for (let i = 0; i < 40; i++) {
          if (prepareCalls >= 3 && !dispatcher.executing) {
            break;
          }
          await sleep(100);
        }

        const callsAfterDrain = prepareCalls;
        await sleep(100);

        expect(callsAfterDrain).toBe(3);
        expect(prepareCalls).toBe(callsAfterDrain);
        expect(dispatcher.executing).toBeNull();

        dispatcher.prepare = prepare;

        const w2 = await WorkflowModel.create({
          enabled: true,
          type: 'asyncTrigger',
        });
        await w2.createNode({
          type: 'echo',
        });

        plugin.trigger(w2, { second: true });

        let e2: ExecutionModel | null = null;
        for (let i = 0; i < 20; i++) {
          [e2] = await w2.getExecutions();
          if (e2?.status === EXECUTION_STATUS.RESOLVED) {
            break;
          }
          await sleep(50);
        }

        expect(e2?.status).toBe(EXECUTION_STATUS.RESOLVED);
      } finally {
        dispatcher.prepare = prepare;
        await dispatcher.saving?.catch(() => null);
        await dispatcher.executing?.catch(() => null);
        dispatcher.saving = null;
        dispatcher.executing = null;
      }
    });

    it('should ignore duplicate start task for already started execution', async () => {
      type QueueingDispatcher = {
        enqueue(task: { executionId: number | string }): Promise<void>;
        executing: Promise<unknown> | null;
      };
      const dispatcher = (plugin as unknown as { dispatcher: QueueingDispatcher }).dispatcher;

      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      await w1.createNode({
        type: 'echo',
      });
      const e1 = await w1.createExecution({
        key: w1.key,
        context: {},
        dispatched: true,
        status: EXECUTION_STATUS.STARTED,
        startedAt: new Date(),
      });

      await dispatcher.enqueue({ executionId: e1.id });
      await sleep(500);

      for (let i = 0; i < 20; i++) {
        if (!dispatcher.executing) {
          break;
        }
        await sleep(50);
      }
      await dispatcher.executing?.catch(() => null);

      const jobs = await e1.getJobs();
      await e1.reload();
      expect(jobs).toHaveLength(0);
      expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
    });

    it('should persist queued start task outside dispatcher memory and process after queue reconnects', async () => {
      const serving = plugin.serving;
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      await w1.createNode({
        type: 'echo',
      });

      plugin.serving = (() => false) as typeof plugin.serving;

      try {
        plugin.trigger(w1, { queued: true });
        await drainDispatcher();

        const [e1] = await waitFor(
          () => w1.getExecutions({ order: [['id', 'ASC']] }) as Promise<ExecutionModel[]>,
          (executions) => executions.length === 1,
        );

        await sleep(500);
        await e1.reload();
        expect(e1.dispatched).toBe(false);
        expect(e1.status).toBe(EXECUTION_STATUS.QUEUEING);
        expect(await e1.getJobs()).toHaveLength(0);

        const queuedTasks = await closeQueueAndReadPersistedTasks();
        expect(queuedTasks).toEqual([
          expect.objectContaining({
            content: {
              executionId: e1.id,
            },
          }),
        ]);

        plugin.serving = serving;
        await app.eventQueue.connect();

        const [processed] = await waitFor(
          async () => {
            await e1.reload();
            return [e1] as ExecutionModel[];
          },
          ([execution]) => execution.status === EXECUTION_STATUS.RESOLVED,
        );
        expect(processed.dispatched).toBe(true);
        expect(processed.status).toBe(EXECUTION_STATUS.RESOLVED);
      } finally {
        plugin.serving = serving;
        if (!app.eventQueue.isConnected()) {
          await app.eventQueue.connect();
        }
        await drainDispatcher();
      }
    });

    it('should persist queued resume task outside dispatcher memory and process after queue reconnects', async () => {
      const serving = plugin.serving;
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      const n1 = await w1.createNode({
        type: 'pending',
      });
      const n2 = await w1.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      plugin.trigger(w1, {});

      const [e1] = await waitFor(
        () => w1.getExecutions({ order: [['id', 'ASC']] }) as Promise<ExecutionModel[]>,
        ([execution]) => execution?.status === EXECUTION_STATUS.STARTED,
      );
      const [pendingJob] = await waitFor(
        () => e1.getJobs({ where: { nodeId: n1.id } }),
        (jobs) => jobs.length === 1 && jobs[0].status === JOB_STATUS.PENDING,
      );

      plugin.serving = (() => false) as typeof plugin.serving;

      try {
        await pendingJob.update({
          status: JOB_STATUS.RESOLVED,
          result: {
            resumed: true,
          },
        });
        await plugin.resume(pendingJob);

        await sleep(500);
        await e1.reload();
        expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
        expect(await e1.getJobs({ where: { nodeId: n2.id } })).toHaveLength(0);

        const queuedTasks = await closeQueueAndReadPersistedTasks();
        expect(queuedTasks).toEqual([
          expect.objectContaining({
            content: {
              executionId: e1.id,
              jobId: pendingJob.id,
            },
          }),
        ]);

        plugin.serving = serving;
        await app.eventQueue.connect();

        const [processed] = await waitFor(
          async () => {
            await e1.reload();
            return [e1] as ExecutionModel[];
          },
          ([execution]) => execution.status === EXECUTION_STATUS.RESOLVED,
        );
        expect(processed.status).toBe(EXECUTION_STATUS.RESOLVED);
        expect(await e1.getJobs({ where: { nodeId: n2.id } })).toHaveLength(1);
      } finally {
        plugin.serving = serving;
        if (!app.eventQueue.isConnected()) {
          await app.eventQueue.connect();
        }
        await drainDispatcher();
      }
    });

    it('should persist queued rerun task outside dispatcher memory and process after queue reconnects', async () => {
      const serving = plugin.serving;
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      const n1 = await w1.createNode({
        type: 'echo',
      });
      const n2 = await w1.createNode({
        type: 'pending',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      plugin.trigger(w1, {});

      const [e1] = await waitFor(
        () => w1.getExecutions({ order: [['id', 'ASC']] }) as Promise<ExecutionModel[]>,
        ([execution]) => execution?.status === EXECUTION_STATUS.STARTED,
      );
      await waitFor(
        () => e1.getJobs({ order: [['id', 'ASC']] }),
        (jobs) =>
          jobs.filter((job) => job.nodeId === n1.id).length === 1 &&
          jobs.filter((job) => job.nodeId === n2.id).length === 1,
      );

      plugin.serving = (() => false) as typeof plugin.serving;

      try {
        await plugin.rerun(e1, { nodeId: n1.id });

        await sleep(500);
        const jobsBeforeReconnect = await e1.getJobs({ order: [['id', 'ASC']] });
        expect(jobsBeforeReconnect.filter((job) => job.nodeId === n1.id)).toHaveLength(1);
        expect(jobsBeforeReconnect.filter((job) => job.nodeId === n2.id)).toHaveLength(1);

        const queuedTasks = await closeQueueAndReadPersistedTasks();
        expect(queuedTasks).toEqual([
          expect.objectContaining({
            content: {
              executionId: e1.id,
              rerun: {
                nodeId: n1.id,
              },
            },
          }),
        ]);

        plugin.serving = serving;
        await app.eventQueue.connect();

        const jobsAfterReconnect = await waitFor(
          () => e1.getJobs({ order: [['id', 'ASC']] }),
          (jobs) =>
            jobs.filter((job) => job.nodeId === n1.id).length === 2 &&
            jobs.filter((job) => job.nodeId === n2.id).length === 2,
        );
        expect(jobsAfterReconnect.filter((job) => job.nodeId === n1.id)).toHaveLength(2);
        expect(jobsAfterReconnect.filter((job) => job.nodeId === n2.id)).toHaveLength(2);
      } finally {
        plugin.serving = serving;
        if (!app.eventQueue.isConnected()) {
          await app.eventQueue.connect();
        }
        await drainDispatcher();
      }
    });

    it('should treat postgres deadlock as concurrent acquire error', () => {
      type ConcurrentAcquireDispatcher = {
        isConcurrentAcquireError(error: unknown): boolean;
      };
      const dispatcher = (plugin as unknown as { dispatcher: ConcurrentAcquireDispatcher }).dispatcher;
      const error = Object.assign(new Error('deadlock detected'), { parent: { code: '40P01' } });

      expect(dispatcher.isConcurrentAcquireError(error)).toBe(true);
    });

    it('should skip non-queueing undispatched executions when fetching from db', async () => {
      type DbFetchDispatcher = {
        recover(): Promise<void>;
        executing: Promise<unknown> | null;
      };
      const dispatcher = (plugin as unknown as { dispatcher: DbFetchDispatcher }).dispatcher;

      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      await w1.createNode({
        type: 'echo',
      });
      const aborted = await w1.createExecution({
        key: w1.key,
        context: { aborted: true },
        dispatched: false,
        status: EXECUTION_STATUS.ABORTED,
      });

      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      await w2.createNode({
        type: 'echo',
      });
      const queueing = await w2.createExecution({
        key: w2.key,
        context: { queueing: true },
        dispatched: false,
        status: EXECUTION_STATUS.QUEUEING,
      });

      await dispatcher.recover();

      for (let i = 0; i < 20; i++) {
        await queueing.reload();
        if (queueing.status === EXECUTION_STATUS.RESOLVED) {
          break;
        }
        await sleep(50);
      }

      await aborted.reload();
      expect(aborted.status).toBe(EXECUTION_STATUS.ABORTED);
      expect(aborted.dispatched).toBe(false);
      expect(queueing.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(queueing.dispatched).toBe(true);

      await dispatcher.executing?.catch(() => null);
    });

    it('should publish all queueing executions during one recovery', async () => {
      const dispatcher = (plugin as unknown as { dispatcher: { recover(): Promise<void> } }).dispatcher;
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      await workflow.createNode({ type: 'echo' });
      const executions = await Promise.all(
        Array.from({ length: 3 }, (_, index) =>
          workflow.createExecution({
            key: workflow.key,
            context: { index },
            dispatched: false,
            status: EXECUTION_STATUS.QUEUEING,
          }),
        ),
      );

      await Promise.all([dispatcher.recover(), dispatcher.recover()]);

      const processed = await waitFor(
        async () => {
          await Promise.all(executions.map((execution) => execution.reload()));
          return executions;
        },
        (items) => items.every((execution) => execution.status === EXECUTION_STATUS.RESOLVED),
      );
      expect(processed.map((execution) => execution.status)).toEqual(Array(3).fill(EXECUTION_STATUS.RESOLVED));
      for (const execution of executions) {
        expect(await execution.getJobs()).toHaveLength(1);
      }
    });

    it('should skip recently created queueing executions during periodic recovery', async () => {
      type RecoveringDispatcher = {
        recover(options?: { gracePeriod?: number }): Promise<void>;
      };
      const dispatcher = (plugin as unknown as { dispatcher: RecoveringDispatcher }).dispatcher;
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      await workflow.createNode({ type: 'echo' });
      const oldExecution = await workflow.createExecution({
        key: workflow.key,
        context: { old: true },
        dispatched: false,
        status: EXECUTION_STATUS.QUEUEING,
      });
      await sleep(1200);
      const recentExecution = await workflow.createExecution({
        key: workflow.key,
        context: { recent: true },
        dispatched: false,
        status: EXECUTION_STATUS.QUEUEING,
      });

      await dispatcher.recover({ gracePeriod: 1000 });

      await waitFor(
        async () => {
          await oldExecution.reload();
          return [oldExecution] as ExecutionModel[];
        },
        ([execution]) => execution.status === EXECUTION_STATUS.RESOLVED,
      );
      await recentExecution.reload();
      expect(oldExecution.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(recentExecution.status).toBe(EXECUTION_STATUS.QUEUEING);
      expect(recentExecution.dispatched).toBe(false);
    });

    it('should skip recovery when another instance holds the recovery lock', async () => {
      const dispatcher = (plugin as unknown as { dispatcher: { recover(): Promise<void> } }).dispatcher;
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      await workflow.createNode({ type: 'echo' });
      const execution = await workflow.createExecution({
        key: workflow.key,
        context: {},
        dispatched: false,
        status: EXECUTION_STATUS.QUEUEING,
      });
      const lock = await app.lockManager.tryAcquire(`workflow:recover:${app.name}`);

      try {
        await dispatcher.recover();
        await execution.reload();
        expect(execution.status).toBe(EXECUTION_STATUS.QUEUEING);
        expect(execution.dispatched).toBe(false);
      } finally {
        await lock.release();
      }

      await dispatcher.recover();
      await waitFor(
        async () => {
          await execution.reload();
          return [execution] as ExecutionModel[];
        },
        ([item]) => item.status === EXECUTION_STATUS.RESOLVED,
      );
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
    });

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

      await PostRepo.create({ values: { title: 't1' } });

      const executions = await waitFor(
        async () => {
          const [e1] = await w1.getExecutions();
          const [e2] = await w2.getExecutions();
          const [e3] = await w3.getExecutions();
          return [e1, e2, e3] as ExecutionModel[];
        },
        (executions) => executions.every((execution) => execution?.status === EXECUTION_STATUS.RESOLVED),
      );
      expect(executions.map((execution) => execution?.status)).toEqual(Array(3).fill(EXECUTION_STATUS.RESOLVED));
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

    it('beforeStop should wait for all pending and executing tasks', async () => {
      // trigger multiple events and await their initiation to ensure DB operations are not cut off,
      // but dispatcher will still process them asynchronously in local queues.
      const count = 1000;

      const PostModel = db.getCollection('posts').model;
      const posts = await PostModel.bulkCreate(
        Array(count)
          .fill(0)
          .map((_, index) => ({
            title: `t${index}`,
          })),
        {
          returning: true,
        },
      );

      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      for (const post of posts) {
        await db.emitAsync('posts.afterCreateWithAssociations', post, {});
      }
      // stop the app immediately.
      // dispatcher.beforeStop() should now wait for all events to be prepared and all pending executions to be processed.
      await app.emitAsync('beforeStop', app);

      const executions = await w1.getExecutions({ attributes: ['id', 'status'] });
      expect(executions.length).toBe(count);
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

      await plugin.start(e1s[0]);

      await sleep(500);

      const e2s = await w1.getExecutions();
      expect(e2s.length).toBe(1);
      expect(e2s[0].status).toBe(EXECUTION_STATUS.RESOLVED);
    });

    it('timeout should start counting after deferred execution starts', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
        options: {
          timeout: 1000,
        },
      });

      plugin.trigger(w1, {}, { deferred: true });

      await sleep(500);

      const [e1] = await w1.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
      expect(e1.startedAt).toBeNull();
      expect(e1.expiresAt).toBeNull();

      await plugin.start(e1);
      await sleep(500);

      const [e2] = await w1.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e2.startedAt).toBeTruthy();
      expect(e2.expiresAt).toBeTruthy();
      expect(e2.expiresAt.getTime()).toBeGreaterThan(e2.startedAt.getTime());
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

    it.skipIf(process.env['DB_DIALECT'] === 'sqlite')(
      'history should persist after the source transaction rolls back',
      async () => {
        const w1 = await WorkflowModel.create({
          enabled: true,
          type: 'syncTrigger',
        });

        await w1.createNode({
          type: 'echo',
        });

        const transaction = await db.sequelize.transaction();
        try {
          await plugin.trigger(w1, {}, { transaction });
          await transaction.rollback();
        } catch (error) {
          await transaction.rollback();
          throw error;
        }

        const executions = await w1.getExecutions();
        expect(executions.length).toBe(1);
        expect(executions[0].status).toBe(EXECUTION_STATUS.RESOLVED);

        const jobs = await executions[0].getJobs();
        expect(jobs.length).toBe(1);

        const stats = await w1.getStats();
        expect(Number(stats.executed)).toBe(1);
      },
    );
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
