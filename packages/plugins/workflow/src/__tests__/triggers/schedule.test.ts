import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '..';



describe.skip('workflow > triggers > schedule', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let WorkflowRepo;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    const workflow = db.getCollection('workflows');
    WorkflowModel = workflow.model;
    WorkflowRepo = workflow.repository;
    PostRepo = db.getCollection('posts').repository;
  });

  afterEach(() => app.destroy());

  describe('constant mode', () => {
    it('no repeat configurated', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 0
        }
      });

      await sleep(3000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });

    it('on every 2 seconds', async () => {
      const now = new Date();
      // NOTE: align to even(0, 2, ...) + 0.5 seconds to start
      await sleep((2.5 - now.getSeconds() % 2) * 1000 - now.getMilliseconds());

      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 0,
          repeat: '*/2 * * * * *',
        }
      });

      await sleep(4000);
      // sleep 1.5s at 2s trigger 1st time
      // sleep 3.5s at 4s trigger 2nd time

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(2);
    });

    it('on every even seconds and limit 1', async () => {
      const now = new Date();
      // NOTE: align to even(0, 2, ...) + 0.5 seconds to start
      await sleep((2.5 - now.getSeconds() % 2) * 1000 - now.getMilliseconds());

      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 0,
          repeat: '*/2 * * * * *',
          limit: 1
        }
      });

      await sleep(5000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
    });

    it('on every 2 seconds after created and limit 1', async () => {
      const now = new Date();
      // NOTE: align to even(0, 2, ...) + 0.5 seconds to start
      await sleep((2.5 - now.getSeconds() % 2) * 1000 - now.getMilliseconds());

      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 0,
          repeat: 2000,
          limit: 1
        }
      });

      await sleep(5000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
    });

    it('on certain second', async () => {
      const now = new Date();
      now.setSeconds(now.getSeconds() + 3);
      now.setMilliseconds(0);

      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 0,
          repeat: `${now.getSeconds()} * * * * *`,
        }
      });

      await sleep(5000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].context.date).toBe(now.toISOString());
    });

    it('multiple workflows trigger at same time', async () => {
      const now = new Date();
      now.setSeconds(now.getSeconds() + 2);
      now.setMilliseconds(0);

      let w1, w2;
      await db.sequelize.transaction(async (transaction) => {
        w1 = await WorkflowRepo.create({
          values: {
            enabled: true,
            type: 'schedule',
            config: {
              mode: 0,
              repeat: `${now.getSeconds()} * * * * *`,
            }
          },
          transaction
        });
      });

      await db.sequelize.transaction(async (transaction) => {
        w2 = await WorkflowRepo.create({
          values: {
            enabled: true,
            type: 'schedule',
            config: {
              mode: 0,
              repeat: `${now.getSeconds()} * * * * *`,
            }
          },
          transaction
        });
      });

      await sleep(3000);
      await WorkflowModel.update({ enabled: false }, { where: { enabled: true } });

      const [e1] = await w1.getExecutions();
      expect(e1).toBeDefined();
      expect(e1.context.date).toBe(now.toISOString());

      const [e2] = await w2.getExecutions();
      expect(e2).toBeDefined();
      expect(e2.context.date).toBe(now.toISOString());
    });
  });

  describe('collection field mode', () => {
    it('starts on post.createdAt with offset', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
            offset: 2
          }
        }
      });

      const now = new Date();
      await sleep((2.5 - now.getSeconds() % 2) * 1000 - now.getMilliseconds());

      const post = await PostRepo.create({ values: { title: 't1' }});

      await sleep(1000);
      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);

      await sleep(2000);
      const [execution] = await workflow.getExecutions();
      expect(execution).toBeDefined();
      expect(execution.context.data.id).toBe(post.id);

      const triggerTime = new Date(post.createdAt.getTime() + 2000);
      triggerTime.setMilliseconds(0);
      expect(execution.context.date).toBe(triggerTime.toISOString());
    });

    it('starts on post.createdAt and repeat', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt'
          },
          repeat: '*/2 * * * * *'
        }
      });

      const now = new Date();
      await sleep((2.5 - now.getSeconds() % 2) * 1000 - now.getMilliseconds());
      const startTime = new Date();
      startTime.setMilliseconds(500);

      const post = await PostRepo.create({ values: { title: 't1' }});

      await sleep(5000);
      // sleep 1.5s at 2s trigger 1st time
      // sleep 3.5s at 4s trigger 2nd time

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(2);
      const d1 = Date.parse(executions[0].context.date);
      expect(d1 - 1500).toBe(startTime.getTime());
      const d2 = Date.parse(executions[1].context.date);
      expect(d2 - 3500).toBe(startTime.getTime());
    });

    it('starts on post.createdAt and repeat with endsOn at certain time', async () => {
      const now = new Date();
      await sleep((2.5 - now.getSeconds() % 2) * 1000 - now.getMilliseconds());
      const startTime = new Date();
      startTime.setMilliseconds(500);

      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt'
          },
          repeat: '*/2 * * * * *',
          endsOn: new Date(startTime.getTime() + 2500).toISOString()
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' }});

      await sleep(5000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      const d1 = Date.parse(executions[0].context.date);
      expect(d1 - 1500).toBe(startTime.getTime());
    });

    it('starts on post.createdAt and repeat with endsOn by offset', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt'
          },
          repeat: '*/2 * * * * *',
          endsOn: {
            field: 'createdAt',
            offset: 3
          }
        }
      });

      const now = new Date();
      await sleep((2.5 - now.getSeconds() % 2) * 1000 - now.getMilliseconds());
      const startTime = new Date();
      startTime.setMilliseconds(500);

      const post = await PostRepo.create({ values: { title: 't1' }});

      await sleep(5000);
      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      const d1 = Date.parse(executions[0].context.date);
      expect(d1 - 1500).toBe(startTime.getTime());
    });

    it('starts on post.createdAt and repeat by number', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt'
          },
          repeat: 2000,
          endsOn: {
            field: 'createdAt',
            offset: 3
          }
        }
      });

      const now = new Date();
      await sleep((2.5 - now.getSeconds() % 2) * 1000 - now.getMilliseconds());
      const startTime = new Date();
      startTime.setMilliseconds(500);

      const post = await PostRepo.create({ values: { title: 't1' }});

      await sleep(5000);
      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      const d1 = Date.parse(executions[0].context.date);
      expect(d1 - 1500).toBe(startTime.getTime());
    });
  });
});
