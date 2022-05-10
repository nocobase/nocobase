import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp } from '..';



describe('workflow > instructions > update', () => {
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
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts'
      }
    });
  });

  afterEach(() => db.close());

  describe('update one', () => {
    it('params: from context', async () => {
      const n2 = await workflow.createNode({
        type: 'update',
        config: {
          collection: 'posts',
          params: {
            filter: {
              id: '{{$context.data.id}}'
            },
            values: {
              published: true
            }
          }
        }
      });

      const post = await PostModel.create({ title: 't1' });
      expect(post.published).toBe(false);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.published).toBe(true);

      const updatedPost = await PostModel.findByPk(post.id);
      expect(updatedPost.published).toBe(true);
    });
  });
});
