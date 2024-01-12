import path from 'path';

import { MockDatabase } from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { MockServer } from '@nocobase/test';

import Plugin from '..';

describe('workflow > instructions > calculation', () => {
  let app: MockServer;
  let db: MockDatabase;
  let PostRepo;
  let CategoryRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: [Plugin],
      collectionsPath: path.join(__dirname, 'collections'),
    });

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    CategoryRepo = db.getCollection('categories').repository;

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

  describe('dynamic expression', () => {
    it('dynamic expression field in current table', async () => {
      const n1 = await workflow.createNode({
        type: 'dynamic-calculation',
        config: {
          expression: '{{$context.data.category}}',
          scope: '{{$context.data}}',
        },
      });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          category: {
            engine: 'math.js',
            expression: '1 + {{read}}',
          },
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);
    });

    it('dynamic expression field in association table', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'categories',
          params: {
            filter: {
              $and: [{ id: '{{$context.data.categoryId}}' }],
            },
          },
        },
      });

      const n2 = await workflow.createNode({
        type: 'dynamic-calculation',
        config: {
          expression: `{{$jobsMapByNodeKey.${n1.key}}}`,
          scope: '{{$context.data}}',
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const category = await CategoryRepo.create({
        values: {
          title: 'c1',
          engine: 'math.js',
          expression: '1 + {{read}}',
        },
      });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          categoryId: category.id,
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      expect(jobs[1].result).toBe(1);
    });
  });
});
