import { Application } from '@nocobase/server';
import Database, { Model, ModelCtor } from '@nocobase/database';
import { getApp } from '..';
import { WorkflowModel } from '../../models/Workflow';
import { EXECUTION_STATUS, JOB_STATUS, LINK_TYPE } from '../../constants';



describe('workflow > instructions > condition', () => {
  let app: Application;
  let db: Database;
  let PostModel: ModelCtor<Model>;
  let WorkflowModel: ModelCtor<WorkflowModel>;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getModel('workflows') as any;
    PostModel = db.getModel('posts');
  });

  afterEach(() => db.close());

  describe('config.rejectOnFalse', () => {

  });

  describe('single calculation', () => {
    it('calculation to true downstream', async () => {
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
        config: {
          // (1 === 1): true
          calculation: {
            calculator: 'equal',
            operands: [{ value: 1 }, { value: 1 }]
          }
        }
      });

      const n2 = await workflow.createNode({
        title: 'true to echo',
        type: 'echo',
        linkType: LINK_TYPE.ON_TRUE,
        upstream_id: n1.id
      });

      const n3 = await workflow.createNode({
        title: 'false to echo',
        type: 'echo',
        linkType: LINK_TYPE.ON_FALSE,
        upstream_id: n1.id
      });

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(2);
      expect(jobs[1].result).toEqual(true);
    });

    it('calculation to false downstream', async () => {
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
        config: {
          // (0 === 1): false
          calculation: {
            calculator: 'equal',
            operands: [{ value: 0 }, { value: 1 }]
          }
        }
      });

      await workflow.createNode({
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

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(2);
      expect(jobs[1].result).toEqual(false);
    });
  });

  describe('group calculation', () => {

  });
});
