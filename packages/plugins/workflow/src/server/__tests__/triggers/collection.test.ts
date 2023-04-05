import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '..';
import { EXECUTION_STATUS } from '../../constants';



describe('workflow > triggers > collection', () => {
  let app: Application;
  let db: Database;
  let CategoryRepo;
  let PostRepo;
  let CommentRepo;
  let TagRepo;
  let WorkflowModel;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    CategoryRepo = db.getCollection('categories').repository;
    PostRepo = db.getCollection('posts').repository;
    CommentRepo = db.getCollection('comments').repository;
    TagRepo = db.getCollection('tags').repository;
  });

  afterEach(() => db.close());

  describe('toggle', () => {
    it('when collection change', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts'
        }
      });

      await workflow.update({
        config: {
          ...workflow.config,
          collection: 'comments'
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });
  });

  describe('model context', () => {
    it('with association', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts'
        }
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
          collection: 'posts'
        }
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
          changed: ['title']
        }
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
          changed: ['published']
        }
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
        }
      });

      await workflow.createNode({
        type: 'echo'
      });

      const category = await CategoryRepo.create({ values: { title: 'c1' } });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          categoryId: category.id
        }
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
          appends: ['category']
        }
      });

      await workflow.createNode({
        type: 'echo'
      });

      const category = await CategoryRepo.create({ values: { title: 'c1' } });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          categoryId: category.id
        }
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.result.data.category.title).toBe('c1');
    });

    it('appends hasMany', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
          appends: ['comments']
        }
      });

      await workflow.createNode({
        type: 'echo'
      });

      const comments = await CommentRepo.create({ values: [{}] });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          comments: comments.map(item => item.id)
        }
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
          appends: ['tags']
        }
      });

      await workflow.createNode({
        type: 'echo'
      });

      const tags = await TagRepo.create({ values: [{}] });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          tags: tags.map(item => item.id)
        }
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.result.data.tags.length).toBe(1);
    });
  });
});
