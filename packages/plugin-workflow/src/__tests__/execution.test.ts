import { Application } from '@nocobase/server';
import Database, { Model, ModelCtor } from '@nocobase/database';
import { getApp } from '.';
import { WorkflowModel } from '../models/Workflow';
import { EXECUTION_STATUS, JOB_STATUS, LINK_TYPE } from '../constants';

jest.setTimeout(300000);

describe('execution', () => {
  let app: Application;
  let db: Database;
  let PostModel: ModelCtor<Model>;
  // let Target: ModelCtor<Model>;
  let WorkflowModel: ModelCtor<WorkflowModel>;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getModel('workflows') as any;
    PostModel = db.getModel('posts');
    // Target = db.getModel('targets');
  });

  afterEach(() => db.close());

  describe('base', () => {
    it('empty workflow without any nodes', async () => {
      const workflow = await WorkflowModel.create({
        title: 'empty workflow',
        enabled: true,
        type: 'afterCreate',
        config: {
          collection: 'posts'
        }
      });

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      expect(execution.context.data.title).toEqual(post.title);
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);
    });

    it('workflow with single simple node', async () => {
      const workflow = await WorkflowModel.create({
        title: 'simple workflow',
        enabled: true,
        type: 'afterCreate',
        config: {
          collection: 'posts'
        }
      });
  
      await workflow.createNode({
        title: 'echo',
        type: 'echo'
      });
  
      const post = await PostModel.create({ title: 't1' });
  
      const [execution] = await workflow.getExecutions();
      expect(execution.context.data.title).toEqual(post.title);
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);
  
      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(1);
      const { status, result } = jobs[0].get();
      expect(status).toEqual(JOB_STATUS.RESOLVED);
      expect(result).toMatchObject({ data: JSON.parse(JSON.stringify(post.toJSON())) });
    });
  
    it('workflow with multiple simple nodes', async () => {
      const workflow = await WorkflowModel.create({
        title: 'simple workflow',
        enabled: true,
        type: 'afterCreate',
        config: {
          collection: 'posts'
        }
      });
  
      const n1 = await workflow.createNode({
        title: 'echo 1',
        type: 'echo'
      });
  
      const n2 = await workflow.createNode({
        title: 'echo 2',
        type: 'echo',
        upstream_id: n1.id
      });

      await n1.setDownstream(n2);
  
      const post = await PostModel.create({ title: 't1' });
  
      const [execution] = await workflow.getExecutions();
      expect(execution.context.data.title).toEqual(post.title);
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);
  
      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(2);
      const { status, result } = jobs[1].get();
      expect(status).toEqual(JOB_STATUS.RESOLVED);
      expect(result).toMatchObject({ data: JSON.parse(JSON.stringify(post.toJSON())) });
    });

    it('execute resolved workflow', async () => {
      const workflow = await WorkflowModel.create({
        title: 'simple workflow',
        enabled: true,
        type: 'afterCreate',
        config: {
          collection: 'posts'
        }
      });
  
      await workflow.createNode({
        title: 'echo',
        type: 'echo'
      });
  
      const post = await PostModel.create({ title: 't1' });
  
      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      expect(execution.start()).rejects.toThrow();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(1);
    });
  });

  describe('manual nodes', () => {
    it('manual node should pause execution, and could be manually resume', async () => {
      const workflow = await WorkflowModel.create({
        title: 'manual workflow',
        enabled: true,
        type: 'afterCreate',
        config: {
          collection: 'posts'
        }
      });
  
      const n1 = await workflow.createNode({
        title: 'prompt',
        type: 'prompt',
      });
      
      const n2 = await workflow.createNode({
        title: 'echo',
        type: 'echo',
        upstream_id: n1.id
      });

      await n1.setDownstream(n2);

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.STARTED);
      const [pending] = await execution.getJobs();
      expect(pending.status).toEqual(JOB_STATUS.PENDING);
      expect(pending.result).toEqual(null);

      pending.set('result', 123);
      await execution.resume(pending);
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toEqual(2);
      expect(jobs[0].status).toEqual(JOB_STATUS.RESOLVED);
      expect(jobs[0].result).toEqual(123);
      expect(jobs[1].status).toEqual(JOB_STATUS.RESOLVED);
      expect(jobs[1].result).toEqual(123);
    });
  });

  describe('condition node', () => {
    it('condition node link to different downstreams', async () => {
      const workflow = await WorkflowModel.create({
        title: 'condition workflow',
        enabled: true,
        type: 'afterCreate',
        config: {
          collection: 'posts'
        }
      });

      const n1 = await workflow.createNode({
        title: 'condition',
        type: 'condition',
        // no config means always true
      });

      const n2 = await workflow.createNode({
        title: 'true to echo',
        type: 'echo',
        linkType: LINK_TYPE.ON_TRUE,
        upstream_id: n1.id
      });

      await workflow.createNode({
        title: 'false to echo',
        type: 'echo',
        linkType: LINK_TYPE.ON_FALSE,
        upstream_id: n1.id
      });

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toEqual(2);
      expect(jobs[0].node_id).toEqual(n1.id);
      expect(jobs[1].node_id).toEqual(n2.id);
      expect(jobs[1].result).toEqual(true);
    });

    it('suspend downstream in condition branch, then go on', async () => {
      const workflow = await WorkflowModel.create({
        title: 'condition workflow',
        enabled: true,
        type: 'afterCreate',
        config: {
          collection: 'posts'
        }
      });

      const n1 = await workflow.createNode({
        title: 'condition',
        type: 'condition',
        // no config means always true
      });

      const n2 = await workflow.createNode({
        title: 'manual',
        type: 'prompt',
        linkType: LINK_TYPE.ON_TRUE,
        upstream_id: n1.id
      });

      const n3 = await workflow.createNode({
        title: 'echo input value',
        type: 'echo',
        upstream_id: n1.id
      });

      await n1.setDownstream(n3);

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.STARTED);

      const [pending] = await execution.getJobs({ node_id: n2.id });
      pending.set('result', 123);
      await execution.resume(pending);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(3);
    });
  });
});
