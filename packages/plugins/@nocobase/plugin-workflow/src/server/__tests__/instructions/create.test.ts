import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

describe('workflow > instructions > create', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let ReplyRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    ReplyRepo = db.getCollection('replies').repository;

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

  describe('create one', () => {
    it('params: from context', async () => {
      const n1 = await workflow.createNode({
        type: 'create',
        config: {
          collection: 'comments',
          params: {
            values: {
              postId: '{{$context.data.id}}',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.postId).toBe(post.id);
    });

    it('params.values with hasMany', async () => {
      const replies = await ReplyRepo.create({ values: [{}, {}] });

      const n1 = await workflow.createNode({
        type: 'create',
        config: {
          collection: 'comments',
          params: {
            values: {
              replies: replies.map((item) => item.id),
            },
            appends: ['replies'],
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.replies.length).toBe(2);
    });

    it('params.appends: belongsTo', async () => {
      const n1 = await workflow.createNode({
        type: 'create',
        config: {
          collection: 'comments',
          params: {
            values: {
              postId: '{{$context.data.id}}',
            },
            appends: ['post'],
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.post.id).toBe(post.id);
    });

    it('params.appends: belongsToMany', async () => {
      const n1 = await workflow.createNode({
        type: 'create',
        config: {
          collection: 'tags',
          params: {
            values: {
              posts: ['{{$context.data.id}}'],
            },
            appends: ['posts'],
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.posts.length).toBe(1);
      expect(job.result.posts[0].id).toBe(post.id);
    });
  });

  describe('multiple data source', () => {
    it('create one', async () => {
      const n1 = await workflow.createNode({
        type: 'create',
        config: {
          collection: 'another:posts',
          params: {
            values: {
              title: '{{$context.data.title}}',
              published: true,
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.title).toBe(post.title);

      const AnotherPostRepo = app.dataSourceManager.dataSources.get('another').collectionManager.getRepository('posts');
      const p2s = await AnotherPostRepo.find();
      expect(p2s.length).toBe(1);
      expect(p2s[0].title).toBe(post.title);
      expect(p2s[0].published).toBe(true);
    });
  });
});
