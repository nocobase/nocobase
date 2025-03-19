/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { scryptSync } from 'crypto';
import { MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import Plugin from '../../..';

async function sleepToEvenSecond() {
  const now = new Date();
  // NOTE: align to even(0, 2, ...) + 0.5 seconds to start
  await sleep((2.5 - (now.getSeconds() % 2)) * 1000 - now.getMilliseconds());
  return now;
}

function consumeTime(n: number) {
  console.time('consumeTime');
  for (let i = 0; i < n; i++) {
    scryptSync(`${i}`, 'salt', 64);
  }
  console.timeEnd('consumeTime');
}

describe('workflow > triggers > schedule > static mode', () => {
  let app: MockServer;
  let db: Database;
  let plugin;
  let PostRepo;
  let CategoryRepo;
  let WorkflowRepo;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    plugin = app.pm.get('workflow') as Plugin;
    const workflow = db.getCollection('workflows');
    WorkflowRepo = workflow.repository;
    PostRepo = db.getCollection('posts').repository;
    CategoryRepo = db.getCollection('categories').repository;
  });

  afterEach(() => app.destroy());

  describe('configuration', () => {
    it('neither startsOn nor repeat configurated', async () => {
      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
          },
        },
      });

      await sleep(3000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });

    it('start on certain time and no repeat', async () => {
      await sleepToEvenSecond();

      const start = new Date();
      start.setMilliseconds(0);
      start.setSeconds(start.getSeconds() + 2);

      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: start.toISOString(),
          },
        },
      });

      await sleep(3000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
    });

    it('on every 2 seconds', async () => {
      const start = await sleepToEvenSecond();

      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: start.toISOString(),
            repeat: '*/2 * * * * *',
          },
        },
      });

      await sleep(4000);
      // sleep 1.5s at 2s trigger 1st time
      // sleep 3.5s at 4s trigger 2nd time

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(2);
    });

    it('on every even seconds and limit 1', async () => {
      const start = await sleepToEvenSecond();

      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: start.toISOString(),
            repeat: '*/2 * * * * *',
            limit: 1,
          },
        },
      });

      await sleep(5000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
    });

    it('start before now and repeat every 2 seconds after created and limit 1', async () => {
      await sleepToEvenSecond();
      const start = new Date();
      start.setMilliseconds(0);

      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: start.toISOString(),
            repeat: 2000,
            limit: 1,
          },
        },
      });

      await sleep(5000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      expect(new Date(executions[0].context.date).getTime()).toBe(start.getTime() + 2000);
    });

    it('repeat on cron certain second', async () => {
      const now = new Date();
      now.setMilliseconds(0);
      const startsOn = now.toISOString();
      now.setSeconds(now.getSeconds() + 3);

      await sleep(1500);

      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn,
            repeat: `${now.getSeconds()} * * * * *`,
          },
        },
      });

      await sleep(4000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(1);
      const date = new Date(executions[0].context.date);
      expect(date.getTime()).toBe(now.getTime());
    });

    it('no repeat triggered then update to repeat', async () => {
      const start = await sleepToEvenSecond();

      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: start.toISOString(),
          },
        },
      });

      await sleep(1000);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(0);

      await workflow.update({
        config: {
          ...workflow.config,
          repeat: 1000,
        },
      });

      console.log(new Date().toISOString());

      await sleep(3000);

      const e2s = await workflow.getExecutions();
      console.log(e2s);
      expect(e2s.length).toBe(2);
    });
  });

  describe('status', () => {
    it('should not trigger after turned off', async () => {
      const start = await sleepToEvenSecond();
      const future = new Date();
      future.setSeconds(future.getSeconds() + 2);

      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: future.toISOString(),
            repeat: 1000,
          },
        },
      });

      await sleep(1000);

      await workflow.update({ enabled: false });

      await sleep(3000);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });
  });

  describe('dispatch', () => {
    it('multiple workflows trigger at same time', async () => {
      const now = new Date();
      const startsOn = now.toISOString();
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
              startsOn,
              repeat: `${now.getSeconds()} * * * * *`,
            },
          },
          transaction,
        });

        w2 = await WorkflowRepo.create({
          values: {
            enabled: true,
            type: 'schedule',
            config: {
              mode: 0,
              startsOn,
              repeat: `${now.getSeconds()} * * * * *`,
            },
          },
          transaction,
        });
      });

      await sleep(3000);
      await WorkflowRepo.update({
        values: { enabled: false },
        filter: { enabled: true },
      });

      const [e1] = await w1.getExecutions();
      expect(e1).toBeDefined();
      const d1 = new Date(e1.context.date);
      d1.setMilliseconds(0);
      expect(d1.getTime()).toBe(now.getTime());

      const [e2] = await w2.getExecutions();
      expect(e2).toBeDefined();
      const d2 = new Date(e1.context.date);
      d2.setMilliseconds(0);
      expect(d2.getTime()).toBe(now.getTime());
    });

    it('missed non-repeated scheduled time should not be triggered', async () => {
      await sleepToEvenSecond();

      const start = new Date();
      start.setMilliseconds(0);
      start.setSeconds(start.getSeconds() + 2);

      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: start.toISOString(),
          },
        },
      });

      await app.stop();

      await sleep(3000);

      await app.start();

      await sleep(1000);

      const c1 = await workflow.countExecutions();
      expect(c1).toBe(0);
    });

    it('scheduled time on CPU heavy load should be triggered', async () => {
      await sleepToEvenSecond();

      const start = new Date();
      start.setMilliseconds(0);
      start.setSeconds(start.getSeconds() + 2);

      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: start.toISOString(),
          },
        },
      });

      await sleep(1000);

      const c1 = await workflow.countExecutions();
      expect(c1).toBe(0);

      consumeTime(100); // on AMD 5600G takes about 2.7s

      await sleep(2000);

      const c2 = await workflow.countExecutions();
      expect(c2).toBe(1);
    });
  });

  describe('duplications', () => {
    it('same workflow should not be triggered in same time more than once', async () => {
      await sleepToEvenSecond();

      const start = new Date();
      start.setMilliseconds(0);
      start.setSeconds(start.getSeconds() + 2);

      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: start.toISOString(),
          },
        },
      });

      const n1 = workflow.createNode({
        type: 'echo',
      });

      plugin.trigger(workflow, { date: start }, { eventKey: `${workflow.id}@${start.getTime()}` });

      await sleep(3000);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(1);
      const j1s = await e1s[0].getJobs();
      expect(j1s.length).toBe(1);
    });

    it('toggle same workflow on should not be triggered in same time more than once', async () => {
      await sleepToEvenSecond();

      const start = new Date();
      start.setMilliseconds(0);
      start.setSeconds(start.getSeconds() + 2);

      const workflow = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: start.toISOString(),
          },
        },
      });

      const n1 = workflow.createNode({
        type: 'echo',
      });

      const trigger = plugin.triggers.get(workflow.type);
      trigger.on(workflow);

      await sleep(3000);

      const e1s = await workflow.getExecutions();
      expect(e1s.length).toBe(1);
      const j1s = await e1s[0].getJobs();
      expect(j1s.length).toBe(1);
    });

    it('different workflows could trigger in same time but not duplicated for each', async () => {
      await sleepToEvenSecond();

      const start = new Date();
      start.setMilliseconds(0);
      start.setSeconds(start.getSeconds() + 2);

      const w1 = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: start.toISOString(),
          },
        },
      });

      const n1 = w1.createNode({
        type: 'echo',
      });

      const w2 = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'schedule',
          config: {
            mode: 0,
            startsOn: start.toISOString(),
          },
        },
      });

      const n2 = w2.createNode({
        type: 'echo',
      });

      plugin.trigger(w1, { date: start }, { eventKey: `${w1.id}@${start.getTime()}` });
      plugin.trigger(w2, { date: start }, { eventKey: `${w2.id}@${start.getTime()}` });

      await sleep(3000);

      const e1s = await w1.getExecutions();
      expect(e1s.length).toBe(1);
      const j1s = await e1s[0].getJobs();
      expect(j1s.length).toBe(1);

      const e2s = await w2.getExecutions();
      expect(e2s.length).toBe(1);
      const j2s = await e2s[0].getJobs();
      expect(j2s.length).toBe(1);
    });
  });
});
