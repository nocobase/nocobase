import { MockDatabase } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import { EXECUTION_STATUS } from '../../constants';

describe('workflow > triggers > collection', () => {
  let app: MockServer;
  let db: MockDatabase;
  let CategoryRepo;
  let PostRepo;
  let CommentRepo;
  let TagRepo;
  let WorkflowModel;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['error-handler', 'collection-manager', 'users', 'auth'],
    });

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    CategoryRepo = db.getCollection('categories').repository;
    PostRepo = db.getCollection('posts').repository;
    CommentRepo = db.getCollection('comments').repository;
    TagRepo = db.getCollection('tags').repository;
  });

  afterEach(() => app.destroy());

  describe('toggle', () => {
    it('create without config should ok', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {},
      });

      expect(workflow).toBeDefined();
    });

    it('when collection change', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      await workflow.update({
        config: {
          ...workflow.config,
          collection: 'comments',
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });

    it('restart server and listen a collection managed by collection-manager', async () => {
      await db.getRepository('collections').create({
        values: {
          name: 'temp',
          title: 'Temp',
        },
        // to trigger collection sync to db.collections
        context: {},
      });

      const workflow = await WorkflowModel.create({
        type: 'collection',
        config: {
          mode: 1,
          collection: 'temp',
        },
        enabled: true,
      });

      await db.getRepository('temp').create({ values: {} });

      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);

      await app.restart();

      db = app.db;

      await db.getRepository('temp').create({ values: {} });

      await sleep(500);

      const e2 = await db.getModel('executions').findAll();
      expect(e2.length).toBe(2);
    });
  });

  describe('model context', () => {
    it('with association', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const post = await PostRepo.create({ values: { title: 't1', category: { title: 'c1' } } });

      await sleep(500);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].context.data.title).toBe('t1');
      expect(executions[0].context.data.category.title).toBe('c1');
    });
  });

  describe('config.changed', () => {
    it('no changed config', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 2,
          collection: 'posts',
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      await PostRepo.update({ filterByTk: post.id, values: { title: 't2' } });

      await sleep(500);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].context.data.title).toBe('t2');
    });

    it('field in changed config', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 2,
          collection: 'posts',
          changed: ['title'],
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      await PostRepo.update({ filterByTk: post.id, values: { title: 't2' } });

      await sleep(500);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(executions[0].context.data.title).toBe('t2');
    });

    it('field not in changed config', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 2,
          collection: 'posts',
          changed: ['published'],
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      await PostRepo.update({ filterByTk: post.id, values: { title: 't2' } });

      await sleep(500);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });
  });

  describe('config.appends', () => {
    it('non-appended association could not be accessed', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      await workflow.createNode({
        type: 'echo',
      });

      const category = await CategoryRepo.create({ values: { title: 'c1' } });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          categoryId: category.id,
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.result.data.category).toBeUndefined();
    });

    it('appends association could be accessed', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
          appends: ['category'],
        },
      });

      await workflow.createNode({
        type: 'echo',
      });

      const category = await CategoryRepo.create({ values: { title: 'c1' } });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          categoryId: category.id,
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.result.data.category.title).toBe('c1');
    });

    it('appends belongsTo null', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
          appends: ['category'],
        },
      });

      await workflow.createNode({
        type: 'echo',
      });

      const post = await PostRepo.create({
        values: {
          title: 't1',
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.result.data.category).toBeNull();
    });

    it('appends hasMany', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
          appends: ['comments'],
        },
      });

      await workflow.createNode({
        type: 'echo',
      });

      const comments = await CommentRepo.create({ values: [{}] });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          comments: comments.map((item) => item.id),
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.result.data.comments.length).toBe(1);
    });

    it('appends belongsToMany', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
          appends: ['tags'],
        },
      });

      await workflow.createNode({
        type: 'echo',
      });

      const tags = await TagRepo.create({ values: [{}] });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          tags: tags.map((item) => item.id),
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.result.data.tags.length).toBe(1);
    });

    describe('appends depth > 1', () => {
      it('create with associtions', async () => {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'collection',
          config: {
            mode: 1,
            collection: 'categories',
            appends: ['posts.tags'],
          },
        });

        const tags = await TagRepo.create({ values: [{}] });
        const tagIds = tags.map((item) => item.id);

        const category = await CategoryRepo.create({
          values: {
            title: 't1',
            posts: [
              { title: 't1', tags: tagIds },
              { title: 't2', tags: tagIds },
            ],
          },
        });

        await sleep(500);

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        expect(execution.context.data.posts.length).toBe(2);
        expect(execution.context.data.posts.map((item) => item.title)).toEqual(['t1', 't2']);
        expect(execution.context.data.posts.map((item) => item.tags.map((tag) => tag.id))).toEqual([tagIds, tagIds]);
      });
    });
  });

  describe('cycling trigger', () => {
    it('trigger should not be triggered more than once in same execution', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'create',
        config: {
          collection: 'posts',
          params: {
            values: {
              title: 't2',
            },
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const posts = await PostRepo.find();
      expect(posts.length).toBe(2);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(1);
      expect(e1s[0].status).toBe(EXECUTION_STATUS.RESOLVED);

      // NOTE: second trigger to ensure no skipped event
      const p3 = await PostRepo.create({ values: { title: 't3' } });

      await sleep(500);

      const posts2 = await PostRepo.find();
      expect(posts2.length).toBe(4);

      const e2s = await workflow.getExecutions({ order: [['createdAt', 'DESC']] });
      expect(e2s.length).toBe(2);
      expect(e2s[1].status).toBe(EXECUTION_STATUS.RESOLVED);
    });

    it('multiple cycling trigger should not trigger more than once', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await w1.createNode({
        type: 'create',
        config: {
          collection: 'categories',
          params: {
            values: {
              title: 'c1',
            },
          },
        },
      });

      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'categories',
        },
      });

      const n2 = await w2.createNode({
        type: 'create',
        config: {
          collection: 'posts',
          params: {
            values: {
              title: 't2',
            },
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const posts = await PostRepo.find();
      expect(posts.length).toBe(2);

      const e1s = await w1.getExecutions();
      expect(e1s.length).toBe(1);
      expect(e1s[0].status).toBe(EXECUTION_STATUS.RESOLVED);

      const e2s = await w2.getExecutions();
      expect(e2s.length).toBe(1);
      expect(e2s[0].status).toBe(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('sync', () => {
    it('sync collection trigger', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        sync: true,
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'create',
        config: {
          collection: 'comments',
          params: {
            values: {},
          },
        },
      });

      await PostRepo.create({ values: { title: 't1' } });

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].status).toBe(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('multiple data source', () => {
    let anotherDB: MockDatabase;
    beforeEach(async () => {
      // @ts-ignore
      anotherDB = app.dataSourceManager.dataSources.get('another').collectionManager.db;
    });

    it('collection trigger on another', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'another:posts',
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(0);

      const AnotherPostRepo = anotherDB.getRepository('posts');
      const anotherPost = await AnotherPostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const e2s = await workflow.getExecutions();
      expect(e2s.length).toBe(1);
      expect(e2s[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e2s[0].context.data.title).toBe('t2');

      const p1s = await PostRepo.find();
      expect(p1s.length).toBe(1);

      const p2s = await AnotherPostRepo.find();
      expect(p2s.length).toBe(1);
    });

    it('revisiond workflow should only trigger on enabled version', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'another:posts',
        },
      });

      const AnotherPostRepo = anotherDB.getRepository('posts');
      const p1 = await AnotherPostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const e1s = await w1.getExecutions();
      expect(e1s.length).toBe(1);

      const user = await app.db.getRepository('users').findOne();
      const agent = app.agent().login(user);

      const { body } = await agent.resource('workflows').revision({
        filterByTk: w1.id,
        filter: {
          key: w1.key,
        },
      });
      const w2 = await WorkflowModel.findByPk(body.data.id);
      await w2.update({ enabled: true });
      expect(w2.enabled).toBe(true);
      console.log('w2', w2.toJSON());

      await w1.reload();
      expect(w1.enabled).toBe(false);

      const p2 = await AnotherPostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const e2s = await w1.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(e2s.length).toBe(1);

      const ExecutionRepo = app.db.getRepository('executions');
      const e3s = await ExecutionRepo.find({
        filter: {
          workflowId: w2.id,
        },
      });
      expect(e3s.length).toBe(1);
    });
  });
});
