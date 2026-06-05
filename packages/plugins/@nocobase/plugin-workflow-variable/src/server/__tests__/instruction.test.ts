/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import Database from '@nocobase/database';
import { Application } from '@nocobase/server';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import Plugin from '..';

describe('workflow > variable node', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: [Plugin],
    });

    db = app.db;

    PostRepo = db.getCollection('posts').repository;

    const WorkflowModel = db.getModel('workflows');
    workflow = await WorkflowModel.create({
      sync: true,
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
  });

  afterEach(() => app.destroy());

  describe('declaring', () => {
    it('null', async () => {
      const n1 = await workflow.createNode({
        type: 'variable',
      });

      const n2 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'formula.js',
          expression: `{{$jobsMapByNodeKey.${n1.key}}}`,
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const data = await PostRepo.create({
        values: { title: 't1' },
      });

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      const [j1, j2] = jobs;
      expect(j1.status).toBe(JOB_STATUS.RESOLVED);
      expect(j1.result).toBe(null);
      expect(j2.result).toBe(null);
    });

    it('number', async () => {
      const n1 = await workflow.createNode({
        type: 'variable',
        config: {
          value: -1,
        },
      });

      const n2 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'formula.js',
          expression: `{{$jobsMapByNodeKey.${n1.key}}}`,
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const data = await PostRepo.create({
        values: { title: 't1' },
      });

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      const [j1, j2] = jobs;
      expect(j1.status).toBe(JOB_STATUS.RESOLVED);
      expect(j1.result).toBe(-1);
      expect(j2.result).toBe(-1);
    });
  });

  describe('assigning', () => {
    it('assign to exists variable and use', async () => {
      const n1 = await workflow.createNode({
        type: 'variable',
        config: {
          value: null,
        },
      });

      const n2 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'formula.js',
          expression: `{{$jobsMapByNodeKey.${n1.key}}}`,
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const n3 = await workflow.createNode({
        type: 'variable',
        config: {
          target: n1.key,
          value: false,
        },
        upstreamId: n2.id,
      });

      await n2.setDownstream(n3);

      const n4 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'formula.js',
          expression: `{{$jobsMapByNodeKey.${n1.key}}}`,
        },
        upstreamId: n3.id,
      });

      await n3.setDownstream(n4);

      const data = await PostRepo.create({
        values: { title: 't1' },
      });

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(5);
      const [j1, j2, j3, j4, j5] = jobs;
      expect(j1.result).toBe(null);
      expect(j2.result).toBe(null);
      expect(j3.result).toBe(false);
      expect(j3.nodeId).toBe(n1.id);
      expect(j4.result).toBe(false);
      expect(j5.result).toBe(false);
    });
  });
});
