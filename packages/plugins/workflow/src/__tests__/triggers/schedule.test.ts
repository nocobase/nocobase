import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '..';
import { EXECUTION_STATUS } from '../../constants';



describe('workflow > triggers > schedule', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
  });

  afterEach(() => db.close());

  describe('cron', () => {
    it('on every 2 seconds', async () => {
      const now = new Date();
      // NOTE: align to even(0, 2, ...) + 0.5 seconds to start
      await sleep((2.5 - now.getSeconds() % 2) * 1000 - now.getMilliseconds());

      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          cron: '*/2 * * * * *',
        }
      });
      // after create at 0.5s immediately trigger 1st time

      await sleep(4000);
      // sleep 1.5s at 2s trigger 2nd time
      // sleep 3.5s at 4s trigger 3rd time

      // stop by disabled
      await workflow.update({ enabled: false });

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(3);
    });

    it('on certain second', async () => {
      const now = new Date();
      now.setSeconds(now.getSeconds() + 3);
      now.setMilliseconds(0);

      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          cron: `${now.getSeconds()} * * * * *`,
        }
      });

      await sleep(5000);

      await workflow.update({ enabled: false });

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].context.date).toBe(now.toISOString());
    });

    it('multiple workflows', async () => {
      const now = new Date();
      now.setSeconds(now.getSeconds() + 2);
      now.setMilliseconds(0);

      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          cron: `${now.getSeconds()} * * * * *`,
        }
      });

      const w2 = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          cron: `${now.getSeconds()} * * * * *`,
        }
      });

      await sleep(3000);
      await w1.update({ enabled: false });
      await w2.update({ enabled: false });

      const [e1] = await w1.getExecutions();
      expect(e1).toBeDefined();
      expect(e1.context.date).toBe(now.toISOString());

      const [e2] = await w1.getExecutions();
      expect(e2).toBeDefined();
      expect(e2.context.date).toBe(now.toISOString());
    });
  });
});
