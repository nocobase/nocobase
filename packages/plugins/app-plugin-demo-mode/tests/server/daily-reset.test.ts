import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterEach, expect, it } from 'vitest';

import { demoConfigurationRuntimeToken } from '../../server/configuration/runtime-token.js';
import { DEMO_DATA_RESET_JOB } from '../../server/providers/demo-data.js';
import { demoDataToken } from '../../server/tokens.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

let app: TestApp;
afterEach(async () => app?.close());

async function setup() {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: true } },
  });
  const container = app.application.container;
  const data = container.resolve(demoDataToken);
  data.register({
    id: 'test',
    languages: ['en-US', 'zh-CN'],
    timeZone: (language) =>
      language === 'zh-CN' ? 'Asia/Shanghai' : 'America/New_York',
    accounts: () => [],
    steps: () => [],
    clear: async () => {},
  });
  const rule = () =>
    container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor('@nocobase/app-plugin-demo-mode')
      .getJob(DEMO_DATA_RESET_JOB);
  return {
    config: container.resolve(demoConfigurationRuntimeToken),
    data,
    rule,
  };
}

it('schedules the default reset for a dataset registered after the plugin is ready', async () => {
  const { rule } = await setup();
  await expect
    .poll(async () => (await rule())?.options)
    .toEqual({ cron: '0 3 * * *', tz: 'America/New_York' });
});

it('fires once a day at the configured local time instead of every minute', async () => {
  const { config, rule } = await setup();
  const schedule = {
    enabled: true,
    hour: 4,
    minute: 30,
    timezone: 'Asia/Shanghai',
    language: 'en-US',
  };
  await config.save('schedule', 0, schedule);
  expect((await rule())?.options).toEqual({
    cron: '30 4 * * *',
    tz: 'Asia/Shanghai',
  });
  await config.save('schedule', 1, { ...schedule, enabled: false });
  expect(await rule()).toBeUndefined();
});

it('follows the default schedule into the language the data was generated in', async () => {
  const { data, rule } = await setup();
  await data.importNow('1', 'zh-CN');
  await data.whenIdle();
  await expect
    .poll(async () => (await rule())?.options)
    .toEqual({
      cron: '0 3 * * *',
      tz: 'Asia/Shanghai',
    });
});
