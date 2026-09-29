import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import {
  jobExampleServiceToken,
  type JobExampleService,
  type JobExampleStatus,
  type JobTask,
} from '../server/job/service.js';
import { apiRoutes } from '../server/routes/index.js';
import {
  ScheduleExampleError,
  scheduleExampleServiceToken,
  type ScheduleExampleService,
  type ScheduleExampleStatus,
} from '../server/schedule/service.js';

const SCOPE = '@nocobase/app-plugin-jobs-example';
const SCHEDULE: ScheduleExampleStatus = {
  scope: SCOPE,
  rules: [
    {
      name: 'heartbeat',
      builtIn: true,
      options: { every: 60_000 },
      state: 'active',
      nextRunAt: '2030-01-01T00:01:00.000Z',
      firings: 0,
      runs: [],
    },
  ],
};
const TASK: JobTask = {
  jobId: '1',
  status: 'queued',
  progress: 0,
  attempt: 0,
  createdAt: '2030-01-01T00:00:00.000Z',
  updatedAt: '2030-01-01T00:00:00.000Z',
};
const JOB: JobExampleStatus = { scope: SCOPE, job: 'progress', tasks: [TASK] };

const allow = {
  required: () => async (context, next) => {
    context.set('auth', { user: { id: 'user-1' } });
    await next();
  },
} as unknown as Auth;
const deny = {
  required: () => (context) => context.json({ code: 'UNAUTHORIZED' }, 401),
} as unknown as Auth;

function application(authentication: Auth) {
  const create = vi.fn(async () => TASK);
  const status = vi.fn(() => JOB);
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  const startRule = vi.fn(async (name: string) => {
    if (name === 'heartbeat')
      throw new ScheduleExampleError('BUILT_IN_RULE', 'built in');
    if (name === 'missing')
      throw new ScheduleExampleError('UNKNOWN_RULE', 'unknown');
  });
  const stopRule = vi.fn(async () => undefined);
  container.instance(scheduleExampleServiceToken, {
    status: async () => SCHEDULE,
    startRule,
    stopRule,
  } as unknown as ScheduleExampleService);
  container.instance(jobExampleServiceToken, {
    create,
    status,
  } as unknown as JobExampleService);
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: {} as never,
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  };
  return { app, create, status, startRule, stopRule };
}

describe('jobs example routes', () => {
  it('returns the heartbeat status to a signed-in user', async () => {
    const router = await apiRoutes.createRouter(application(allow).app);

    const response = await router.request('/jobs-example/schedule');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(SCHEDULE);
  });

  it('starts a rule with an optional interval and stops it', async () => {
    const { app, startRule, stopRule } = application(allow);
    const router = await apiRoutes.createRouter(app);

    const started = await router.request(
      '/jobs-example/schedule/interval/start',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ every: 10_000 }),
      },
    );
    const plain = await router.request('/jobs-example/schedule/cron/start', {
      method: 'POST',
    });
    const stopped = await router.request('/jobs-example/schedule/cron/stop', {
      method: 'POST',
    });

    expect([started.status, plain.status, stopped.status]).toEqual([
      204, 204, 204,
    ]);
    expect(startRule.mock.calls).toEqual([
      ['interval', 10_000],
      ['cron', undefined],
    ]);
    expect(stopRule).toHaveBeenCalledExactlyOnceWith('cron');
  });

  it('answers the rule requests the service refuses with 4xx', async () => {
    const { app, startRule } = application(allow);
    const router = await apiRoutes.createRouter(app);
    const post = (path: string, body?: unknown) =>
      router.request(path, {
        method: 'POST',
        ...(body === undefined
          ? {}
          : {
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(body),
            }),
      });

    expect((await post('/jobs-example/schedule/heartbeat/start')).status).toBe(
      400,
    );
    expect((await post('/jobs-example/schedule/missing/start')).status).toBe(
      404,
    );
    const invalid = await post('/jobs-example/schedule/interval/start', {
      every: '5s',
    });
    expect(invalid.status).toBe(400);
    expect(startRule).toHaveBeenCalledTimes(2);
  });

  it("returns the signed-in user's tasks", async () => {
    const { app, status } = application(allow);
    const router = await apiRoutes.createRouter(app);

    const response = await router.request('/jobs-example/job');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(JOB);
    expect(status).toHaveBeenCalledExactlyOnceWith('user-1');
  });

  it('creates a task for the signed-in user and answers 202', async () => {
    const { app, create } = application(allow);
    const router = await apiRoutes.createRouter(app);

    const response = await router.request('/jobs-example/job', {
      method: 'POST',
    });

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual(TASK);
    expect(create).toHaveBeenCalledExactlyOnceWith('user-1');
  });

  it.each(['/jobs-example/schedule', '/jobs-example/job'])(
    'rejects anonymous requests to %s',
    async (path) => {
      const router = await apiRoutes.createRouter(application(deny).app);

      expect((await router.request(path)).status).toBe(401);
    },
  );

  it('declares an API Route contribution', () => {
    expect(apiRoutes).toMatchObject({ scope: 'api' });
  });
});
