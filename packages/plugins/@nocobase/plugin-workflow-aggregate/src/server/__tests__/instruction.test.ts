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
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import Plugin from '..';
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';

describe('workflow > instructions > aggregate', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let CommentRepo;
  let TagRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: [Plugin],
    });

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    CommentRepo = db.getCollection('comments').repository;
    TagRepo = db.getCollection('tags').repository;

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

  describe('based on collection', () => {
    it('count with data matched', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'count',
          collection: 'posts',
          params: {
            field: 'id',
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);
    });

    it('count without data matched', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'count',
          collection: 'posts',
          params: {
            field: 'id',
            filter: {
              id: 0,
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(0);
    });

    it('sum', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'sum',
          collection: 'posts',
          params: {
            field: 'read',
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1', read: 1 } });

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(1);

      const p2 = await PostRepo.create({ values: { title: 't2', read: 2 } });

      const [e2] = await workflow.getExecutions({ order: [['id', 'desc']] });
      const [j2] = await e2.getJobs();
      expect(j2.result).toBe(3);
    });

    it('sum double field', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'sum',
          collection: 'posts',
          params: {
            field: 'score',
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1', score: 0.1 } });

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(0.1);

      const p2 = await PostRepo.create({ values: { title: 't2', score: 0.2 } });

      const [e2] = await workflow.getExecutions({ order: [['id', 'desc']] });
      const [j2] = await e2.getJobs();
      expect(j2.result).toBe(0.3);
    });

    it('sum number will be rounded to 2 decimal places by default', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'sum',
          collection: 'posts',
          params: {
            field: 'score',
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1', score: 0.123 } });

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(0.12);

      const p2 = await PostRepo.create({ values: { title: 't2', score: 0.456 } });

      const [e2] = await workflow.getExecutions({ order: [['id', 'desc']] });
      const [j2] = await e2.getJobs();
      expect(j2.result).toBe(0.58);
    });

    it('sum precision configured -1 as 0', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'sum',
          collection: 'posts',
          params: {
            field: 'score',
          },
          precision: -1,
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1', score: 0.123 } });

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(0);

      const p2 = await PostRepo.create({ values: { title: 't2', score: 0.456 } });

      const [e2] = await workflow.getExecutions({ order: [['id', 'desc']] });
      const [j2] = await e2.getJobs();
      expect(j2.result).toBe(1);
    });

    it('sum precision configured over 14 as 14', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'sum',
          collection: 'posts',
          params: {
            field: 'score',
          },
          precision: 15,
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1', score: 0.100000000000001 } });

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(0.1);

      const p2 = await PostRepo.create({ values: { title: 't2', score: 0.200000000000001 } });

      const [e2] = await workflow.getExecutions({ order: [['id', 'desc']] });
      const [j2] = await e2.getJobs();
      expect(j2.result).toBe(0.3);
    });

    it('sum null will be 0', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'sum',
          collection: 'posts',
          params: {
            field: 'read',
          },
        },
      });

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(0);
    });

    it('avg', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'avg',
          collection: 'posts',
          params: {
            field: 'read',
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1', read: 1 } });

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(1);

      const p2 = await PostRepo.create({ values: { title: 't2', read: 2 } });

      const [e2] = await workflow.getExecutions({ order: [['id', 'desc']] });
      const [j2] = await e2.getJobs();
      expect(j2.result).toBe(1.5);
    });

    it('min', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'min',
          collection: 'posts',
          params: {
            field: 'read',
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1', read: 1 } });

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(1);

      const p2 = await PostRepo.create({ values: { title: 't2', read: 2 } });

      const [e2] = await workflow.getExecutions({ order: [['id', 'desc']] });
      const [j2] = await e2.getJobs();
      expect(j2.result).toBe(1);
    });

    it('max', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'max',
          collection: 'posts',
          params: {
            field: 'read',
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1', read: 1 } });

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(1);

      const p2 = await PostRepo.create({ values: { title: 't2', read: 2 } });

      const [e2] = await workflow.getExecutions({ order: [['id', 'desc']] });
      const [j2] = await e2.getJobs();
      expect(j2.result).toBe(2);
    });
  });

  describe('based on data associated collection', () => {
    it('count', async () => {
      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          aggregator: 'count',
          collection: 'comments',
          associated: true,
          association: {
            name: 'comments',
            associatedKey: '{{$context.data.id}}',
            associatedCollection: 'posts',
          },
          params: {
            field: 'id',
          },
        },
      });
      const n2 = await workflow.createNode({
        upstreamId: n1.id,
        type: 'aggregate',
        config: {
          aggregator: 'count',
          collection: 'comments',
          associated: true,
          association: {
            name: 'comments',
            associatedKey: '{{$context.data.id}}',
            associatedCollection: 'posts',
          },
          params: {
            field: 'id',
            filter: {
              $and: [{ status: 1 }],
            },
          },
        },
      });
      await n1.setDownstream(n2);

      await CommentRepo.create({ values: [{}, {}] });

      const p1 = await PostRepo.create({ values: { title: 't1', comments: [{}, { status: 1 }] } });

      const [e1] = await workflow.getExecutions();
      const [j1, j2] = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(j1.result).toBe(2);
      expect(j2.result).toBe(1);
    });

    it('sum', async () => {
      const PostModel = db.getCollection('posts').model;
      const p1 = await PostModel.create({ title: 't1', read: 1 }, { hooks: false });

      const n1 = await workflow.createNode({
        type: 'create',
        config: {
          collection: 'tags',
          params: {
            values: {
              posts: [p1.id, '{{$context.data.id}}'],
            },
          },
        },
      });
      const n2 = await workflow.createNode({
        upstreamId: n1.id,
        type: 'aggregate',
        config: {
          aggregator: 'sum',
          collection: 'posts',
          associated: true,
          association: {
            name: 'posts',
            associatedKey: `{{$jobsMapByNodeKey.${n1.key}.id}}`,
            associatedCollection: 'tags',
          },
          params: {
            field: 'read',
          },
        },
      });
      await n1.setDownstream(n2);
      const n3 = await workflow.createNode({
        upstreamId: n2.id,
        type: 'aggregate',
        config: {
          aggregator: 'sum',
          collection: 'posts',
          associated: true,
          association: {
            name: 'posts',
            associatedKey: `{{$jobsMapByNodeKey.${n1.key}.id}}`,
            associatedCollection: 'tags',
          },
          params: {
            field: 'read',
            filter: {
              $and: [{ title: 't1' }],
            },
          },
        },
      });
      await n2.setDownstream(n3);

      await TagRepo.create({ values: [{}, {}] });

      const p2 = await PostRepo.create({ values: { title: 't2', read: 2 } });

      const [e1] = await workflow.getExecutions();
      const [j1, j2, j3] = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(j2.result).toBe(3);
      expect(j3.result).toBe(1);
    });
  });

  describe('multiple data source', () => {
    it('query on another data source', async () => {
      const AnotherPostRepo = app.dataSourceManager.dataSources.get('another').collectionManager.getRepository('posts');
      const post = await AnotherPostRepo.create({ values: { title: 't1' } });
      const p1s = await AnotherPostRepo.find();
      expect(p1s.length).toBe(1);

      const n1 = await workflow.createNode({
        type: 'aggregate',
        config: {
          collection: 'another:posts',
          aggregator: 'count',
          params: {
            field: 'id',
          },
        },
      });

      await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);
    });

    it('transaction in sync workflow', async () => {
      PostRepo = app.dataSourceManager.dataSources.get('another').collectionManager.getRepository('posts');

      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        sync: true,
        config: {
          mode: 1,
          collection: 'another:posts',
        },
      });

      const n1 = await w1.createNode({
        type: 'aggregate',
        config: {
          collection: 'another:posts',
          aggregator: 'count',
          params: {
            field: 'id',
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      const e1s = await w1.getExecutions();
      expect(e1s.length).toBe(1);
      expect(e1s[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await e1s[0].getJobs();
      expect(job.result).toBe(1);
    });
  });
});
