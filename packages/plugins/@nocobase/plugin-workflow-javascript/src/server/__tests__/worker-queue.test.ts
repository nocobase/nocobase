/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import WorkflowPlugin, { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp } from '@nocobase/plugin-workflow-test';
import { Application } from '@nocobase/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SCRIPT_INSTRUCTION_TYPE } from '../../common/constants';
import Plugin from '..';
import { ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE, JAVASCRIPT_SYNC_MESSAGE_CHANNEL, RunningJobs } from '../RunningJobs';
import { TaskConsumer } from '../TaskConsumer';
import { TaskRecovery } from '../TaskRecovery';

describe('JavaScript task queue', () => {
  let app: Application;
  let db: Database;
  beforeEach(async () => {
    app = await getApp({ plugins: [Plugin] });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('only republishes recoverable unclaimed JavaScript jobs', async () => {
    const JobModel = db.getModel('jobs');
    const NodeModel = db.getModel('flow_nodes');
    const ExecutionModel = db.getModel('executions');
    const now = new Date();
    const stale = new Date(now.getTime() - 180_000);
    const expired = new Date(now.getTime() - 60_000);
    const future = new Date(now.getTime() + 60_000);

    await NodeModel.create({ id: '9301', type: 'delay' });
    await NodeModel.create({ id: '9302', type: SCRIPT_INSTRUCTION_TYPE });
    await NodeModel.create({ id: '9303', type: SCRIPT_INSTRUCTION_TYPE });
    await NodeModel.create({ id: '9304', type: SCRIPT_INSTRUCTION_TYPE });
    await NodeModel.create({ id: '9307', type: SCRIPT_INSTRUCTION_TYPE });
    await NodeModel.create({ id: '9308', type: SCRIPT_INSTRUCTION_TYPE });
    await NodeModel.create({ id: '9309', type: SCRIPT_INSTRUCTION_TYPE });

    await ExecutionModel.create({
      id: '9101',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: future,
    });
    await ExecutionModel.create({
      id: '9102',
      status: EXECUTION_STATUS.STARTED,
    });
    await ExecutionModel.create({
      id: '9103',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: future,
    });
    await ExecutionModel.create({
      id: '9104',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: future,
    });
    await ExecutionModel.create({
      id: '9107',
      status: EXECUTION_STATUS.RESOLVED,
    });
    await ExecutionModel.create({
      id: '9108',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: expired,
    });
    await ExecutionModel.create({
      id: '9109',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: future,
    });

    await JobModel.create({
      id: '9201',
      executionId: '9101',
      nodeId: '9301',
      status: JOB_STATUS.PENDING,
      startedAt: null,
      meta: { args: {} },
      createdAt: stale,
    });
    await JobModel.create({
      id: '9202',
      executionId: '9102',
      nodeId: '9302',
      status: JOB_STATUS.PENDING,
      startedAt: null,
      meta: { args: {} },
      createdAt: stale,
    });
    await JobModel.create({
      id: '9203',
      executionId: '9103',
      nodeId: '9303',
      status: JOB_STATUS.PENDING,
      startedAt: stale,
      meta: { args: {} },
      createdAt: stale,
    });
    await JobModel.create({
      id: '9204',
      executionId: '9104',
      nodeId: '9304',
      status: JOB_STATUS.PENDING,
      startedAt: now,
      meta: { args: {} },
      createdAt: stale,
    });
    await JobModel.create({
      id: '9207',
      executionId: '9107',
      nodeId: '9307',
      status: JOB_STATUS.PENDING,
      startedAt: null,
      meta: { args: {} },
      createdAt: stale,
    });
    await JobModel.create({
      id: '9208',
      executionId: '9108',
      nodeId: '9308',
      status: JOB_STATUS.PENDING,
      startedAt: null,
      meta: { args: {} },
      createdAt: stale,
    });
    await JobModel.create({
      id: '9209',
      executionId: '9109',
      nodeId: '9309',
      status: JOB_STATUS.PENDING,
      startedAt: null,
      meta: { args: {} },
      createdAt: now,
    });
    await JobModel.update({ updatedAt: stale }, { where: { id: '9203' }, silent: true });

    const publish = vi.spyOn(app.eventQueue, 'publish').mockResolvedValue(undefined);
    const workflowPlugin = app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    const recovery = new TaskRecovery(workflowPlugin, 'test.javascript') as unknown as {
      republishQueuedJobs(): Promise<void>;
    };

    await recovery.republishQueuedJobs();

    expect(publish.mock.calls).toEqual([
      [
        'test.javascript',
        {
          jobId: 9202,
        },
      ],
    ]);
    const staleJob = await JobModel.findByPk('9203');
    const activeJob = await JobModel.findByPk('9204');
    expect(staleJob?.get('startedAt')).toBeTruthy();
    expect(activeJob?.get('startedAt')).toBeTruthy();
  });

  it('aborts a local running JavaScript job only after the job abort transaction commits', async () => {
    const JobModel = db.getModel('jobs');
    const NodeModel = db.getModel('flow_nodes');
    await NodeModel.create({ id: '9305', type: SCRIPT_INSTRUCTION_TYPE });
    await JobModel.create({
      id: '9205',
      executionId: '9105',
      nodeId: '9305',
      status: JOB_STATUS.PENDING,
      startedAt: new Date(),
      meta: { args: {} },
    });

    const plugin = app.pm.get(Plugin) as unknown as { runningJobs: RunningJobs };
    const abort = vi.fn();
    const unregister = plugin.runningJobs.register({
      jobId: '9205',
      executionId: '9105',
      abort,
    });
    const publish = vi.spyOn(app.syncMessageManager, 'publish').mockResolvedValue(undefined);
    const transaction = await db.sequelize.transaction();

    try {
      await JobModel.update(
        { status: JOB_STATUS.ABORTED },
        {
          where: { id: '9205' },
          transaction,
        },
      );
      expect(abort).not.toHaveBeenCalled();

      await transaction.commit();

      expect(abort).toHaveBeenCalledOnce();
      expect(publish).not.toHaveBeenCalled();
    } finally {
      unregister();
      if (!transaction.finished) {
        await transaction.rollback();
      }
    }
  });

  it('broadcasts an aborted JavaScript job when its Worker is on another instance', async () => {
    const JobModel = db.getModel('jobs');
    const NodeModel = db.getModel('flow_nodes');
    await NodeModel.create({ id: '9306', type: SCRIPT_INSTRUCTION_TYPE });
    await JobModel.create({
      id: '9206',
      executionId: '9106',
      nodeId: '9306',
      status: JOB_STATUS.PENDING,
      startedAt: new Date(),
      meta: { args: {} },
    });
    const publish = vi.spyOn(app.syncMessageManager, 'publish').mockResolvedValue(undefined);

    await JobModel.update({ status: JOB_STATUS.ABORTED }, { where: { id: '9206' } });

    expect(publish).toHaveBeenCalledWith(JAVASCRIPT_SYNC_MESSAGE_CHANNEL, {
      type: ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE,
      jobId: 9206,
      executionId: 9106,
      reason: undefined,
    });
  });

  it('handles a remote abort message on the Worker owner instance', async () => {
    const plugin = app.pm.get(Plugin) as unknown as {
      runningJobs: RunningJobs;
      handleSyncMessage(message: unknown): Promise<void>;
    };
    const abort = vi.fn();
    const unregister = plugin.runningJobs.register({
      jobId: 'job-remote',
      executionId: 'execution-remote',
      abort,
    });

    try {
      await plugin.handleSyncMessage({
        type: ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE,
        jobId: 'job-remote',
        executionId: 'execution-remote',
        reason: 'manual_cancel',
      });

      expect(abort).toHaveBeenCalledWith('manual_cancel');
    } finally {
      unregister();
    }
  });
});

describe('JavaScript running jobs', () => {
  it('aborts a local JavaScript job without broadcasting', async () => {
    const abort = vi.fn();
    const publish = vi.fn();
    const runningJobs = new RunningJobs();
    const unregister = runningJobs.register({
      jobId: 'job-1',
      executionId: 'execution-1',
      abort,
    });
    const workflowPlugin = {
      app: {
        syncMessageManager: {
          publish,
        },
      },
    } as unknown as WorkflowPlugin;

    try {
      await runningJobs.abortAcrossInstances(workflowPlugin, {
        type: ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE,
        jobId: 'job-1',
        executionId: 'execution-1',
        reason: 'timeout',
      });
    } finally {
      unregister();
    }

    expect(abort).toHaveBeenCalledWith('timeout');
    expect(publish).not.toHaveBeenCalled();
  });

  it('broadcasts when the JavaScript job is not local', async () => {
    const publish = vi.fn();
    const workflowPlugin = {
      app: {
        syncMessageManager: {
          publish,
        },
      },
    } as unknown as WorkflowPlugin;
    const runningJobs = new RunningJobs();
    const message = {
      type: ABORT_JAVASCRIPT_JOB_SYNC_MESSAGE_TYPE,
      jobId: 'job-2',
      executionId: 'execution-2',
      reason: 'timeout',
    } as const;

    await runningJobs.abortAcrossInstances(workflowPlugin, message);

    expect(publish).toHaveBeenCalledWith(JAVASCRIPT_SYNC_MESSAGE_CHANNEL, message);
  });
});

describe('JavaScript task heartbeat', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the local Worker running when the heartbeat update reports no change for the same claim', async () => {
    vi.useFakeTimers();
    const update = vi.fn().mockResolvedValue([0]);
    const startedAt = new Date();
    const findByPk = vi.fn().mockResolvedValue({ status: JOB_STATUS.PENDING, startedAt });
    const workflowPlugin = {
      db: {
        getModel: () => ({ update, findByPk }),
      },
      getLogger: () => ({ error: vi.fn() }),
    } as unknown as WorkflowPlugin;
    const consumer = new TaskConsumer(workflowPlugin, new RunningJobs()) as unknown as {
      startClaimHeartbeat(job: { id: string; startedAt: Date }, abort: () => void): () => Promise<void>;
    };
    const abort = vi.fn();
    const stop = consumer.startClaimHeartbeat({ id: 'job-3', startedAt }, abort);

    await vi.advanceTimersByTimeAsync(30_000);

    expect(findByPk).toHaveBeenCalledWith('job-3', { attributes: ['status', 'startedAt'] });
    expect(abort).not.toHaveBeenCalled();
    await stop();
  });

  it('aborts the local Worker when the claimed job is no longer pending', async () => {
    vi.useFakeTimers();
    const update = vi.fn().mockResolvedValue([0]);
    const startedAt = new Date();
    const findByPk = vi.fn().mockResolvedValue({ status: JOB_STATUS.ABORTED, startedAt });
    const workflowPlugin = {
      db: {
        getModel: () => ({ update, findByPk }),
      },
      getLogger: () => ({ error: vi.fn() }),
    } as unknown as WorkflowPlugin;
    const consumer = new TaskConsumer(workflowPlugin, new RunningJobs()) as unknown as {
      startClaimHeartbeat(job: { id: string; startedAt: Date }, abort: () => void): () => Promise<void>;
    };
    const abort = vi.fn();
    const stop = consumer.startClaimHeartbeat({ id: 'job-4', startedAt }, abort);

    await vi.advanceTimersByTimeAsync(30_000);

    expect(abort).toHaveBeenCalledOnce();
    await stop();
  });
});
