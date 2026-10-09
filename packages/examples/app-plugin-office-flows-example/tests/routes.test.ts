import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { LifecycleError } from '@nocobase/lifecycle';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { describe, expect, it, vi } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import {
  OfficeFlowsError,
  type OfficeFlowsService,
} from '../server/services/office-flows.js';
import { officeFlowsServiceToken } from '../server/tokens.js';

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
  const service = {
    fireIncoming: vi.fn(async () => undefined),
    fireTask: vi.fn(async () => undefined),
    addRow: vi.fn(async () => 1),
    createDataRequest: vi.fn(async () => ({ id: 1 })),
  };
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  container.instance(
    officeFlowsServiceToken,
    service as unknown as OfficeFlowsService,
  );
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: {} as never,
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  };
  return { app, service };
}

function post(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('office flows routes', () => {
  it('requires a signed-in user', async () => {
    const router = await apiRoutes.createRouter(application(deny).app);
    expect((await router.request('/officeFlowsExample/config')).status).toBe(
      401,
    );
  });

  it('fires a transition as one of the example people', async () => {
    const { app, service } = application(allow);
    const router = await apiRoutes.createRouter(app);
    const response = await router.request(
      post('/officeFlowsExample/incoming/7/fire?actAs=zhoujie', {
        transition: 'dispatchClerks',
      }),
    );
    expect(response.status).toBe(204);
    expect(service.fireIncoming).toHaveBeenCalledWith(
      '7',
      'dispatchClerks',
      {},
      'zhoujie',
    );
  });

  it('rejects someone outside the cast, and a field the route does not take', async () => {
    const router = await apiRoutes.createRouter(application(allow).app);
    const stranger = await router.request(
      post('/officeFlowsExample/incoming/7/fire?actAs=mallory', {
        transition: 'close',
      }),
    );
    expect(stranger.status).toBe(400);
    await expect(stranger.json()).resolves.toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [expect.objectContaining({ field: 'actAs' })],
      },
    });
    const extra = await router.request(
      post('/officeFlowsExample/incoming/7/fire?actAs=zhoujie', {
        transition: 'close',
        actAs: 'zhoujie',
      }),
    );
    expect(extra.status).toBe(400);
  });

  it('answers refusals in the standard error body', async () => {
    const { app, service } = application(allow);
    service.fireTask.mockRejectedValueOnce(
      new LifecycleError('GUARD_REJECTED', 'no', {
        blockers: [
          {
            source: 'guard',
            kind: 'permission',
            code: 'notAssignee',
            message: 'no',
          },
        ],
      }),
    );
    service.addRow.mockRejectedValueOnce(
      new OfficeFlowsError('FORBIDDEN', 'TASK_ROWS_NOT_ALLOWED', 'no'),
    );
    const router = await apiRoutes.createRouter(app);
    const fired = await router.request(
      post('/officeFlowsExample/tasks/clerk/3/fire?actAs=gaoyan', {
        transition: 'sign',
      }),
    );
    const added = await router.request(
      post('/officeFlowsExample/tasks/clerk/3/rows?actAs=gaoyan', {
        departmentName: '工会',
      }),
    );
    const unknownKind = await router.request(
      post('/officeFlowsExample/tasks/nobody/3/fire?actAs=gaoyan', {
        transition: 'sign',
      }),
    );
    const executorRows = await router.request(
      post('/officeFlowsExample/tasks/executor/3/rows?actAs=gaoyan', {
        departmentName: '工会',
      }),
    );
    expect(fired.status).toBe(403);
    await expect(fired.json()).resolves.toMatchObject({
      error: {
        status: 'PERMISSION_DENIED',
        reason: 'GUARD_REJECTED',
        domain: 'officeFlowsExample',
        metadata: { blockers: [{ code: 'notAssignee' }] },
      },
    });
    expect(added.status).toBe(403);
    await expect(added.json()).resolves.toMatchObject({
      error: { reason: 'TASK_ROWS_NOT_ALLOWED', domain: 'officeFlowsExample' },
    });
    expect(unknownKind.status).toBe(400);
    expect(executorRows.status).toBe(400);
  });

  it('answers a form field of the wrong type with a 400', async () => {
    const { app, service } = application(allow);
    const router = await apiRoutes.createRouter(app);
    const wrong = await router.request(
      post('/officeFlowsExample/dataRequests?actAs=zhangwei', {
        form: { subject: 123, consumers: 'all' },
      }),
    );
    expect(wrong.status).toBe(400);
    expect(service.createDataRequest).not.toHaveBeenCalled();
    const right = await router.request(
      post('/officeFlowsExample/dataRequests?actAs=zhangwei', {
        form: {
          subject: '客户画像',
          consumers: ['内部合规风险审计'],
          monthDay: 5,
        },
      }),
    );
    expect(right.status).toBe(201);
    await expect(right.json()).resolves.toEqual({ data: { id: '1' } });
    expect(service.createDataRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '客户画像',
        consumers: ['内部合规风险审计'],
        monthDay: 5,
        reason: '',
      }),
      'zhangwei',
    );
  });

  it('declares every route in the API document', async () => {
    const router = await apiRoutes.createRouter(application(allow).app);
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Office flows example', version: '0.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const operations = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item ?? {}),
    ) as { operationId?: string; tags?: string[] }[];
    expect(operations).toHaveLength(26);
    expect(
      operations.every(({ operationId }) =>
        operationId?.startsWith('officeFlowsExample'),
      ),
    ).toBe(true);
    expect(new Set(operations.flatMap(({ tags }) => tags ?? []))).toEqual(
      new Set(['OfficeFlowsExample']),
    );
  });
});
