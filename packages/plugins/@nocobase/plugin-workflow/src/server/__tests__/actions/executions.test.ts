import { MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_STATUS } from '../../constants';

describe('workflow > actions > executions', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
  });

  afterEach(async () => await app.destroy());

  describe('destroy', () => {
    it('completed execution could be deleted', async () => {
      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.RESOLVED);

      await agent.resource('executions').destroy({
        filter: {
          key: workflow.key,
        },
      });

      const e2 = await workflow.getExecutions();
      expect(e2.length).toBe(0);
    });

    it('started execution could not be deleted', async () => {
      await workflow.createNode({
        type: 'pending',
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.STARTED);

      await agent.resource('executions').destroy({
        filter: {
          key: workflow.key,
        },
      });

      const e2 = await workflow.getExecutions();
      expect(e2.length).toBe(1);
    });
  });
});
