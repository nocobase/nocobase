import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp } from '.';
import { EXECUTION_STATUS } from '../constants';



describe('workflow > workflow', () => {
  let app: Application;
  let db: Database;
  let PostModel;
  let PostRepo;
  let WorkflowModel;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostModel = db.getCollection('posts').model;
    PostRepo = db.getCollection('posts').repository;
  });

  afterEach(() => db.close());

  describe('toggle', () => {
    it('toggle after update', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts'
        }
      });

      await workflow.update({ enabled: false });
      const post = await PostRepo.create({ values: { title: 't1' } });

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });
  });
});
