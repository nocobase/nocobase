import { Application } from '@nocobase/server';
import Database, { Model, ModelCtor } from '@nocobase/database';
import { getApp } from '..';
import { WorkflowModel } from '../../models/Workflow';
import { EXECUTION_STATUS, JOB_STATUS } from '../../constants';



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
        // (1 === 1): true
        config: {
          calculator: 'equal',
          operands: [{ value: 1 }, { value: 1 }]
        }
      });

      await workflow.createNode({
        title: 'true to echo',
        type: 'echo',
        when: true,
        upstream_id: n1.id
      });

      await workflow.createNode({
        title: 'false to echo',
        type: 'echo',
        when: false,
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
        // (0 === 1): false
        config: {
          calculator: 'equal',
          operands: [{ value: 0 }, { value: 1 }]
        }
      });

      await workflow.createNode({
        title: 'true to echo',
        type: 'echo',
        when: true,
        upstream_id: n1.id
      });

      await workflow.createNode({
        title: 'false to echo',
        type: 'echo',
        when: false,
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
});
