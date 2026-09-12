/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

describe('workflow > instructions > destroy', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;

    workflow = await WorkflowModel.create({
      title: 'test workflow',
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
  });

  afterEach(() => app.destroy());

  describe('destroy one', () => {
    it('params: from context', async () => {
      const n1 = await workflow.createNode({
        type: 'destroy',
        config: {
          collection: 'posts',
          params: {
            filter: {
              id: '{{$context.data.id}}',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);

      const count = await PostRepo.count();
      expect(count).toBe(0);
    });
  });

  describe('multiple data source', () => {
    it('destroy one', async () => {
      const AnotherPostRepo = app.dataSourceManager.dataSources.get('another').collectionManager.getRepository('posts');
      const post = await AnotherPostRepo.create({ values: { title: 't1' } });
      const p1s = await AnotherPostRepo.find();
      expect(p1s.length).toBe(1);

      const n1 = await workflow.createNode({
        type: 'destroy',
        config: {
          collection: 'another:posts',
          params: {
            filter: {
              // @ts-ignore
              id: post.id,
            },
          },
        },
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);

      const p2s = await AnotherPostRepo.find();
      expect(p2s.length).toBe(0);
    });
  });

  describe('validation', () => {
    let agent;
    let validationWorkflow;

    beforeEach(async () => {
      agent = (app as any).agent();
      const WorkflowModel = db.getCollection('workflows').model;
      validationWorkflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
    });

    it('should reject when collection is not provided', async () => {
      const { status } = await agent.resource('workflows.nodes', validationWorkflow.id).create({
        values: { type: 'destroy', config: {} },
      });
      expect(status).toBe(400);
    });

    it('should reject when collection does not exist', async () => {
      const { status } = await agent.resource('workflows.nodes', validationWorkflow.id).create({
        values: { type: 'destroy', config: { collection: 'nonexistent_xyz' } },
      });
      expect(status).toBe(400);
    });

    it('should accept when collection exists', async () => {
      const { status } = await agent.resource('workflows.nodes', validationWorkflow.id).create({
        values: { type: 'destroy', config: { collection: 'posts' } },
      });
      expect(status).toBe(200);
    });

    it('should reject with nonexistent data source', async () => {
      const { status } = await agent.resource('workflows.nodes', validationWorkflow.id).create({
        values: { type: 'destroy', config: { collection: 'bad_ds:posts' } },
      });
      expect(status).toBe(400);
    });
  });
});
