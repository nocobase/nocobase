import { z } from 'zod';
import { configurationRoutes } from './parameter-configuration.js';
import { parameterConfigurationServiceToken } from '../tokens.js';
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
import {
  durableFlowServiceToken,
  lifecycleExampleServiceToken,
} from '../tokens.js';
import {
  NEW_EXPENSE_DEFINITION,
  type ExampleLifecycleName,
  type Plain,
} from '../tokens.js';
import { outward, tags, toApiError } from './api.js';
import { durableFlowRoutes, webhookRoutes } from './durable-flows.js';
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
    async (result: {
      readonly records: readonly Plain[];
      readonly total: number;
    }) => ({
      data: result.records.map(outward),
      meta: {
        page,
        pageSize,
        total: result.total,
        // What a new record runs with: new reports use the latest
        // definition their entry names, not the first.
        parameters: (await service.parameters(
          name === 'expenses' ? NEW_EXPENSE_DEFINITION : name,
        )) as Readonly<Record<string, unknown>>,
        states: service.runtime.groupStates(name).map((state) => ({
          name: state.name,
          title: state.title,
          final: state.final,
        })),
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
        await list(
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
    apiValidator(
      'header',
      z.object({ 'idempotency-key': z.string().min(1).max(200).optional() }),
    ),
    apiValidator('json', CreateTicketInput),
    async (context) => {
      const { actAs } = context.req.valid('query');
      const values = context.req.valid('json');
      return context.json(
        {
          data: outward(
            await service.createTicket(
              values,
              actAs,
              context.req.valid('header')['idempotency-key'],
            ),
          ),
        },
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
        'An applicant’s own reports, or with `view=approvals` those waiting for the persona’s decision, newest first. Reports of every version of the process are listed together; `status` narrows them to one state, and `meta.states` lists every state any version declares.',
      responses: {
        200: listResponse(ExampleRecord, ListMeta),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', ListExpensesQuery),
    async (context) => {
      const { actAs, page, pageSize, view, status } =
        context.req.valid('query');
      return context.json(
        await list(
          'expenses',
          page,
          pageSize,
        )(await service.listExpenses(actAs, view, { page, pageSize }, status)),
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
        'Creates a draft through its concrete definition, atomically freezing all effective parameters with the record. Only an employee may file one for themselves; configuration edits affect later-created records, including drafts.',
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
    const flows = container.resolve(durableFlowServiceToken);

    router.use(`${BASE}/*`, authentication.required());
    router.onError((error, context) =>
      apiErrorHandler(toApiError(error), context),
    );

    // Sweeps now, so the page need not wait for the schedule.
    router.post(
      `${BASE}/runTriggers`,
      describeRoute({
        tags,
        summary: 'Run the lifecycle triggers now',
        operationId: 'lifecycleExampleRunTriggers',
        description:
          'Does what the scheduled sweep does, at once: fires every trigger whose records have waited long enough, renews the subscriptions whose period ended, and delivers again the sandbox webhooks that were answered with an error.',
        responses: {
          200: dataResponse(TriggersRun),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      async (context) => context.json({ data: await flows.sweep() }),
    );

    const configuration = container.resolve(parameterConfigurationServiceToken);
    configurationRoutes(router, BASE, configuration);
    listRoutes(router, service);
    durableFlowRoutes(router, BASE, flows);

    // Each record's routes — its lifecycle, view, transitions and effect
    // runs — follow the paths `@nocobase/lifecycle/react` calls.
    for (const [lifecycle, noun] of [
      ['tickets', 'Ticket'],
      ['expenses', 'Expense'],
      ['orders', 'Order'],
      ['invoices', 'Invoice'],
      ['exports', 'Export'],
      ['purchases', 'Purchase'],
      ['fulfilments', 'Fulfilment'],
      ['subscriptions', 'Subscription'],
    ] as const)
      lifecycleRoutes(router, service.runtime, {
        basePath: BASE,
        lifecycle,
        noun,
        ...(['tickets', 'expenses'].includes(lifecycle)
          ? {
              // Every version's groups: a record of any of them is served here.
              authorizeParameters: (actor: string) => {
                for (const { name } of service.runtime.group(lifecycle)
                  .versions)
                  for (const group of service.runtime.describe(name)
                    .parameterConfiguration!.groups)
                    configuration.authorize(actor, 'read', group.key);
              },
            }
          : {}),
        // The durable flows are about waiting for the outside, not about who
        // may act: they act as the signed-in user, with no persona.
        persona: lifecycle === 'tickets' || lifecycle === 'expenses',
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

    // The webhooks are registered first: they answer before the session
    // guard above, which would otherwise match their path too.
    return new Hono().route('/', webhookRoutes(BASE, flows)).route('/', router);
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
