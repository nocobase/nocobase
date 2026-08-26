/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { Application } from '@nocobase/server';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp } from '@nocobase/plugin-workflow-test';
import Plugin from '..';

describe('workflow > instruction > loop > process.env.WORKFLOW_LOOP_LIMIT', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let plugin;

  afterEach(() => app.destroy());

  describe('limit = 1', () => {
    let original: string | undefined;

    beforeEach(async () => {
      original = process.env.WORKFLOW_LOOP_LIMIT;
      process.env.WORKFLOW_LOOP_LIMIT = '1';

      app = await getApp({
        plugins: [Plugin],
      });
      plugin = app.pm.get('workflow');

      db = app.db;
      WorkflowModel = db.getCollection('workflows').model;
      PostRepo = db.getCollection('posts').repository;

      workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });
    });

    afterEach(() => {
      process.env.WORKFLOW_LOOP_LIMIT = original;
    });

    it('limit exceeded should stop loop', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: 10,
        },
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.ERROR);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      expect(jobs[0].status).toBe(JOB_STATUS.ERROR);
      expect(jobs[0].result).toEqual({ looped: 1, done: 1, exceeded: true });
    });

    it('limit not exceeded should be resolved', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: 10,
        },
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.ERROR);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      expect(jobs[0].status).toBe(JOB_STATUS.ERROR);
      expect(jobs[0].result).toEqual({ looped: 1, done: 1, exceeded: true });
    });
  });

  describe('limit = 0', () => {
    let original: string | undefined;

    beforeEach(async () => {
      original = process.env.WORKFLOW_LOOP_LIMIT;
      process.env.WORKFLOW_LOOP_LIMIT = '0';

      app = await getApp({
        plugins: [Plugin],
      });
      plugin = app.pm.get('workflow');

      db = app.db;
      WorkflowModel = db.getCollection('workflows').model;
      PostRepo = db.getCollection('posts').repository;

      workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });
    });

    afterEach(() => {
      process.env.WORKFLOW_LOOP_LIMIT = original;
    });

    it('zero disables limit', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: 10,
        },
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(11);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(jobs[0].result).toEqual({ looped: 10, done: 10 });
    });
  });
});
