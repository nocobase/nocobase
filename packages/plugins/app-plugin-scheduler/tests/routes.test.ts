import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import { ScheduleNotFoundError } from '../server/store.js';
import {
  schedulerServiceToken,
  type DefaultSchedulerService,
} from '../server/services/scheduler.js';

describe('@nocobase/app-plugin-scheduler', () => {
  it('denies anonymous requests through its own authentication middleware', async () => {
    const { router } = await createRouter({
      authenticated: false,
      allowed: true,
    });
    const response = await router.request('/scheduler/schedules');
    expect(response.status).toBe(401);
  });

  it('denies callers without Schedule read access, before looking the schedule up', async () => {
    const { router, can, get, detail } = await createRouter({
      authenticated: true,
      allowed: ['manage'],
    });
    for (const path of [
      '/scheduler/schedules',
      '/scheduler/schedules/missing',
      '/scheduler/schedules/missing/occurrences',
      '/scheduler/occurrences',
    ]) {
      const response = await router.request(path);
      expect(response.status).toBe(403);
      expect(await errorOf(response)).toMatchObject({
        status: 'PERMISSION_DENIED',
        reason: 'SCHEDULE_ACCESS_REQUIRED',
        domain: 'scheduler',
      });
    }
    expect(can).toHaveBeenCalledWith({
      resource: { type: 'settings', id: 'scheduler.schedules' },
      action: 'read',
    });
    expect(get).not.toHaveBeenCalled();
    expect(detail).not.toHaveBeenCalled();
  });

  it('lets a reader view Schedules but not switch them on or off', async () => {
    const { router, setEnabled } = await createRouter({
      authenticated: true,
      allowed: ['read'],
    });
    for (const path of [
      '/scheduler/schedules',
      '/scheduler/schedules/schedule-1',
      '/scheduler/schedules/schedule-1/occurrences',
      '/scheduler/occurrences',
    ])
      expect((await router.request(path)).status).toBe(200);
    for (const path of [
      '/scheduler/schedules/schedule-1/enable',
      '/scheduler/schedules/schedule-1/disable',
      '/scheduler/schedules/missing/enable',
    ]) {
      const response = await router.request(path, { method: 'POST' });
      expect(response.status).toBe(403);
      expect(await errorOf(response)).toMatchObject({
        status: 'PERMISSION_DENIED',
        reason: 'SCHEDULE_MANAGE_REQUIRED',
        domain: 'scheduler',
      });
    }
    expect(setEnabled).not.toHaveBeenCalled();
  });

  it('lets a manager switch Schedules on and off', async () => {
    const { router, setEnabled } = await createRouter({
      authenticated: true,
      allowed: ['read', 'manage'],
    });
    const response = await router.request(
      '/scheduler/schedules/schedule-1/enable',
      { method: 'POST' },
    );
    expect(response.status).toBe(200);
    expect(setEnabled).toHaveBeenCalledWith('schedule-1', true);
  });

  it('denies every route to a caller with neither action', async () => {
    const { router } = await createRouter({
      authenticated: true,
      allowed: false,
    });
    for (const [method, path] of [
      ['GET', '/scheduler/schedules'],
      ['GET', '/scheduler/occurrences'],
      ['POST', '/scheduler/schedules/schedule-1/enable'],
      ['POST', '/scheduler/schedules/schedule-1/disable'],
    ] as const)
      expect((await router.request(path, { method })).status).toBe(403);
  });

  it('describes the jobs configuration in the list meta, and the next firings in the detail', async () => {
    const { router } = await createRouter({
      authenticated: true,
      allowed: ['read'],
    });
    const list = (await (
      await router.request('/scheduler/schedules')
    ).json()) as {
      meta: { jobs: Record<string, unknown> };
    };
    expect(list.meta.jobs).toMatchObject({
      configuration: 'schedules',
      adapter: 'redis',
      connection: 'redis.internal:6379',
      removedFromCode: [],
    });
    const one = (await (
      await router.request('/scheduler/schedules/schedule-1')
    ).json()) as { data: { upcomingRuns: string[] } };
    expect(one.data.upcomingRuns).toEqual(['2026-09-02T00:01:00.000Z']);
  });

  it('filters and pages the history of every Schedule by an opaque cursor', async () => {
    const { router, listAllOccurrences } = await createRouter({
      authenticated: true,
      allowed: ['read'],
      occurrences: 3,
    });
    const first = (await (
      await router.request(
        '/scheduler/occurrences?pageSize=2&scheduleId=schedule-1&status=failed&status=timed_out&from=2026-09-01T00:00:00.000Z&to=2026-09-03T00:00:00Z',
      )
    ).json()) as { data: { id: string }[]; meta: { nextPageToken?: string } };
    expect(first.data.map(({ id }) => id)).toEqual([
      'occurrence-1',
      'occurrence-2',
    ]);
    expect(listAllOccurrences).toHaveBeenLastCalledWith({
      scheduleId: 'schedule-1',
      statuses: ['failed', 'timed_out'],
      from: new Date('2026-09-01T00:00:00.000Z'),
      to: new Date('2026-09-03T00:00:00.000Z'),
      limit: 3,
    });
    const second = (await (
      await router.request(
        `/scheduler/occurrences?pageSize=2&status=failed&pageToken=${first.meta.nextPageToken}`,
      )
    ).json()) as { data: { id: string }[]; meta: { nextPageToken?: string } };
    expect(listAllOccurrences).toHaveBeenLastCalledWith({
      statuses: ['failed'],
      after: { startedAt: '2026-09-02T00:00:08.000Z', id: 'occurrence-2' },
      limit: 3,
    });
    expect(second.data.map(({ id }) => id)).toEqual(['occurrence-3']);
    expect(second.meta).toEqual({});
    for (const query of ['pageToken=forged', 'status=done', 'from=yesterday']) {
      const response = await router.request(`/scheduler/occurrences?${query}`);
      expect(response.status).toBe(400);
    }
  });

  it('returns only controlled list and occurrence projections to authorized callers', async () => {
    const { router } = await createRouter({
      authenticated: true,
      allowed: true,
    });
    const list = await router.request('/scheduler/schedules');
    const one = await router.request('/scheduler/schedules/schedule-1');
    const occurrences = await router.request(
      '/scheduler/schedules/schedule-1/occurrences',
    );
    expect(list.status).toBe(200);
    expect(one.status).toBe(200);
    expect(occurrences.status).toBe(200);
    expect(await list.json()).toEqual({
      data: [
        expect.objectContaining({
          id: 'schedule-1',
          targetType: 'app.customer-sync',
        }),
      ],
      meta: {
        page: 1,
        pageSize: 20,
        total: 1,
        jobs: expect.objectContaining({ adapter: 'redis' }),
      },
    });
    expect(await one.json()).toEqual({
      data: expect.objectContaining({ id: 'schedule-1' }),
    });
    expect(await occurrences.json()).toEqual({
      data: [
        expect.objectContaining({
          id: 'occurrence-1',
          targetReceipt: { eventKey: 'controlled' },
        }),
      ],
      meta: {},
    });
    expect(
      JSON.stringify(
        await (await router.request('/scheduler/schedules')).json(),
      ),
    ).not.toContain('secret-input');
  });

  it('pages the schedule list by number and caps the page size', async () => {
    const { router } = await createRouter({
      authenticated: true,
      allowed: true,
    });
    const beyond = await router.request('/scheduler/schedules?page=2');
    expect(await beyond.json()).toEqual({
      data: [],
      meta: expect.objectContaining({ page: 2, pageSize: 20, total: 1 }),
    });
    const tooLarge = await router.request('/scheduler/schedules?pageSize=101');
    expect(tooLarge.status).toBe(400);
    expect(await errorOf(tooLarge)).toMatchObject({
      reason: 'INVALID_INPUT',
      fieldViolations: [expect.objectContaining({ field: 'pageSize' })],
    });
  });

  it('pages occurrences by an opaque cursor', async () => {
    const { router, listOccurrences } = await createRouter({
      authenticated: true,
      allowed: true,
      occurrences: 3,
    });
    const first = await router.request(
      '/scheduler/schedules/schedule-1/occurrences?pageSize=2',
    );
    const firstBody = (await first.json()) as {
      data: { id: string }[];
      meta: { nextPageToken?: string };
    };
    expect(firstBody.data.map(({ id }) => id)).toEqual([
      'occurrence-1',
      'occurrence-2',
    ]);
    expect(firstBody.meta.nextPageToken).toEqual(expect.any(String));
    expect(listOccurrences).toHaveBeenLastCalledWith('schedule-1', {
      offset: 0,
      limit: 3,
    });

    const second = await router.request(
      `/scheduler/schedules/schedule-1/occurrences?pageSize=2&pageToken=${firstBody.meta.nextPageToken}`,
    );
    const secondBody = (await second.json()) as {
      data: { id: string }[];
      meta: { nextPageToken?: string };
    };
    expect(secondBody.data.map(({ id }) => id)).toEqual(['occurrence-3']);
    expect(secondBody.meta).toEqual({});
    expect(listOccurrences).toHaveBeenLastCalledWith('schedule-1', {
      offset: 2,
      limit: 3,
    });

    const forged = await router.request(
      '/scheduler/schedules/schedule-1/occurrences?pageToken=not-a-token',
    );
    expect(forged.status).toBe(400);
    expect(await errorOf(forged)).toMatchObject({
      reason: 'INVALID_INPUT',
      fieldViolations: [expect.objectContaining({ field: 'pageToken' })],
    });
  });

  it('answers 404 for a schedule id this application does not have', async () => {
    const { router } = await createRouter({
      authenticated: true,
      allowed: true,
    });
    for (const [method, path] of [
      ['GET', '/scheduler/schedules/missing'],
      ['GET', '/scheduler/schedules/missing/occurrences'],
      ['POST', '/scheduler/schedules/missing/enable'],
      ['POST', '/scheduler/schedules/missing/disable'],
    ] as const) {
      const response = await router.request(path, { method });
      expect(response.status).toBe(404);
      expect(await errorOf(response)).toMatchObject({
        status: 'NOT_FOUND',
        reason: 'SCHEDULE_NOT_FOUND',
        domain: 'scheduler',
      });
    }
  });

  it('enables and disables a schedule', async () => {
    const { router, setEnabled } = await createRouter({
      authenticated: true,
      allowed: true,
    });
    const response = await router.request(
      '/scheduler/schedules/schedule-1/disable',
      { method: 'POST' },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: expect.objectContaining({ id: 'schedule-1' }),
    });
    expect(setEnabled).toHaveBeenCalledWith('schedule-1', false);
  });
});

async function errorOf(response: Response): Promise<Record<string, unknown>> {
  return ((await response.json()) as { error: Record<string, unknown> }).error;
}

describe('API document', () => {
  it('declares every route with a unique operation', async () => {
    const { router } = await createRouter({
      authenticated: true,
      allowed: true,
    });

    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'test', version: '0.0.0' },
    });
    const operations = Object.entries(document.paths ?? {}).flatMap(
      ([path, item]) =>
        Object.entries(item ?? {}).map(([method, operation]) => [
          `${method.toUpperCase()} ${path}`,
          (operation as { operationId?: string }).operationId,
          (operation as { tags?: string[] }).tags,
        ]),
    );
    expect(operations).toEqual([
      [
        'GET /api/scheduler/occurrences',
        'schedulerListAllOccurrences',
        ['Scheduler'],
      ],
      ['GET /api/scheduler/schedules', 'schedulerListSchedules', ['Scheduler']],
      [
        'GET /api/scheduler/schedules/{scheduleId}',
        'schedulerGetSchedule',
        ['Scheduler'],
      ],
      [
        'GET /api/scheduler/schedules/{scheduleId}/occurrences',
        'schedulerListOccurrences',
        ['Scheduler'],
      ],
      [
        'POST /api/scheduler/schedules/{scheduleId}/enable',
        'schedulerEnableSchedule',
        ['Scheduler'],
      ],
      [
        'POST /api/scheduler/schedules/{scheduleId}/disable',
        'schedulerDisableSchedule',
        ['Scheduler'],
      ],
    ]);
    expect(document.components?.schemas).toHaveProperty('SchedulerSchedule');
  });
});

async function createRouter(options: {
  authenticated: boolean;
  /** `true` grants both actions, `false` neither; a list grants those actions. */
  allowed: boolean | readonly ('read' | 'manage')[];
  occurrences?: number;
}) {
  const container = new ServiceContainer();
  const granted =
    options.allowed === true
      ? ['read', 'manage']
      : options.allowed === false
        ? []
        : options.allowed;
  const can = vi.fn(
    async (requirement: {
      resource: { type: string; id: string };
      action: string;
    }) =>
      requirement.resource.type === 'settings' &&
      requirement.resource.id === 'scheduler.schedules' &&
      granted.includes(requirement.action as 'read' | 'manage'),
  );
  container.instance(authenticationToken, {
    required: () => async (context, next) => {
      if (!options.authenticated)
        return context.json({ error: 'Authentication required.' }, 401);
      await next();
    },
  } as unknown as Auth);
  container.instance(authorizationToken, {
    middleware: () => async (context, next) => {
      context.set('authz', { can });
      await next();
    },
  } as unknown as Authorization);
  const schedule = {
    id: 'schedule-1',
    appName: 'test',
    key: 'key',
    title: 'Schedule',
    cron: '* * * * *',
    timezone: 'UTC',
    enabled: true,
    targetType: 'app.customer-sync',
    lifecycleState: 'active',
    definitionHash: 'hash',
    runCount: 1,
    scheduleStatus: 'active',
    targetSummary: { targetLabel: 'Customer sync', state: 'ready' },
  };
  const history = Array.from(
    { length: options.occurrences ?? 1 },
    (_, index) => ({
      id: `occurrence-${index + 1}`,
      scheduleId: 'schedule-1',
      status: 'triggered',
      executionCount: 1,
      startedAt: `2026-09-02T00:00:0${9 - index}.000Z`,
      targetReceipt: { eventKey: 'controlled' },
    }),
  );
  const get = vi.fn(async (id: string) =>
    id === schedule.id ? schedule : undefined,
  );
  const detail = vi.fn(async (id: string) =>
    id === schedule.id
      ? { ...schedule, upcomingRuns: ['2026-09-02T00:01:00.000Z'] }
      : undefined,
  );
  const listAllOccurrences = vi.fn(
    async (query: {
      limit: number;
      after?: { startedAt: string; id: string };
    }) => {
      const start = query.after
        ? history.findIndex(({ id }) => id === query.after?.id) + 1
        : 0;
      return history.slice(start, start + query.limit);
    },
  );
  const jobs = {
    configuration: 'schedules',
    selectedBy: 'scheduler.jobs',
    adapter: 'redis',
    pluginRegistered: true,
    multiInstance: true,
    concurrency: 4,
    attempts: 1,
    namespace: 'acme',
    connection: 'redis.internal:6379',
    sources: {
      configuration: 'environment',
      adapter: 'config',
      concurrency: 'config',
      attempts: 'default',
      namespace: 'config',
      connection: 'config',
    },
  };
  const listOccurrences = vi.fn(
    async (_id: string, range: { offset: number; limit: number }) =>
      history.slice(range.offset, range.offset + range.limit),
  );
  const setEnabled = vi.fn(async (id: string, enabled: boolean) => {
    if (id !== schedule.id) throw new ScheduleNotFoundError(id);
    return { ...schedule, enabled };
  });
  container.instance(schedulerServiceToken, {
    list: async () => [schedule],
    get,
    detail,
    jobs: () => jobs,
    removedFromCode: () => [],
    listAllOccurrences,
    listOccurrences,
    setEnabled,
    sync: async () => {},
  } as unknown as DefaultSchedulerService);
  const router = await apiRoutes.createRouter({
    appName: 'test',
    publicBasePath: '',
    paths: {} as never,
    config: { app: { name: 'test', publicBasePath: '' } },
    router: new Hono(),
    container,
  } as AppPluginApplication);
  return {
    router,
    can,
    get,
    detail,
    listOccurrences,
    listAllOccurrences,
    setEnabled,
  };
}
