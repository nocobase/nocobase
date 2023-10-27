import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '..';
import type { WorkflowModel as WorkflowModelType } from '../../types';

describe('workflow > instructions > update', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow: WorkflowModelType;

  beforeEach(async () => {
    app = await getApp();

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

  describe('update one', () => {
    it('params: from context', async () => {
      const n1 = await workflow.createNode({
        type: 'update',
        config: {
          collection: 'posts',
          params: {
            filter: {
              id: '{{$context.data.id}}',
            },
            values: {
              published: true,
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      expect(post.published).toBe(false);

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);

      const updatedPost = await PostRepo.findById(post.id);
      expect(updatedPost.published).toBe(true);
    });

    it('params: from job of node', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            filter: {
              title: 'test',
            },
          },
        },
      });

      const n2 = await workflow.createNode({
        type: 'update',
        config: {
          collection: 'posts',
          params: {
            filter: {
              id: `{{$jobsMapByNodeKey.${n1.key}.id}}`,
            },
            values: {
              title: 'changed',
            },
          },
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      // NOTE: the result of post immediately created will not be changed by workflow
      const { id } = await PostRepo.create({ values: { title: 'test' } });

      await sleep(500);

      // should get from db
      const post = await PostRepo.findById(id);
      expect(post.title).toBe('changed');
    });
  });

  describe('update batch', () => {
    it('individualHooks off should not trigger other workflow', async () => {
      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 2,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'update',
        config: {
          collection: 'posts',
          params: {
            filter: {
              id: '{{$context.data.id}}',
            },
            values: {
              published: true,
            },
            individualHooks: false,
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      expect(post.published).toBe(false);

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);

      const updatedPost = await PostRepo.findById(post.id);
      expect(updatedPost.published).toBe(true);

      const w2Exes = await w2.getExecutions();
      expect(w2Exes.length).toBe(0);
    });

    it('individualHooks on should trigger other workflow', async () => {
      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 2,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'update',
        config: {
          collection: 'posts',
          params: {
            filter: {
              id: '{{$context.data.id}}',
            },
            values: {
              published: true,
            },
            individualHooks: true,
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      expect(post.published).toBe(false);

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);

      const updatedPost = await PostRepo.findById(post.id);
      expect(updatedPost.published).toBe(true);

      const w2Exes = await w2.getExecutions();
      expect(w2Exes.length).toBe(1);
    });
  });
});
