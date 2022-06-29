import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '..';
import { EXECUTION_STATUS, JOB_STATUS } from '../../constants';



describe('workflow > instructions > delay', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts'
      }
    });
  });

  afterEach(() => app.stop());

  describe('runtime', () => {
    it('delay to resolved', async () => {
      const n1 = await workflow.createNode({
        type: 'delay',
        config: {
          duration: 1000,
          endStatus: JOB_STATUS.RESOLVED
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      await sleep(2000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
    });

    it('delay to reject', async () => {
      const n1 = await workflow.createNode({
        type: 'delay',
        config: {
          duration: 1000,
          endStatus: JOB_STATUS.REJECTED
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      await sleep(2000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toEqual(EXECUTION_STATUS.REJECTED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.REJECTED);
    });
  });

  describe('app lifecycle', () => {
    beforeEach(async () => {
      await workflow.createNode({
        type: 'delay',
        config: {
          duration: 2000,
          endStatus: JOB_STATUS.RESOLVED
        }
      });
    });

    it('restart app should trigger delayed job', async () => {
      const post = await PostRepo.create({ values: { title: 't1' } });

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      await app.stop();
      await sleep(500);

      await app.start();
      await sleep(2000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
    });

    it('restart app should trigger missed delayed job', async () => {
      const post = await PostRepo.create({ values: { title: 't1' } });

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      await app.stop();
      await sleep(2000);

      await app.start();
      await sleep(500);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const [j2] = await e2.getJobs();
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
    });
  });
});
