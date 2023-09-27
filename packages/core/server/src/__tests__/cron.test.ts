import { mockServer, MockServer, waitSecond } from '@nocobase/test';
import { CronJobsManager } from '../cron/cron-jobs-manager';

describe('cron service', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get cron job manager', async () => {
    const cron = app.getCron();
    expect(cron).toBeInstanceOf(CronJobsManager);
  });

  it('should get new cron instance when app reload', async () => {
    const cron1 = app.getCron();
    expect(cron1).toBeDefined();
    cron1.start();
    expect(cron1.started).toBeTruthy();
    await app.reload();
    expect(cron1.started).toBeFalsy();
    const cron2 = app.getCron();
    expect(cron2).toBeDefined();
    expect(cron1).not.toBe(cron2);
  });

  it('should add cron job', async () => {
    const cronManager = app.getCron();
    const jestFn = jest.fn();
    cronManager.addJob({
      time: '* * * * * *',
      onTick: jestFn,
    });

    expect(jestFn).not.toBeCalled();

    cronManager.start();
    await waitSecond(2000);
    expect(jestFn).toBeCalledTimes(2);
  });
});
