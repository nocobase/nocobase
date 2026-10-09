import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { LIFECYCLE_ROUTES } from '../../shared/routes.js';
import type {
  ExpenseChanges,
  ExpenseDraft,
  LifecycleExampleService,
} from '../services/lifecycle-example.js';
import { lifecycleExampleServiceToken } from '../tokens.js';
import type { ExampleLifecycleName, Plain } from '../tokens.js';
import { outward, tags, toApiError } from './api.js';
import { lifecycleRoutes } from './lifecycle.js';
import {
  ActAsQuery,
  CreateTicketInput,
  ExampleRecord,
  ExpenseChangesInput,
  ExpenseDraftInput,
  ListExpensesQuery,
  ListMeta,
  ListTicketsQuery,
  RecordParams,
  TriggersRun,
  type ExpenseChangesInput as ExpenseChangesValues,
  type ExpenseDraftInput as ExpenseDraftValues,
} from './schemas.js';

/** Every route below starts here; the client reads the same constant. */
const BASE = `/${LIFECYCLE_ROUTES}`;

function draft(values: ExpenseDraftValues): ExpenseDraft {
  return { ...values, items: values.items.map((item) => ({ ...item })) };
}

/** Only the fields the request sent: one it left out is not reset. */
function changes(values: ExpenseChangesValues): ExpenseChanges {
  return {
    ...(values.title === undefined ? {} : { title: values.title }),
    ...(values.purpose === undefined ? {} : { purpose: values.purpose }),
    ...(values.items === undefined
      ? {}
      : { items: values.items.map((item) => ({ ...item })) }),
    ...(values.failPayments === undefined
      ? {}
      : { failPayments: values.failPayments }),
  };
}

function listRoutes(
  router: Hono<AuthEnv>,
  service: LifecycleExampleService,
): void {
  const list =
    (name: ExampleLifecycleName, page: number, pageSize: number) =>
    (result: {
      readonly records: readonly Plain[];
      readonly total: number;
    }) => ({
      data: result.records.map(outward),
      meta: {
        page,
        pageSize,
        total: result.total,
        parameters: service.parameters(name) as Readonly<
          Record<string, unknown>
        >,
      },
    });

  router.get(
    `${BASE}/tickets`,
    describeRoute({
      tags,
      summary: 'List tickets',
      operationId: 'lifecycleExampleListTickets',
      description:
        'An agent sees the whole queue, a customer their own tickets, newest first. `meta.parameters` carries the lifecycle’s parameters the page quotes.',
      responses: {
        200: listResponse(ExampleRecord, ListMeta),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', ListTicketsQuery),
    async (context) => {
      const { actAs, page, pageSize } = context.req.valid('query');
      return context.json(
        list(
          'tickets',
          page,
          pageSize,
        )(await service.listTickets(actAs, { page, pageSize })),
      );
    },
  );
  router.post(
    `${BASE}/tickets`,
    describeRoute({
      tags,
      summary: 'File a ticket',
      operationId: 'lifecycleExampleCreateTicket',
      description:
        'Created through the ticket lifecycle, whose `create` lets only a customer file one, for themselves.',
      responses: {
        201: dataResponse(ExampleRecord, 'The ticket, in `new`.'),
        401: apiErrorResponse(401),
        403: apiErrorResponse(
          403,
          'The persona is not a customer (`GUARD_REJECTED`).',
        ),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', ActAsQuery),
    apiValidator('json', CreateTicketInput),
    async (context) => {
      const { actAs } = context.req.valid('query');
      const values = context.req.valid('json');
      return context.json(
        { data: outward(await service.createTicket(values, actAs)) },
        201,
      );
    },
  );

  router.get(
    `${BASE}/expenses`,
    describeRoute({
      tags,
      summary: 'List expense reports',
      operationId: 'lifecycleExampleListExpenses',
      description:
        'An applicant’s own reports, or with `view=approvals` those waiting for the persona’s decision, newest first.',
      responses: {
        200: listResponse(ExampleRecord, ListMeta),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', ListExpensesQuery),
    async (context) => {
      const { actAs, page, pageSize, view } = context.req.valid('query');
      return context.json(
        list(
          'expenses',
          page,
          pageSize,
        )(await service.listExpenses(actAs, view, { page, pageSize })),
      );
    },
  );
  router.post(
    `${BASE}/expenses`,
    describeRoute({
      tags,
      summary: 'Draft an expense report',
      operationId: 'lifecycleExampleCreateExpense',
      description:
        'Created through the expense lifecycle in `draft`, whose `create` lets only an employee file one, for themselves.',
      responses: {
        201: dataResponse(ExampleRecord, 'The report, in `draft`.'),
        401: apiErrorResponse(401),
        403: apiErrorResponse(
          403,
          'The persona is not an employee (`GUARD_REJECTED`).',
        ),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', ActAsQuery),
    apiValidator('json', ExpenseDraftInput),
    async (context) => {
      const { actAs } = context.req.valid('query');
      const values = context.req.valid('json');
      return context.json(
        { data: outward(await service.createExpense(draft(values), actAs)) },
        201,
      );
    },
  );
}

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono<AuthEnv>();
    const authentication = container.resolve(authenticationToken);
    const service = container.resolve(lifecycleExampleServiceToken);

    router.use(`${BASE}/*`, authentication.required());
    router.onError((error, context) =>
      apiErrorHandler(toApiError(error), context),
    );

    // Sweeps the triggers now, so the page need not wait for the schedule.
    router.post(
      `${BASE}/runTriggers`,
      describeRoute({
        tags,
        summary: 'Run the lifecycle triggers now',
        operationId: 'lifecycleExampleRunTriggers',
        description:
          'Fires every trigger whose records have waited long enough, instead of waiting for the scheduled sweep.',
        responses: {
          200: dataResponse(TriggersRun),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      async (context) =>
        context.json({ data: { fired: await service.runTriggers() } }),
    );

    listRoutes(router, service);

    // Each record's routes — its lifecycle, view, transitions and effect
    // runs — follow the paths `@nocobase/lifecycle/react` calls.
    for (const lifecycle of ['tickets', 'expenses'] as const)
      lifecycleRoutes(router, service.runtime, {
        basePath: BASE,
        lifecycle,
        noun: lifecycle === 'tickets' ? 'Ticket' : 'Expense',
      });

    // `:recordId`, as the record routes above name it: one path, one parameter.
    router.patch(
      `${BASE}/expenses/:recordId`,
      describeRoute({
        tags,
        summary: 'Edit a draft expense report',
        operationId: 'lifecycleExampleUpdateExpense',
        description:
          'Changes only the fields sent; the others keep their values. Only the applicant edits a report, while it is a draft or sent back; the state is changed only by its transitions.',
        responses: {
          200: dataResponse(ExampleRecord, 'The report as edited.'),
          400: apiErrorResponse(
            400,
            'The report is under review (`EXPENSE_LOCKED`).',
          ),
          401: apiErrorResponse(401),
          403: apiErrorResponse(
            403,
            'Someone else’s report (`OWN_EXPENSE_ONLY`).',
          ),
          404: apiErrorResponse(404),
          409: apiErrorResponse(
            409,
            'Concurrent changes kept winning; the edit was reapplied and gave up (`EXPENSE_CHANGED`).',
          ),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('param', RecordParams),
      apiValidator('query', ActAsQuery),
      apiValidator('json', ExpenseChangesInput),
      async (context) => {
        const { recordId } = context.req.valid('param');
        const { actAs } = context.req.valid('query');
        const values = context.req.valid('json');
        return context.json({
          data: outward(
            await service.updateExpense(recordId, changes(values), actAs),
          ),
        });
      },
    );

    return new Hono().route('/', router);
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
