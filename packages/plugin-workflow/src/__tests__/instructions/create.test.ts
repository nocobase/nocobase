import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp } from '..';



describe('workflow > instructions > create', () => {
  let app: Application;
  let db: Database;
  let PostModel;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostModel = db.getCollection('posts').model;

    workflow = await WorkflowModel.create({
      title: 'test workflow',
      enabled: true,
      type: 'model',
      config: {
        mode: 1,
        collection: 'posts'
      }
    });
  });

  afterEach(() => db.close());

  describe('create one', () => {
    it('params: from context', async () => {
      const n1 = await workflow.createNode({
        type: 'create',
        config: {
          collection: 'approvals',
          params: {
            values: {
              postId: '{{$context.data.id}}'
            }
          }
        }
      });

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      await execution.prepare({}, true);
      const [job] = await execution.getJobs();
      expect(job.result.postId).toBe(post.id);
    });
  });
});
