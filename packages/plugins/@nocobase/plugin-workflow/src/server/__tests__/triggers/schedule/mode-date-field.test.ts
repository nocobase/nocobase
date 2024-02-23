import { MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

async function sleepToEvenSecond() {
  const now = new Date();
  // NOTE: align to even(0, 2, ...) + 0.5 seconds to start
  await sleep((2.5 - (now.getSeconds() % 2)) * 1000 - now.getMilliseconds());
  return now;
}

describe('workflow > triggers > schedule > date field mode', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let CategoryRepo;
  let WorkflowModel;
  let WorkflowRepo;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    const workflow = db.getCollection('workflows');
    WorkflowModel = workflow.model;
    WorkflowRepo = workflow.repository;
    PostRepo = db.getCollection('posts').repository;
    CategoryRepo = db.getCollection('categories').repository;
  });

  afterEach(() => app.destroy());

  describe('configuration', () => {
    it('starts on post.createdAt', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
          },
        },
      });

      const now = await sleepToEvenSecond();

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(2000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].context.data.id).toBe(post.id);
      const triggerTime = new Date(post.createdAt);
      triggerTime.setMilliseconds(0);
      expect(executions[0].context.date).toBe(triggerTime.toISOString());
    });

    it('starts on post.createdAt with +offset', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
            offset: 2,
          },
        },
      });

      const now = await sleepToEvenSecond();

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(1000);
      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(0);

      await sleep(2000);
      const e2s = await workflow.getExecutions();
      expect(e2s.length).toBe(1);
      expect(e2s[0].context.data.id).toBe(post.id);

      const triggerTime = new Date(post.createdAt.getTime() + 2000);
      triggerTime.setMilliseconds(0);
      expect(e2s[0].context.date).toBe(triggerTime.toISOString());
    });

    it('starts on post.createdAt with -offset', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
            offset: -2,
          },
        },
      });

      const now = await sleepToEvenSecond();

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(3000);
      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });

    it('starts on post.createdAt and repeat by cron', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
          },
          repeat: '*/2 * * * * *',
        },
      });

      await sleepToEvenSecond();
      const startTime = new Date();
      startTime.setMilliseconds(0);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(5000);
      // immediately trigger 1st time
      // sleep 1.5s at 2s trigger 2nd time
      // sleep 3.5s at 4s trigger 3rd time

      const executions = await workflow.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(executions.length).toBe(3);
      const d0 = Date.parse(executions[0].context.date);
      expect(d0).toBe(startTime.getTime());
      const d1 = Date.parse(executions[1].context.date);
      expect(d1 - 2000).toBe(startTime.getTime());
      const d2 = Date.parse(executions[2].context.date);
      expect(d2 - 4000).toBe(startTime.getTime());
    });

    it('starts on post.createdAt and repeat by cron with endsOn at certain time', async () => {
      await sleepToEvenSecond();
      const startTime = new Date();
      startTime.setMilliseconds(0);

      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
          },
          repeat: '*/2 * * * * *',
          endsOn: new Date(startTime.getTime() + 3000).toISOString(),
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(5000);

      const executions = await workflow.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(executions.length).toBe(2);
      const d0 = Date.parse(executions[0].context.date);
      expect(d0).toBe(startTime.getTime());
      const d1 = Date.parse(executions[1].context.date);
      expect(d1 - 2000).toBe(startTime.getTime());
    });

    it('starts on post.createdAt and repeat by cron with endsOn by offset', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
          },
          repeat: '*/2 * * * * *',
          endsOn: {
            field: 'createdAt',
            offset: 3,
          },
        },
      });

      await sleepToEvenSecond();
      const startTime = new Date();
      startTime.setMilliseconds(0);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(5000);

      const executions = await workflow.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(executions.length).toBe(2);
      const d0 = Date.parse(executions[0].context.date);
      expect(d0).toBe(startTime.getTime());
      const d1 = Date.parse(executions[1].context.date);
      expect(d1 - 2000).toBe(startTime.getTime());
    });

    it('starts on post.createdAt and repeat by cron and limit 1', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
          },
          repeat: '*/2 * * * * *',
          limit: 1,
        },
      });

      await sleepToEvenSecond();
      const startTime = new Date();
      startTime.setMilliseconds(0);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(5000);

      const executions = await workflow.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(executions.length).toBe(1);
      const d0 = Date.parse(executions[0].context.date);
      expect(d0).toBe(startTime.getTime());
    });

    it('starts on post.createdAt and repeat by cron and limit 2', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
          },
          repeat: '*/2 * * * * *',
          limit: 2,
        },
      });

      await sleepToEvenSecond();
      const startTime = new Date();
      startTime.setMilliseconds(0);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(5000);

      const executions = await workflow.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(executions.length).toBe(2);
      const d0 = Date.parse(executions[0].context.date);
      expect(d0).toBe(startTime.getTime());
      const d1 = Date.parse(executions[1].context.date);
      expect(d1 - 2000).toBe(startTime.getTime());
    });

    it('starts on post.createdAt and repeat by number', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
          },
          repeat: 2000,
          endsOn: {
            field: 'createdAt',
            offset: 3,
          },
        },
      });

      await sleepToEvenSecond();
      const startTime = new Date();
      startTime.setMilliseconds(0);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(5000);
      const executions = await workflow.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(executions.length).toBe(2);
      const d0 = Date.parse(executions[0].context.date);
      expect(d0).toBe(startTime.getTime());
      const d1 = Date.parse(executions[1].context.date);
      expect(d1 - 2000).toBe(startTime.getTime());
    });

    it('appends', async () => {
      const category = await CategoryRepo.create({ values: { name: 'c1' } });

      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
            offset: 2,
          },
          appends: ['category'],
        },
      });

      const post = await PostRepo.create({ values: { title: 't1', categoryId: category.id } });

      await sleep(5000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].context.data.category.id).toBe(category.id);
    });

    it('on field changed', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
          },
          repeat: 1000,
          endsOn: {
            field: 'createdAt',
            offset: 3,
          },
        },
      });

      await sleepToEvenSecond();

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(1700);

      console.log('check executions');

      const e1c = await workflow.countExecutions();
      expect(e1c).toBe(2);

      await post.update({ createdAt: new Date(post.createdAt.getTime() - 1000) });

      await sleep(3000);

      const e2c = await workflow.countExecutions();
      expect(e2c).toBe(2);
    });
  });
});
