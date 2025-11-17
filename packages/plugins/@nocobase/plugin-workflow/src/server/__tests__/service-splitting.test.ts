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
import { WORKER_JOB_WORKFLOW_PROCESS } from '../Plugin';

describe('workflow > service splitting > as dispatcher', () => {
  let app: MockServer;
  let db: MockDatabase;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let plugin;
  let workerMode;

  beforeEach(async () => {
    workerMode = process.env.WORKER_MODE;
    process.env.WORKER_MODE = '!';
    app = await getApp();
    plugin = app.pm.get('workflow');

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'asyncTrigger',
    });
  });

  afterEach(async () => {
    await app.destroy();
    process.env.WORKER_MODE = workerMode;
  });

  it('should create pending job', async () => {
    await workflow.createNode({
      type: 'echo',
    });

    await plugin.trigger(workflow, {});

    await sleep(500);

    const [e1] = await workflow.getExecutions();
    expect(e1.status).toBeNull();

    const j1s = await e1.getJobs();
    expect(j1s.length).toBe(0);
  });

  describe('manually execute', () => {
    it('pending node should resume', async () => {
      await workflow.createNode({
        type: 'asyncResume',
      });

      await plugin.execute(workflow, {}, { manually: true });

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.STARTED);

      const j1s = await e1.getJobs();
      expect(j1s.length).toBe(1);
      expect(j1s[0].status).toBe(JOB_STATUS.PENDING);

      await sleep(500);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);

      const j2s = await e2.getJobs();
      expect(j2s.length).toBe(1);
      expect(j2s[0].status).toBe(JOB_STATUS.RESOLVED);
    });
  });
});

describe('workflow > service splitting > as worker', () => {
  let app: MockServer;
  let db: MockDatabase;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let plugin;
  let workerMode;

  beforeEach(async () => {
    workerMode = process.env.WORKER_MODE;
    process.env.WORKER_MODE = WORKER_JOB_WORKFLOW_PROCESS;
    app = await getApp();
    plugin = app.pm.get('workflow');

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'asyncTrigger',
    });
  });

  afterEach(async () => {
    await app.destroy();
    process.env.WORKER_MODE = workerMode;
  });

  it('should create pending job', async () => {
    await workflow.createNode({
      type: 'echo',
    });

    await plugin.trigger(workflow, {});

    await sleep(500);

    const [e1] = await workflow.getExecutions();
    expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);

    const j1s = await e1.getJobs();
    expect(j1s.length).toBe(1);
  });
});
