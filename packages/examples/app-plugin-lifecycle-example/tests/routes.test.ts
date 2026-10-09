import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  LifecycleError,
  LifecycleRuntime,
  MemoryLifecycleStore,
} from '@nocobase/lifecycle';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';

import { expenseLifecycle } from '../server/lifecycles/expense.js';
import { createExampleServices } from '../server/lifecycles/services.js';
import { ticketLifecycle } from '../server/lifecycles/ticket.js';
import { apiRoutes } from '../server/routes/index.js';
import {
  lifecycleExampleServiceToken,
  type LifecycleExampleService,
} from '../server/tokens.js';

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
  // A real runtime on a memory store: the record routes are the library's,
  // so they are tested against a lifecycle, not a mock.
  const store = new MemoryLifecycleStore();
  const runtime = new LifecycleRuntime({ store });
  const services = createExampleServices({ info: () => undefined });
  runtime.register(expenseLifecycle, { services });
  runtime.register(ticketLifecycle, { services });
  store.insertRecord('lifecycleExampleExpenses', {
    id: 1,
    title: '上海出差',
    items: [],
    amountCents: 800_000,
    applicantId: 'lin',
    approverId: 'chen',
    paymentRef: null,
    failPayments: 0,
    status: 'awaitingManager',
    statusChangedAt: '2026-10-01T09:00:00.000Z',
    lifecycleVersion: 2,
  });
  // Closed long before the reopen window of seven days.
  store.insertRecord('lifecycleExampleTickets', {
    id: 5,
    subject: '无法登录后台',
    description: '提示会话过期',
    category: 'account',
    priority: 'high',
    requesterId: 'customer-li',
    assigneeId: 'agent-zhou',
    closedReason: 'resolved',
    failNotifications: 0,
    status: 'closed',
    statusChangedAt: '2000-01-01T00:00:00.000Z',
    lifecycleVersion: 3,
  });
  const service = {
    runtime,
    createExpense: vi.fn(async (values: object) => ({ id: 2, ...values })),
    updateExpense: vi.fn(async (id: string, values: object) => ({
      id: Number(id),
      ...values,
    })),
    listTickets: vi.fn(async () => ({ records: [], total: 0 })),
    parameters: vi.fn(() => ({ waitMinutes: 2, reopenDays: 7 })),
  };
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  container.instance(
    lifecycleExampleServiceToken,
    service as unknown as LifecycleExampleService,
  );
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: {} as never,
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  };
  return { app, service, store };
}

function post(path: string, body: unknown, method = 'POST'): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('lifecycle example routes', () => {
  it('requires a signed-in user', async () => {
    const router = await apiRoutes.createRouter(application(deny).app);
    expect((await router.request('/lifecycleExample/tickets')).status).toBe(
      401,
    );
  });

  it('lists a page of records with the parameters the page quotes', async () => {
    const { app, service } = application(allow);
    const router = await apiRoutes.createRouter(app);
    const response = await router.request(
      '/lifecycleExample/tickets?actAs=agent-zhou',
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [],
      meta: {
        page: 1,
        pageSize: 20,
        total: 0,
        parameters: { waitMinutes: 2, reopenDays: 7 },
      },
    });
    expect(service.listTickets).toHaveBeenCalledWith('agent-zhou', {
      page: 1,
      pageSize: 20,
    });
    const tooMany = await router.request(
      '/lifecycleExample/tickets?actAs=agent-zhou&pageSize=500',
    );
    expect(tooMany.status).toBe(400);
  });

  it('fires a transition as one of the lifecycle personas through the record routes', async () => {
    const { app, service } = application(allow);
    const router = await apiRoutes.createRouter(app);
    const response = await router.request(
      post('/lifecycleExample/expenses/1/fire?actAs=chen', {
        transition: 'requestInfo',
        input: { reason: '请补充行程单' },
        requestId: 'click-1',
        expectVersion: 2,
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        record: { id: '1' },
        state: 'needsInfo',
        version: 3,
        replayed: false,
      },
    });
    // The request key travels with the click, so a retried request fires once.
    const again = await router.request(
      post('/lifecycleExample/expenses/1/fire?actAs=chen', {
        transition: 'requestInfo',
        input: { reason: '请补充行程单' },
        requestId: 'click-1',
      }),
    );
    await expect(again.json()).resolves.toMatchObject({
      data: { replayed: true },
    });
    const history = await service.runtime.history('expenses', 1);
    expect(history.transitions.map((entry) => entry.actorId)).toEqual(['chen']);
  });

  it('rejects a persona the example does not define', async () => {
    const router = await apiRoutes.createRouter(application(allow).app);
    const response = await router.request(
      post('/lifecycleExample/expenses/1/fire?actAs=mallory', {
        transition: 'approve',
        requestId: 'click-1',
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [expect.objectContaining({ field: 'actAs' })],
      },
    });
  });

  it('answers a refused transition in the standard body, with its reasons', async () => {
    const router = await apiRoutes.createRouter(application(allow).app);
    const denied = await router.request(
      post('/lifecycleExample/expenses/1/fire?actAs=sun', {
        transition: 'approve',
        requestId: 'click-1',
      }),
    );
    expect(denied.status).toBe(403);
    // The page shows why, not only that it was refused.
    await expect(denied.json()).resolves.toMatchObject({
      error: {
        status: 'PERMISSION_DENIED',
        reason: 'GUARD_REJECTED',
        domain: 'lifecycleExample',
        metadata: {
          blockers: [
            {
              source: 'guard',
              code: 'approverOnly',
              message: 'Only the current approver can decide on this report.',
            },
          ],
        },
      },
    });
    const stale = await router.request(
      post('/lifecycleExample/expenses/1/fire?actAs=chen', {
        transition: 'approve',
        requestId: 'click-2',
        expectVersion: 1,
      }),
    );
    expect(stale.status).toBe(409);
    await expect(stale.json()).resolves.toMatchObject({
      error: { status: 'ABORTED', reason: 'CONFLICT' },
    });
    const invalid = await router.request(
      post('/lifecycleExample/expenses/1/fire?actAs=chen', {
        transition: 'requestInfo',
        requestId: 'click-3',
      }),
    );
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [{ field: 'input.reason' }],
      },
    });
    const view = await router.request('/lifecycleExample/expenses/1?actAs=lin');
    await expect(view.json()).resolves.toMatchObject({
      data: {
        state: 'awaitingManager',
        available: expect.arrayContaining([
          expect.objectContaining({ name: 'withdraw', allowed: true }),
          expect.objectContaining({ name: 'approve', allowed: false }),
        ]),
      },
    });
    const missing = await router.request(
      '/lifecycleExample/expenses/99?actAs=lin',
    );
    expect(missing.status).toBe(404);
  });

  it('answers a guard about the record as a failed precondition, and one about the persona as forbidden', async () => {
    const router = await apiRoutes.createRouter(application(allow).app);
    const reopen = { transition: 'reopen', input: { message: '又坏了' } };
    // The customer who filed it may reopen tickets; this one closed too long ago.
    const expired = await router.request(
      post('/lifecycleExample/tickets/5/fire?actAs=customer-li', {
        ...reopen,
        requestId: 'click-1',
      }),
    );
    expect(expired.status).toBe(400);
    await expect(expired.json()).resolves.toMatchObject({
      error: {
        status: 'FAILED_PRECONDITION',
        reason: 'GUARD_REJECTED',
        metadata: {
          blockers: [{ code: 'reopenExpired', kind: 'precondition' }],
        },
      },
    });
    // Another customer may not, however recently it closed.
    const stranger = await router.request(
      post('/lifecycleExample/tickets/5/fire?actAs=customer-wang', {
        ...reopen,
        requestId: 'click-2',
      }),
    );
    expect(stranger.status).toBe(403);
    await expect(stranger.json()).resolves.toMatchObject({
      error: {
        status: 'PERMISSION_DENIED',
        reason: 'GUARD_REJECTED',
        metadata: {
          blockers: [{ code: 'requesterOnly', kind: 'permission' }],
        },
      },
    });
  });

  it('edits only the fields an expense edit sends, under the record’s id', async () => {
    const { app, service } = application(allow);
    const router = await apiRoutes.createRouter(app);
    const edited = await router.request(
      post(
        '/lifecycleExample/expenses/1?actAs=lin',
        { title: ' 北京出差 ' },
        'PATCH',
      ),
    );
    expect(edited.status).toBe(200);
    // Nothing it left out is sent on, so the report keeps its other fields.
    expect(service.updateExpense).toHaveBeenCalledWith(
      '1',
      { title: '北京出差' },
      'lin',
    );
    const notAnId = await router.request(
      post('/lifecycleExample/expenses/1e3?actAs=lin', { title: 'x' }, 'PATCH'),
    );
    expect(notAnId.status).toBe(400);
    await expect(notAnId.json()).resolves.toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [expect.objectContaining({ field: 'recordId' })],
      },
    });
    expect(service.updateExpense).toHaveBeenCalledTimes(1);
  });

  it('describes a lifecycle, and refuses an effect run of another record', async () => {
    const router = await apiRoutes.createRouter(application(allow).app);
    const described = await router.request(
      '/lifecycleExample/expenses/lifecycle?actAs=lin',
    );
    await expect(described.json()).resolves.toMatchObject({
      data: {
        description: { name: 'expenses' },
        diagram: expect.stringContaining('stateDiagram-v2'),
      },
    });
    const retried = await router.request(
      post('/lifecycleExample/expenses/1/effectRuns/7/retry?actAs=lin', {}),
    );
    expect(retried.status).toBe(404);
    await expect(retried.json()).resolves.toMatchObject({
      error: { reason: 'EFFECT_RUN_NOT_FOUND' },
    });
  });

  it('continues a run whose continuation waits, without running its effect again', async () => {
    const { app, store } = application(allow);
    const router = await apiRoutes.createRouter(app);
    // An approved report whose payment succeeded, but whose `paid` could not
    // be fired yet: the continuation waits on the run.
    store.insertRecord('lifecycleExampleExpenses', {
      id: 3,
      title: '客户拜访',
      items: [],
      amountCents: 120_000,
      applicantId: 'lin',
      approverId: null,
      paymentRef: null,
      failPayments: 0,
      status: 'approved',
      statusChangedAt: '2026-10-01T09:00:00.000Z',
      lifecycleVersion: 2,
    });
    const run = await store.createEffectRun({
      transitionId: '0',
      lifecycle: 'expenses',
      recordId: '3',
      effect: 'expenses.requestPayment',
      status: 'succeeded',
      attempts: 1,
      maxAttempts: 3,
      result: { paymentRef: 'PAY-3' },
      error: null,
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-01T09:00:00.000Z',
      claimedAt: null,
      runAfter: null,
      continuation: {
        transition: 'paid',
        outcome: 'succeeded',
        input: { paymentRef: 'PAY-3' },
        error: 'Not deployed yet.',
        code: 'UNKNOWN_TRANSITION',
        attempts: 1,
        errorTries: 0,
        failedAt: '2026-10-01T09:00:00.000Z',
        dueAt: '2026-10-01T09:01:00.000Z',
        abandonedAt: null,
      },
    });
    const continuePath = `/lifecycleExample/expenses/3/effectRuns/${run.id}/continue?actAs=lin`;

    const continued = await router.request(post(continuePath, {}));
    expect(continued.status).toBe(200);
    const body = (await continued.json()) as {
      data: {
        state: string;
        record: { paymentRef: unknown };
        history: { effectRuns: { id: string; continuation: unknown }[] };
      };
    };
    expect(body.data).toMatchObject({
      state: 'paid',
      record: { paymentRef: 'PAY-3' },
    });
    expect(
      body.data.history.effectRuns.find((each) => each.id === run.id),
    ).toMatchObject({ continuation: null });

    // Nothing waits any more.
    const again = await router.request(post(continuePath, {}));
    expect(again.status).toBe(400);
    await expect(again.json()).resolves.toMatchObject({
      error: { status: 'FAILED_PRECONDITION', reason: 'NO_CONTINUATION' },
    });

    // A run of another record is not this record's.
    const elsewhere = await router.request(
      post(
        `/lifecycleExample/expenses/1/effectRuns/${run.id}/continue?actAs=lin`,
        {},
      ),
    );
    expect(elsewhere.status).toBe(404);
    await expect(elsewhere.json()).resolves.toMatchObject({
      error: { reason: 'EFFECT_RUN_NOT_FOUND' },
    });
  });

  it('answers a continuation refused again as a failed precondition with its own code', async () => {
    const { app, store, service } = application(allow);
    const router = await apiRoutes.createRouter(app);
    /** A succeeded payment run on report 1 whose continuation waits. */
    const waiting = (transition: string) =>
      store.createEffectRun({
        transitionId: '0',
        lifecycle: 'expenses',
        recordId: '1',
        effect: 'expenses.requestPayment',
        status: 'succeeded',
        attempts: 1,
        maxAttempts: 3,
        result: { paymentRef: 'PAY-1' },
        error: null,
        createdAt: '2026-10-01T09:00:00.000Z',
        updatedAt: '2026-10-01T09:00:00.000Z',
        claimedAt: null,
        runAfter: null,
        continuation: {
          transition,
          outcome: 'succeeded',
          input: { paymentRef: 'PAY-1' },
          error: 'Refused.',
          code: 'GUARD_REJECTED',
          attempts: 1,
          errorTries: 0,
          failedAt: '2026-10-01T09:00:00.000Z',
          dueAt: '2026-10-01T09:01:00.000Z',
          abandonedAt: null,
        },
      });
    const answer = async (runId: string) => {
      const response = await router.request(
        post(
          `/lifecycleExample/expenses/1/effectRuns/${runId}/continue?actAs=lin`,
          {},
        ),
      );
      return {
        status: response.status,
        body: (await response.json()) as {
          error: {
            status: string;
            reason: string;
            details?: { fieldViolations?: unknown }[];
            metadata?: unknown;
          };
        },
      };
    };

    // Not in this release's definition: not a field of this request.
    const unknown = await answer((await waiting('settle')).id);
    expect(unknown.status).toBe(400);
    expect(unknown.body.error).toMatchObject({
      status: 'FAILED_PRECONDITION',
      reason: 'UNKNOWN_TRANSITION',
    });
    expect(JSON.stringify(unknown.body)).not.toContain('fieldViolations');

    // The system may not approve: the continuation's guard, not the persona's permission.
    const guarded = await answer((await waiting('approve')).id);
    expect(guarded.status).toBe(400);
    expect(guarded.body.error).toMatchObject({
      status: 'FAILED_PRECONDITION',
      reason: 'GUARD_REJECTED',
    });
    expect(JSON.stringify(guarded.body)).toContain('approverOnly');

    // A definition bug is what the run waits on, not an opaque 500.
    const buggy = await waiting('paid');
    vi.spyOn(service.runtime, 'continueRun').mockRejectedValueOnce(
      new LifecycleError('INVALID_SET', 'May not set "status".'),
    );
    const invalid = await answer(buggy.id);
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toMatchObject({
      status: 'FAILED_PRECONDITION',
      reason: 'INVALID_SET',
    });

    // A record the continuation's onTransition fires that no longer exists,
    // or a lifecycle it names that this release dropped: the report and the
    // run this URL names were found, so neither is a 404.
    for (const reason of ['RECORD_NOT_FOUND', 'UNKNOWN_LIFECYCLE'] as const) {
      const run = await waiting('paid');
      vi.spyOn(service.runtime, 'continueRun').mockRejectedValueOnce(
        new LifecycleError(reason, 'No such parent.'),
      );
      const nested = await answer(run.id);
      expect(nested.status).toBe(400);
      expect(nested.body.error).toMatchObject({
        status: 'FAILED_PRECONDITION',
        reason,
      });
    }

    // What the URL names is still answered 404 before the continuation is tried.
    const missing = await router.request(
      post(
        `/lifecycleExample/expenses/999/effectRuns/${buggy.id}/continue?actAs=lin`,
        {},
      ),
    );
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({
      error: { status: 'NOT_FOUND', reason: 'RECORD_NOT_FOUND' },
    });
  });

  it('validates a new expense before creating it', async () => {
    const { app, service } = application(allow);
    const router = await apiRoutes.createRouter(app);
    const bad = await router.request(
      post('/lifecycleExample/expenses?actAs=lin', {
        title: '打车',
        items: [],
        failPayments: -1,
      }),
    );
    // A strict body: a field the route does not take is refused, not ignored.
    const unknown = await router.request(
      post('/lifecycleExample/expenses?actAs=lin', {
        title: '打车',
        items: [],
        actAs: 'lin',
      }),
    );
    const good = await router.request(
      post('/lifecycleExample/expenses?actAs=lin', {
        title: '打车',
        items: [
          {
            date: '2026-09-28',
            category: 'transport',
            description: '打车',
            amountCents: 12_000,
          },
        ],
      }),
    );
    expect(bad.status).toBe(400);
    expect(unknown.status).toBe(400);
    expect(good.status).toBe(201);
    await expect(good.json()).resolves.toMatchObject({
      data: { id: '2', title: '打车' },
    });
    expect(service.createExpense).toHaveBeenCalledWith(
      {
        title: '打车',
        purpose: '',
        items: [
          {
            date: '2026-09-28',
            category: 'transport',
            description: '打车',
            amountCents: 12_000,
          },
        ],
        failPayments: 0,
      },
      'lin',
    );
  });

  it('declares every route in the API document', async () => {
    const router = await apiRoutes.createRouter(application(allow).app);
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Lifecycle example', version: '0.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const operations = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item ?? {}),
    ) as { operationId?: string; tags?: string[] }[];
    expect(operations.map(({ operationId }) => operationId).sort()).toEqual([
      'lifecycleExampleCancelExpenseEffectRun',
      'lifecycleExampleCancelTicketEffectRun',
      'lifecycleExampleContinueExpenseEffectRun',
      'lifecycleExampleContinueTicketEffectRun',
      'lifecycleExampleCreateExpense',
      'lifecycleExampleCreateTicket',
      'lifecycleExampleDescribeExpenseLifecycle',
      'lifecycleExampleDescribeTicketLifecycle',
      'lifecycleExampleFireExpenseTransition',
      'lifecycleExampleFireTicketTransition',
      'lifecycleExampleGetExpense',
      'lifecycleExampleGetTicket',
      'lifecycleExampleListExpenses',
      'lifecycleExampleListTickets',
      'lifecycleExampleRetryExpenseEffectRun',
      'lifecycleExampleRetryTicketEffectRun',
      'lifecycleExampleRunTriggers',
      'lifecycleExampleUpdateExpense',
    ]);
    expect(new Set(operations.flatMap(({ tags }) => tags ?? []))).toEqual(
      new Set(['LifecycleExample']),
    );
    // A record's routes name its id once: no path spells it another way.
    const paths = Object.keys(document.paths ?? {});
    expect(paths).toContain('/api/lifecycleExample/expenses/{recordId}');
    expect(paths.filter((path) => /\{(?!recordId|runId)/.test(path))).toEqual(
      [],
    );
    expect(
      Object.keys(
        document.paths?.['/api/lifecycleExample/expenses/{recordId}'] ?? {},
      ),
    ).toEqual(expect.arrayContaining(['get', 'patch']));
  });
});
