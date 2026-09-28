import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import {
  scheduleExampleServiceToken,
  type ScheduleExampleService,
  type ScheduleExampleStatus,
} from '../server/service.js';

const STATUS: ScheduleExampleStatus = {
  scope: '@nocobase/app-plugin-schedule-example',
  job: 'heartbeat',
  every: 60_000,
  nextRunAt: '2030-01-01T00:01:00.000Z',
  runs: [],
};

function application(authentication: Auth): AppPluginApplication {
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  container.instance(scheduleExampleServiceToken, {
    status: async () => STATUS,
  } as unknown as ScheduleExampleService);
  return {
    appName: 'main',
    publicBasePath: '',
    config: {} as never,
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  };
}

describe('schedule example routes', () => {
  it('returns the heartbeat status to a signed-in user', async () => {
    const router = await apiRoutes.createRouter(
      application({
        required: () => async (_context, next) => next(),
      } as unknown as Auth),
    );

    const response = await router.request('/schedule-example');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(STATUS);
  });

  it('rejects anonymous requests', async () => {
    const router = await apiRoutes.createRouter(
      application({
        required: () => (context) =>
          context.json({ code: 'UNAUTHORIZED' }, 401),
      } as unknown as Auth),
    );

    const response = await router.request('/schedule-example');

    expect(response.status).toBe(401);
  });

  it('declares an API Route contribution', () => {
    expect(apiRoutes).toMatchObject({ scope: 'api' });
  });
});
