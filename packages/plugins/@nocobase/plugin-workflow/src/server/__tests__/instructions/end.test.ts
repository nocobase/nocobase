import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import WorkflowPlugin from '../..';
import { EXECUTION_STATUS, JOB_STATUS } from '../../constants';

describe('workflow > instructions > end', () => {
  let app: Application;
  let db: Database;
  let plugin: WorkflowPlugin;
  let PostRepo;
  let workflow;

  beforeEach(async () => {
    app = await getApp();
    plugin = app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    db = app.db;
    PostRepo = db.getCollection('posts').repository;

    const WorkflowModel = db.getCollection('workflows').model;
    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'syncTrigger',
    });
  });

  afterEach(() => app.destroy());

  describe('end status', () => {
    it('succeeded', async () => {
      const n1 = await workflow.createNode({
        type: 'end',
        config: {
          endStatus: JOB_STATUS.RESOLVED,
        },
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      await plugin.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs();
      expect(jobs.length).toBe(1);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
    });

    it('failed', async () => {
      const n1 = await workflow.createNode({
        type: 'end',
        config: {
          endStatus: JOB_STATUS.FAILED,
        },
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      await plugin.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.FAILED);
      const jobs = await execution.getJobs();
      expect(jobs.length).toBe(1);
      expect(jobs[0].status).toBe(JOB_STATUS.FAILED);
    });
  });
});
