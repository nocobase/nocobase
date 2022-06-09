import { MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { getApp } from '.';



describe('workflow > workflow', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let PostModel;
  let PostRepo;
  let WorkflowModel;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
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

  describe('revisions', () => {
    it('executed count', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts'
        }
      });
      expect(w1.current).toBe(true);

      const { body, status } = await agent.resource(`workflows`).revision({
        filterByTk: w1.id
      });

      expect(status).toBe(200);
      const { data: w2 } = body;
      expect(w2.config).toMatchObject(w1.config);
      expect(w2.key).toBe(w1.key);

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await WorkflowModel.update({
        enabled: true
      }, {
        where: {
          id: w2.id
        },
        individualHooks: true
      });

      const [w1next, w2next] = await WorkflowModel.findAll({
        order: [['id', 'ASC']]
      });

      expect(w1next.enabled).toBe(false);
      expect(w1next.current).toBe(false);
      expect(w2next.enabled).toBe(true);
      expect(w2next.current).toBe(true);

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      const [e1] = await w1next.getExecutions();
      const [e2] = await w2next.getExecutions();
      expect(e1.key).toBe(e2.key);
      expect(e1.workflowId).toBe(w1.id);
      expect(e2.workflowId).toBe(w2.id);
    });
  });
});
