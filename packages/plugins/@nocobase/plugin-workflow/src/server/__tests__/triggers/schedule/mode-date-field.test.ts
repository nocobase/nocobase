/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import dayjs from 'dayjs';
import { vi } from 'vitest';
import PluginWorkflowServer from '../../../Plugin';
import { SCHEDULE_MODE } from '../../../triggers/ScheduleTrigger/utils';

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
            unit: 1000,
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
            unit: 1000,
          },
        },
      });

      const now = await sleepToEvenSecond();

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(3000);
      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });

    it('starts on date field without timezone', async () => {
      const postsCollection = db.getCollection('posts');
      postsCollection.addField('date', {
        type: 'datetimeNoTz',
      });
      await db.sync();
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'date',
          },
        },
      });

      await sleepToEvenSecond();
      const startTime = new Date();
      startTime.setMilliseconds(0);

      const post = await PostRepo.create({
        values: { title: 't1', date: dayjs(startTime).format('YYYY-MM-DD HH:mm:ss') },
      });

      await sleep(2000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      const d0 = Date.parse(executions[0].context.date);
      expect(d0).toBe(startTime.getTime());
    });

    it('starts on post.createdAt with offset in hours', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'schedule',
        config: {
          mode: 1,
          collection: 'posts',
          startsOn: {
            field: 'createdAt',
            offset: 1,
            unit: 3600_000,
          },
          repeat: 3000,
          limit: 2,
        },
      });

      const now = await sleepToEvenSecond();

      const before = new Date();
      before.setHours(before.getHours() - 2);
      before.setSeconds(before.getSeconds() + 2);

      const post = await PostRepo.create({ values: { title: 't1', createdAt: before } });

      await sleep(3000);
      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(1);

      await sleep(3000);
      const e2s = await workflow.getExecutions();
      expect(e2s.length).toBe(2);
      expect(e2s[0].context.data.id).toBe(post.id);

      // const triggerTime = new Date(post.createdAt.getTime() + 2000);
      // triggerTime.setMilliseconds(0);
      // expect(e2s[0].context.date).toBe(triggerTime.toISOString());
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

    it('starts on post.createdAt and repeat by cron with endsOn by collection field but no field configured', async () => {
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
          endsOn: {},
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(5000);

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
            unit: 1000,
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
            unit: 1000,
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
            unit: 1000,
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
            unit: 1000,
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

    it('empty endsOn as no end', async () => {
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
          endsOn: {},
        },
      });

      await sleepToEvenSecond();

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(1700);

      const e1c = await workflow.countExecutions();
      expect(e1c).toBe(2);
    });
  });

  describe('status', () => {
    it('toggle off', async () => {
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

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(1500);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      expect(executions[0].context.data.id).toBe(p1.id);
      const triggerTime = new Date(p1.createdAt);
      triggerTime.setMilliseconds(0);
      expect(executions[0].context.date).toBe(triggerTime.toISOString());

      await workflow.update({ enabled: false });

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(1500);

      const e2s = await workflow.getExecutions({ order: [['createdAt', 'ASC']] });
      expect(e2s.length).toBe(1);
    });
  });

  describe('record', () => {
    it('record deleted after first triggered', async () => {
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
        },
      });

      const now = await sleepToEvenSecond();

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(1300);

      const e1s = await workflow.getExecutions({ order: [['id', 'ASC']] });
      expect(e1s.length).toBe(1);
      expect(e1s[0].context.data.id).toBe(p1.id);
      const triggerTime = new Date(p1.createdAt);
      triggerTime.setMilliseconds(0);
      expect(e1s[0].context.date).toBe(triggerTime.toISOString());

      await p1.destroy();

      await sleep(1500);

      const e2s = await workflow.getExecutions({ order: [['id', 'ASC']] });
      expect(e2s.length).toBe(1);
    });
  });

  describe('data source readiness', () => {
    it('toggling workflow when target data source is missing should not throw', async () => {
      const workflowPlugin = app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
      const scheduleTrigger = workflowPlugin.triggers.get('schedule') as any;
      const dateFieldTrigger = scheduleTrigger['modes'].get(SCHEDULE_MODE.DATE_FIELD);
      const inspectSpy = vi.spyOn(dateFieldTrigger, 'inspect').mockResolvedValue(undefined);

      const anotherDataSource = app.dataSourceManager.dataSources.get('another');
      expect(anotherDataSource).toBeDefined();
      app.dataSourceManager.dataSources.delete('another');

      try {
        const workflow = await WorkflowModel.create({
          enabled: true,
          type: 'schedule',
          config: {
            mode: SCHEDULE_MODE.DATE_FIELD,
            collection: 'another:posts',
            startsOn: {
              field: 'createdAt',
            },
          },
        });

        await expect(workflow.update({ enabled: false })).resolves.toMatchObject({ enabled: false });
      } finally {
        inspectSpy.mockRestore();
        if (anotherDataSource) {
          app.dataSourceManager.dataSources.set('another', anotherDataSource);
        }
      }
    });
  });
});
