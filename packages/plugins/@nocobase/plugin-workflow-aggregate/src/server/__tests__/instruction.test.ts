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
    it('count', async () => {
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

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);
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

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(1);

      const p2 = await PostRepo.create({ values: { title: 't2', read: 2 } });

      await sleep(500);

      const [e2] = await workflow.getExecutions({ order: [['id', 'desc']] });
      const [j2] = await e2.getJobs();
      expect(j2.result).toBe(3);
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

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(1);

      const p2 = await PostRepo.create({ values: { title: 't2', read: 2 } });

      await sleep(500);

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

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(1);

      const p2 = await PostRepo.create({ values: { title: 't2', read: 2 } });

      await sleep(500);

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

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      const [j1] = await e1.getJobs();
      expect(j1.result).toBe(1);

      const p2 = await PostRepo.create({ values: { title: 't2', read: 2 } });

      await sleep(500);

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

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      const [j1, j2] = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(j1.result).toBe(2);
      expect(j2.result).toBe(1);
    });

    it('sum', async () => {
      const PostModel = db.getCollection('posts').model;
      const p1 = await PostModel.create({ title: 't1', read: 1 });

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

      await sleep(500);

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

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);
    });
  });
});
