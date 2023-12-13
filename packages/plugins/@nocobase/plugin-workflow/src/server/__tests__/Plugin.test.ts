import { MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_STATUS } from '../constants';

describe('workflow > Plugin', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let WorkflowModel;

  beforeEach(async () => {
    app = await getApp();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
  });

  afterEach(() => app.destroy());

  describe('create', () => {
    it('create with enabled', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      expect(workflow.current).toBe(true);
    });

    it('create with disabled', async () => {
      const workflow = await WorkflowModel.create({
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      expect(workflow.current).toBe(true);
    });
  });

  describe('update', () => {
    it('toggle on', async () => {
      const workflow = await WorkflowModel.create({
        enabled: false,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });
      expect(workflow.current).toBe(true);

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const count = await workflow.countExecutions();
      expect(count).toBe(0);

      await workflow.update({ enabled: true });
      expect(workflow.current).toBe(true);

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
    });

    it('toggle off', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });
      expect(workflow.current).toBe(true);

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const c1 = await workflow.countExecutions();
      expect(c1).toBe(1);

      await workflow.update({ enabled: false });
      expect(workflow.current).toBe(true);

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const c2 = await workflow.countExecutions();
      expect(c2).toBe(1);
    });

    it('toggle off then on', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const c1 = await workflow.countExecutions();
      expect(c1).toBe(1);

      await workflow.update({
        enabled: false,
      });
      expect(workflow.current).toBe(true);

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const c2 = await workflow.countExecutions();
      expect(c2).toBe(1);

      await workflow.update({
        enabled: true,
      });
      expect(workflow.current).toBe(true);

      const p3 = await PostRepo.create({ values: { title: 't3' } });

      await sleep(500);

      const c3 = await workflow.countExecutions();
      expect(c3).toBe(2);
    });

    it('update config', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const c1 = await workflow.countExecutions();
      expect(c1).toBe(1);

      await workflow.update({
        config: {
          mode: 1,
          collection: 'tags',
        },
      });

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const c2 = await workflow.countExecutions();
      expect(c2).toBe(1);
    });
  });

  describe('destroy', () => {
    it('destroyed workflow will not be trigger any more', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'update',
        config: {
          collection: 'posts',
          params: {
            filter: {
              id: '{{$context.data.id}}',
            },
            values: {
              title: 't2',
            },
          },
        },
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const { model: JobModel } = db.getCollection('jobs');

      const e1c = await workflow.countExecutions();
      expect(e1c).toBe(1);
      const j1c = await JobModel.count();
      expect(j1c).toBe(1);
      const p1 = await PostRepo.findOne();
      expect(p1.title).toBe('t2');

      await workflow.destroy();

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const p2c = await PostRepo.count({ filter: { title: 't1' } });
      expect(p2c).toBe(1);
    });
  });

  describe('cycling trigger', () => {
    it('trigger should not be triggered more than once in same execution', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'create',
        config: {
          collection: 'posts',
          params: {
            values: {
              title: 't2',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const posts = await PostRepo.find();
      expect(posts.length).toBe(2);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);

      // NOTE: second trigger to ensure no skipped event
      const p3 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const posts2 = await PostRepo.find();
      expect(posts2.length).toBe(4);

      const [execution2] = await workflow.getExecutions({ order: [['createdAt', 'DESC']] });
      expect(execution2.status).toBe(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('dispatcher', () => {
    it('multiple triggers in same event', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const w3 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(1000);

      const [e1] = await w1.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);

      const [e2] = await w2.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);

      const [e3] = await w3.getExecutions();
      expect(e3.status).toBe(EXECUTION_STATUS.RESOLVED);
    });

    it('multiple events on same workflow', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });
      const p2 = await PostRepo.create({ values: { title: 't2' } });
      const p3 = await PostRepo.create({ values: { title: 't3' } });

      await sleep(1000);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(3);
      expect(executions.map((item) => item.status)).toEqual(Array(3).fill(EXECUTION_STATUS.RESOLVED));
    });

    it('when server starts, process all created executions', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      await app.stop();

      await db.reconnect();

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      const ExecutionModel = db.getCollection('executions').model;
      const e1 = await ExecutionModel.create({
        workflowId: w1.id,
        key: w1.key,
        useTransaction: w1.useTransaction,
        context: {
          data: p1.get(),
        },
      });

      await app.start();

      await sleep(500);

      await e1.reload();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);

      await w1.update({ enabled: false });

      await app.stop();

      await db.reconnect();

      const e2 = await ExecutionModel.create({
        workflowId: w1.id,
        key: w1.key,
        useTransaction: w1.useTransaction,
        context: {
          data: p1.get(),
        },
      });

      await app.start();

      await sleep(500);

      await e2.reload();
      expect(e2.status).toBe(EXECUTION_STATUS.QUEUEING);
    });
  });

  describe('options.deleteExecutionOnStatus', () => {
    it('no configured should not be deleted', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(1);
    });

    it('status on started should not be deleted', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        options: {
          deleteExecutionOnStatus: [EXECUTION_STATUS.STARTED],
        },
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      await w1.createNode({
        type: 'pending',
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].status).toBe(EXECUTION_STATUS.STARTED);
    });

    it('configured resolved status should be deleted', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        options: {
          deleteExecutionOnStatus: [EXECUTION_STATUS.RESOLVED],
        },
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(0);
    });

    it('configured error status should be deleted', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        options: {
          deleteExecutionOnStatus: [EXECUTION_STATUS.ERROR],
        },
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      await w1.createNode({
        type: 'error',
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(0);
    });
  });
});
