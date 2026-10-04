import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
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

/** An authorization whose `require` grants `settings:jobsExample.schedules` `update` only when `permitted`. */
function authorization(permitted: boolean) {
  const require = vi.fn(async () => {
    // Shaped like the library's `AuthorizationDeniedError`, which the framework answers by its status and reason.
    if (!permitted)
      throw Object.assign(new Error('Authorization denied'), {
        status: 403,
        reason: 'AUTHORIZATION_DENIED',
        domain: 'authorization',
      });
  });
  const authz = {
    middleware: () => async (context, next) => {
      context.set('authz', { require });
      await next();
    },
  } as unknown as AppAuthorization;
  return { authz, require };
}

function application(authentication: Auth, permitted: boolean = true) {
  const create = vi.fn(async () => TASK);
  const status = vi.fn(() => JOB);
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  const { authz, require } = authorization(permitted);
  container.instance(authorizationToken, authz);
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
  return { app, create, status, startRule, stopRule, require };
}

describe('jobs example routes', () => {
  it('returns the heartbeat status to a signed-in user', async () => {
    const router = await apiRoutes.createRouter(application(allow).app);

    const response = await router.request('/jobsExample/rules');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: SCHEDULE.rules,
      meta: { total: 1 },
    });
  });

  it('starts a rule with an optional interval and stops it', async () => {
    const { app, startRule, stopRule } = application(allow);
    const router = await apiRoutes.createRouter(app);

    const started = await router.request('/jobsExample/rules/interval/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ every: 10_000 }),
    });
    const plain = await router.request('/jobsExample/rules/cron/start', {
      method: 'POST',
    });
    const stopped = await router.request('/jobsExample/rules/cron/stop', {
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

    const builtIn = await post('/jobsExample/rules/heartbeat/start');
    expect(builtIn.status).toBe(400);
    await expect(builtIn.json()).resolves.toMatchObject({
      error: {
        status: 'FAILED_PRECONDITION',
        reason: 'BUILT_IN_RULE',
        domain: 'jobsExample',
      },
    });
    const missing = await post('/jobsExample/rules/missing/start');
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({
      error: { reason: 'UNKNOWN_RULE', domain: 'jobsExample' },
    });
    const invalid = await post('/jobsExample/rules/interval/start', {
      every: '5s',
    });
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [expect.objectContaining({ field: 'every' })],
      },
    });
    const unknownField = await post('/jobsExample/rules/interval/start', {
      every: 10_000,
      limit: 3,
    });
    expect(unknownField.status).toBe(400);
    expect(startRule).toHaveBeenCalledTimes(2);
  });

  it('requires the schedules settings item to switch a rule, before validating the request', async () => {
    const { app, startRule, stopRule } = application(allow, false);
    const router = await apiRoutes.createRouter(app);

    for (const [path, body] of [
      ['/jobsExample/rules/interval/start', { every: 10_000 }],
      ['/jobsExample/rules/interval/start', { every: -1, unknown: true }],
      ['/jobsExample/rules/cron/stop', undefined],
      ['/jobsExample/rules/missing/stop', undefined],
    ] as const) {
      const response = await router.request(path, {
        method: 'POST',
        ...(body === undefined
          ? {}
          : {
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(body),
            }),
      });
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({
        error: {
          status: 'PERMISSION_DENIED',
          reason: 'AUTHORIZATION_DENIED',
          domain: 'authorization',
        },
      });
    }
    expect(startRule).not.toHaveBeenCalled();
    expect(stopRule).not.toHaveBeenCalled();
    // Reading the rules needs no settings item.
    expect((await router.request('/jobsExample/rules')).status).toBe(200);
  });

  it('checks settings:jobsExample.schedules update when switching a rule', async () => {
    const { app, require } = application(allow);
    const router = await apiRoutes.createRouter(app);

    await router.request('/jobsExample/rules/cron/stop', { method: 'POST' });
    expect(require).toHaveBeenCalledWith({
      resource: { type: 'settings', id: 'jobsExample.schedules' },
      action: 'update',
    });
  });

  it("returns the signed-in user's tasks", async () => {
    const { app, status } = application(allow);
    const router = await apiRoutes.createRouter(app);

    const response = await router.request('/jobsExample/tasks');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: JOB.tasks,
      meta: { total: 1 },
    });
    expect(status).toHaveBeenCalledExactlyOnceWith('user-1');
  });

  it('creates a task for the signed-in user and answers 202', async () => {
    const { app, create } = application(allow);
    const router = await apiRoutes.createRouter(app);

    const response = await router.request('/jobsExample/tasks', {
      method: 'POST',
    });

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ data: TASK });
    expect(create).toHaveBeenCalledExactlyOnceWith('user-1');
  });

  it.each([
    ['GET', '/jobsExample/rules'],
    ['POST', '/jobsExample/rules/interval/start'],
    ['POST', '/jobsExample/rules/interval/stop'],
    ['GET', '/jobsExample/tasks'],
    ['POST', '/jobsExample/tasks'],
  ])('rejects anonymous %s %s', async (method, path) => {
    const { app, create, startRule, stopRule } = application(deny);
    const router = await apiRoutes.createRouter(app);

    expect((await router.request(path, { method })).status).toBe(401);
    expect(create).not.toHaveBeenCalled();
    expect(startRule).not.toHaveBeenCalled();
    expect(stopRule).not.toHaveBeenCalled();
  });

  it('declares an API Route contribution', () => {
    expect(apiRoutes).toMatchObject({ scope: 'api' });
  });
});
