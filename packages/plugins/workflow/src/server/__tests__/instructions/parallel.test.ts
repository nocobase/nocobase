import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '..';
import { EXECUTION_STATUS } from '../../constants';



describe('workflow > instructions > parallel', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let plugin;

  beforeEach(async () => {
    app = await getApp();
    plugin = app.pm.get('@nocobase/plugin-workflow');

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts'
      }
    });
  });

  afterEach(() => app.stop());

  describe('single all', () => {
    it('all resolved', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel'
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0
      });
      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
    });

    it('some rejected', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel'
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0
      });
      const n3 = await workflow.createNode({
        type: 'error',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.REJECTED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
    });

    it('first branch rejected', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel'
      });

      const n2 = await workflow.createNode({
        type: 'error',
        upstreamId: n1.id,
        branchIndex: 0
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.REJECTED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
    });
  });

  describe('single any', () => {
    it('first resolved', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel',
        config: {
          mode: 'any'
        }
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0
      });
      const n3 = await workflow.createNode({
        type: 'error',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
    });

    it('first rejected', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel',
        config: {
          mode: 'any'
        }
      });
      const n2 = await workflow.createNode({
        type: 'error',
        upstreamId: n1.id,
        branchIndex: 0
      });
      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
    });

    it('all rejected', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel',
        config: {
          mode: 'any'
        }
      });
      const n2 = await workflow.createNode({
        type: 'error',
        upstreamId: n1.id,
        branchIndex: 0
      });
      const n3 = await workflow.createNode({
        type: 'error',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.REJECTED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
    });
  });

  describe('single race', () => {
    it('first resolved', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel',
        config: {
          mode: 'race'
        }
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0
      });
      const n3 = await workflow.createNode({
        type: 'error',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
    });

    it('first rejected', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel',
        config: {
          mode: 'race'
        }
      });
      const n2 = await workflow.createNode({
        type: 'error',
        upstreamId: n1.id,
        branchIndex: 0
      });
      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.REJECTED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
    });
  });

  describe('branch and join', () => {
    it('link to single branch', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel'
      });

      const n2 = await workflow.createNode({
        title: 'echo1',
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0
      });

      const n3 = await workflow.createNode({
        title: 'echo2',
        type: 'echo',
        upstreamId: n1.id
      });

      await n1.setDownstream(n3);

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
    });

    it('link to multipe branches', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel'
      });

      const n2 = await workflow.createNode({
        title: 'echo1',
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0
      });

      const n3 = await workflow.createNode({
        title: 'echo2',
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const n4 = await workflow.createNode({
        title: 'echo on end',
        type: 'echo',
        upstreamId: n1.id
      });

      await n1.setDownstream(n4);

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(4);
    });

    it('random branch index', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel'
      });

      const n2 = await workflow.createNode({
        title: 'echo1',
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 3
      });

      const n3 = await workflow.createNode({
        title: 'echo2',
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
    });

    it('downstream has manual node', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel'
      });

      const n2 = await workflow.createNode({
        title: 'prompt',
        type: 'prompt',
        upstreamId: n1.id,
        branchIndex: 0
      });

      const n3 = await workflow.createNode({
        title: 'echo',
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const n4 = await workflow.createNode({
        title: 'echo on end',
        type: 'echo',
        upstreamId: n1.id
      });

      await n1.setDownstream(n4);

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.STARTED);

      const [pending] = await execution.getJobs({ where: { nodeId: n2.id } });
      pending.set('result', 123);
      const processor = plugin.createProcessor(execution);
      await processor.resume(pending);

      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(4);
    });
  });

  describe('nested', () => {
    it('nested 2 levels', async () => {
      const n1 = await workflow.createNode({
        type: 'parallel'
      });

      const n2 = await workflow.createNode({
        type: 'parallel',
        upstreamId: n1.id,
        branchIndex: 0
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1
      });

      const n4 = await workflow.createNode({
        type: 'echo',
        upstreamId: n2.id,
        branchIndex: 0
      });

      const n5 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id
      });
      await n1.setDownstream(n5);

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(5);
    });
  });
});
