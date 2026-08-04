/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import WorkflowPlugin, { JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp } from '@nocobase/plugin-workflow-test';
import { Application } from '@nocobase/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Plugin from '..';
import { JavaScriptTaskRecovery } from '../JavaScriptTaskRecovery';
import { JavaScriptQueueFullError, JavaScriptTaskQueue } from '../JavaScriptTaskQueue';

const JAVASCRIPT_META = {
  javascript: {
    version: 1,
    content: 'return 1;',
    args: {},
  },
};

describe('JavaScript task queue', () => {
  let app: Application;
  let db: Database;
  let originalMaxPending: string | undefined;

  beforeEach(async () => {
    originalMaxPending = process.env.WORKFLOW_JAVASCRIPT_QUEUE_MAX_PENDING;
    app = await getApp({ plugins: [Plugin] });
    db = app.db;
  });

  afterEach(async () => {
    process.env.WORKFLOW_JAVASCRIPT_QUEUE_MAX_PENDING = originalMaxPending;
    await app.destroy();
  });

  it('counts only unclaimed JavaScript jobs toward queue capacity', async () => {
    process.env.WORKFLOW_JAVASCRIPT_QUEUE_MAX_PENDING = '1';
    const queue = new JavaScriptTaskQueue(app, 'test.javascript');
    const JobModel = db.getModel('jobs');

    await JobModel.create({ id: '9101', status: JOB_STATUS.PENDING, startedAt: null, meta: { delay: true } });
    await expect(queue.assertCapacity()).resolves.toBeUndefined();

    await JobModel.create({ id: '9102', status: JOB_STATUS.PENDING, startedAt: null, meta: JAVASCRIPT_META });
    await expect(queue.assertCapacity()).rejects.toBeInstanceOf(JavaScriptQueueFullError);
  });

  it('republishes unclaimed and stale JavaScript jobs without scanning unrelated jobs', async () => {
    const JobModel = db.getModel('jobs');
    const now = new Date();
    const stale = new Date(now.getTime() - 180_000);

    await JobModel.create({ id: '9201', status: JOB_STATUS.PENDING, startedAt: null, meta: { delay: true } });
    await JobModel.create({ id: '9202', status: JOB_STATUS.PENDING, startedAt: null, meta: JAVASCRIPT_META });
    await JobModel.create({
      id: '9203',
      status: JOB_STATUS.PENDING,
      startedAt: stale,
      meta: JAVASCRIPT_META,
    });
    await JobModel.create({ id: '9204', status: JOB_STATUS.PENDING, startedAt: now, meta: JAVASCRIPT_META });
    await db.sequelize
      .getQueryInterface()
      .bulkUpdate(
        JobModel.getTableName(),
        { updated_at: stale },
        { id: '9203' },
        {},
        { updated_at: JobModel.rawAttributes.updatedAt },
      );

    const publish = vi.fn().mockResolvedValue(undefined);
    const taskQueue = { publish } as unknown as JavaScriptTaskQueue;
    const workflowPlugin = app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    const recovery = new JavaScriptTaskRecovery(workflowPlugin, taskQueue) as unknown as {
      republishQueuedJobs(): Promise<void>;
    };

    await recovery.republishQueuedJobs();

    expect(publish.mock.calls).toEqual([[9202], [9203]]);
    const recoveredJob = await JobModel.findByPk('9203');
    const activeJob = await JobModel.findByPk('9204');
    expect(recoveredJob?.get('startedAt')).toBeNull();
    expect(activeJob?.get('startedAt')).toBeTruthy();
  });
});
