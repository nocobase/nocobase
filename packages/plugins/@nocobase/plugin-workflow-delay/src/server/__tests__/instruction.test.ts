/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { Application } from '@nocobase/server';

describe('workflow > instructions > delay', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let plugin;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['workflow-delay'],
    });
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

  describe('runtime', () => {
    it('delay to resolved', async () => {
      const n1 = await workflow.createNode({
        type: 'delay',
        config: {
          duration: 2,
          unit: 1000,
          endStatus: JOB_STATUS.RESOLVED,
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      await sleep(2000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
    });

    it('delay to reject', async () => {
      const n1 = await workflow.createNode({
        type: 'delay',
        config: {
          duration: 2,
          unit: 1000,
          endStatus: JOB_STATUS.FAILED,
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      await sleep(2000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toEqual(EXECUTION_STATUS.FAILED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.FAILED);
    });

    it('duration by variable', async () => {
      const n1 = await workflow.createNode({
        type: 'echoVariable',
        config: {
          variable: 2,
        },
      });

      const n2 = await workflow.createNode({
        type: 'delay',
        config: {
          duration: `{{$jobsMapByNodeKey.${n1.key}}}`,
          unit: 1000,
          endStatus: JOB_STATUS.RESOLVED,
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.STARTED);
      const [, j1] = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      await sleep(2000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const [, j2] = await e2.getJobs({ order: [['id', 'ASC']] });
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
    });

    it('delay to resolve and downstream node error', async () => {
      const n1 = await workflow.createNode({
        type: 'delay',
        config: {
          duration: 2,
          unit: 1000,
          endStatus: JOB_STATUS.RESOLVED,
        },
      });
      const n2 = await workflow.createNode({
        type: 'create',
        config: {
          collection: 'notExistsTable',
          params: {
            values: {},
          },
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      await sleep(2000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toEqual(EXECUTION_STATUS.ERROR);
      const [j2, j3] = await e2.getJobs({ order: [['id', 'ASC']] });
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
      expect(j3.status).toBe(JOB_STATUS.ERROR);
    });
  });

  describe('app lifecycle', () => {
    beforeEach(async () => {
      await workflow.createNode({
        type: 'delay',
        config: {
          duration: 2,
          unit: 1000,
          endStatus: JOB_STATUS.RESOLVED,
        },
      });
    });

    it('restart app should trigger delayed job', async () => {
      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      await app.stop();
      await sleep(500);

      await app.start();
      await sleep(2000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
    });

    it('restart app should trigger missed delayed job', async () => {
      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      await app.stop();
      await sleep(2000);

      await app.start();
      await sleep(1000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
    });
  });
});
