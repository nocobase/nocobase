import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp } from '.';



describe('workflow > workflow', () => {
  let app: Application;
  let db: Database;
  let PostModel;
  let WorkflowModel;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostModel = db.getCollection('posts').model;
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

      const { hooks } = PostModel.options;
      expect(hooks.afterCreate.length).toBe(1);

      await workflow.update({
        config: {
          mode: 2,
          collection: 'posts'
        }
      });
      expect(hooks.afterCreate.length).toBe(0);
      expect(hooks.afterUpdate.length).toBe(1);

      await workflow.update({
        config: {
          mode: 7,
          collection: 'posts'
        }
      });
      expect(hooks.afterCreate.length).toBe(1);
      expect(hooks.afterUpdate.length).toBe(1);
      expect(hooks.afterDestroy.length).toBe(1);

      await workflow.update({
        enabled: false
      });
      expect(hooks.afterCreate.length).toBe(0);
      expect(hooks.afterUpdate.length).toBe(0);
      expect(hooks.afterDestroy.length).toBe(0);

      await workflow.update({
        enabled: true
      });
      expect(hooks.afterCreate.length).toBe(1);
      expect(hooks.afterUpdate.length).toBe(1);
      expect(hooks.afterDestroy.length).toBe(1);
    });
  });
});
