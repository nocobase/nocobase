import { vi } from 'vitest';
import { mockServer, MockServer, waitSecond } from '@nocobase/test';
import { CronJobManager } from '../cron/cron-job-manager';

describe('cron service', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get cron job manager', async () => {
    const cron = app.cronJobManager;
    expect(cron).toBeInstanceOf(CronJobManager);
  });

  it('should get new cron instance when app reload', async () => {
    const cron1 = app.cronJobManager;
    expect(cron1).toBeDefined();
    cron1.start();
    expect(cron1.started).toBeTruthy();
    await app.reload();
    expect(cron1.started).toBeFalsy();
    const cron2 = app.cronJobManager;
    expect(cron2).toBeDefined();
    expect(cron1).not.toBe(cron2);
  });

  it('should add cron job', async () => {
    const cronManager = app.cronJobManager;
    const jestFn = vi.fn();
    cronManager.addJob({
      cronTime: '* * * * * *',
      onTick: jestFn,
    });

    expect(jestFn).not.toBeCalled();

    cronManager.start();
    await waitSecond(2000);
    expect(jestFn).toBeCalledTimes(2);
  });

  it('should remove cron job', async () => {
    const cronManager = app.cronJobManager;
    const jestFn = vi.fn();
    const job = cronManager.addJob({
      cronTime: '* * * * * *',
      onTick: jestFn,
    });

    expect(cronManager.jobs.size).toBe(1);
    cronManager.removeJob(job);
    expect(cronManager.jobs.size).toBe(0);
  });
});
