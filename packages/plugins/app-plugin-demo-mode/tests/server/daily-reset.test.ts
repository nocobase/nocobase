import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterEach, expect, it } from 'vitest';

import { demoConfigurationRuntimeToken } from '../../server/configuration/runtime-token.js';
import { DEMO_DATA_RESET_JOB } from '../../server/providers/demo-data.js';
import { demoDataToken } from '../../server/tokens.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

let app: TestApp;
afterEach(async () => app?.close());

async function setup(env: Record<string, string> = {}) {
  app = await createTestApp({
    createServer: createStandaloneServer,
    server: { env },
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
    .toEqual({ cron: '0 3 * * *', tz: 'UTC' });
});

it('uses the environment schedule independently of the last generated language', async () => {
  const { config, data, rule } = await setup({
    NOCOBASE_DEMO_RESET_HOUR: '4',
    NOCOBASE_DEMO_RESET_MINUTE: '30',
    NOCOBASE_DEMO_RESET_TIMEZONE: 'Asia/Shanghai',
    NOCOBASE_DEMO_RESET_LANGUAGE: 'en-US',
  });
  await data.importNow('1', 'zh-CN');
  await data.whenIdle();
  expect((await rule())?.options).toEqual({
    cron: '30 4 * * *',
    tz: 'Asia/Shanghai',
  });
  expect((await config.read()).schedule).toEqual({
    enabled: true,
    hour: 4,
    minute: 30,
    timezone: 'Asia/Shanghai',
    language: 'en-US',
  });
});
