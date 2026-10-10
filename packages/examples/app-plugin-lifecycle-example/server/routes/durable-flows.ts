import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';

import type { DurableFlow } from '../../shared/flows.js';
import type { DurableFlowService } from '../services/durable-flows.js';
import type { Plain } from '../tokens.js';
import { SIGNATURE_HEADER } from '../webhooks/receiver.js';
import { outward, signedInUser, tags, toApiError } from './api.js';
import {
  CheckoutParams,
  CheckoutSessionSchema,
  CreateExportInput,
  CreateFulfilmentInput,
  CreateOrderInput,
  CreatePurchaseInput,
  CreateSubscriptionInput,
  DeliveryResultSchema,
  EmitEventInput,
  EventParams,
  EventsQuery,
  PayCheckoutInput,
  StockLevelSchema,
  WebhookEventSchema,
  WebhookParams,
} from './flow-schemas.js';
import { ExampleRecord, ListMeta, PageQuery, RecordParams } from './schemas.js';

/**
 * Where the simulated systems' webhooks land: `POST {base}/webhooks/{source}`.
 * It takes no session — a payment provider has none — and is registered
 * ahead of the session guard for that reason; the credential is the body's
 * signature, checked before anything is read. Every answer but an error
 * tells the sender to stop; an error, such as a conflict with a concurrent
 * change, tells it to deliver again.
 */
export function webhookRoutes(base: string, flows: DurableFlowService): Hono {
  const router = new Hono();
  router.onError((error, context) =>
    apiErrorHandler(toApiError(error), context),
  );
  router.post(
    `${base}/webhooks/:source`,
    describeRoute({
      tags,
      summary: 'Receive a sandbox webhook',
      operationId: 'lifecycleExampleReceiveWebhook',
      description: `Takes no session or API key: the credential is \`${SIGNATURE_HEADER}\`, the hex HMAC-SHA256 of the raw body under the sandbox's secret. The body is one event, \`{ id, type, occurredAt, recordId, data }\`, which fires the transitions its type maps to under the request id \`<source>:<id>\`, so a redelivered event replays instead of firing twice. Answers 200 for an event that applied, had applied, or can never apply; a conflict or a failure is answered with an error, and the sender delivers again.`,
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id', 'type', 'occurredAt', 'recordId', 'data'],
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                occurredAt: { type: 'string', format: 'date-time' },
                recordId: { type: 'string' },
                data: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        200: dataResponse(DeliveryResultSchema, 'How the event was taken.'),
        400: apiErrorResponse(
          400,
          'The body is not an event (`INVALID_EVENT`).',
        ),
        401: apiErrorResponse(
          401,
          'The signature does not match the body (`INVALID_SIGNATURE`).',
        ),
        409: apiErrorResponse(
          409,
          'The record changed while the event was applied (`CONFLICT`); deliver it again.',
        ),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('param', WebhookParams),
    async (context) => {
      const { source } = context.req.valid('param');
      // The signature covers the bytes as sent, so the body is read raw.
      const body = await context.req.text();
      const result = await flows.outbox.receiver.receiveSigned(
        source,
        body,
        context.req.header(SIGNATURE_HEADER),
      );
      return context.json({ data: result });
    },
  );
  return router;
}

interface FlowSpec<Body> {
  readonly flow: DurableFlow;
  readonly noun: string;
  readonly plural: string;
  readonly input: z.ZodType<Body>;
  readonly description: string;
  create(flows: DurableFlowService, body: Body, actor: string): Promise<Plain>;
}

function flowRoutes<Body>(
  router: Hono<AuthEnv>,
  base: string,
  flows: DurableFlowService,
  spec: FlowSpec<Body>,
): void {
  const path = `${base}/${spec.flow}`;
  router.get(
    path,
    describeRoute({
      tags,
      summary: `List ${spec.plural}`,
      operationId: `lifecycleExampleList${spec.noun}s`,
      description:
        'Every record, newest first. `meta.parameters` carries the lifecycle’s parameters the page quotes.',
      responses: {
        200: listResponse(ExampleRecord, ListMeta),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', PageQuery),
    async (context) => {
      const { page, pageSize } = context.req.valid('query');
      const result = await flows.list(spec.flow, { page, pageSize });
      return context.json({
        data: result.records.map(outward),
        meta: {
          page,
          pageSize,
          total: result.total,
          parameters: flows.parameters(spec.flow) as Readonly<
            Record<string, unknown>
          >,
        },
      });
    },
  );
  router.post(
    path,
    describeRoute({
      tags,
      summary: `Create a ${spec.noun.toLowerCase()}`,
      operationId: `lifecycleExampleCreate${spec.noun}`,
      description: spec.description,
      responses: {
        201: dataResponse(ExampleRecord, 'The record, in its initial state.'),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('json', spec.input),
    async (context) => {
      const body = context.req.valid('json');
      // Created by whoever is signed in; the customer it is for is in the body.
      const actor = signedInUser(context);
      return context.json(
        { data: outward(await spec.create(flows, body, actor)) },
        201,
      );
    },
  );
}

/** The five flows' lists and forms, and the console that plays the outside systems. */
export function durableFlowRoutes(
  router: Hono<AuthEnv>,
  base: string,
  flows: DurableFlowService,
): void {
  flowRoutes(router, base, flows, {
    flow: 'orders',
    noun: 'Order',
    plural: 'orders',
    input: CreateOrderInput,
    description:
      'Placed for a customer in `draft`; paying opens the sandbox provider’s checkout.',
    create: (service, body, actor) => service.createOrder(body, actor),
  });
  flowRoutes(router, base, flows, {
    flow: 'exports',
    noun: 'Export',
    plural: 'exports',
    input: CreateExportInput,
    description:
      'Created in `draft`; the sandbox vendor renders it and is polled until it is done.',
    create: (service, body, actor) => service.createExport(body, actor),
  });
  flowRoutes(router, base, flows, {
    flow: 'purchases',
    noun: 'Purchase',
    plural: 'purchases',
    input: CreatePurchaseInput,
    description:
      'Placed for a customer in `draft`; its amount is the item’s price times the quantity.',
    create: (service, body, actor) => service.createPurchase(body, actor),
  });
  flowRoutes(router, base, flows, {
    flow: 'fulfilments',
    noun: 'Fulfilment',
    plural: 'fulfilments',
    input: CreateFulfilmentInput,
    description:
      'Opened for a customer in `preparing`, where it waits for the payment and the warehouse.',
    create: (service, body, actor) => service.createFulfilment(body, actor),
  });
  flowRoutes(router, base, flows, {
    flow: 'subscriptions',
    noun: 'Subscription',
    plural: 'subscriptions',
    input: CreateSubscriptionInput,
    description:
      'Taken out for a customer; the first period is charged at once.',
    create: (service, body, actor) => service.createSubscription(body, actor),
  });

  const sandbox = `${base}/sandbox`;

  router.get(
    `${sandbox}/events`,
    describeRoute({
      tags,
      summary: 'List the sandbox webhooks about a record',
      operationId: 'lifecycleExampleListSandboxEvents',
      description:
        'Every event the simulated systems sent about the record, oldest first, held or delivered, with how its last delivery was answered.',
      responses: {
        200: listResponse(WebhookEventSchema),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', EventsQuery),
    async (context) => {
      const { lifecycle, recordId } = context.req.valid('query');
      const events = await flows.events(lifecycle, recordId);
      return context.json({ data: events, meta: { total: events.length } });
    },
  );

  router.post(
    `${sandbox}/events`,
    describeRoute({
      tags,
      summary: 'Send a sandbox webhook',
      operationId: 'lifecycleExampleSendSandboxEvent',
      description:
        'Plays the warehouse, the carrier or the payment provider: stores an event about the record and delivers it to the webhook route, signed, unless `hold` keeps it back to be delivered later.',
      responses: {
        201: dataResponse(WebhookEventSchema, 'The event as stored.'),
        400: apiErrorResponse(
          400,
          'The sandbox does not send that event (`UNKNOWN_WEBHOOK_EVENT`).',
        ),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('json', EmitEventInput),
    async (context) => {
      const body = context.req.valid('json');
      const event = await flows.emit({
        source: body.source,
        type: body.type,
        recordId: body.recordId,
        data: body.data,
        hold: body.hold,
        ...(body.occurredAt ? { occurredAt: body.occurredAt } : {}),
      });
      return context.json({ data: event }, 201);
    },
  );

  router.post(
    `${sandbox}/events/:eventId/deliver`,
    describeRoute({
      tags,
      summary: 'Deliver a sandbox webhook',
      operationId: 'lifecycleExampleDeliverSandboxEvent',
      description:
        'Delivers a held event, or one already delivered a second time, as a provider retrying it would.',
      responses: {
        200: dataResponse(WebhookEventSchema, 'The event afterwards.'),
        401: apiErrorResponse(401),
        404: apiErrorResponse(
          404,
          'No such event (`WEBHOOK_EVENT_NOT_FOUND`).',
        ),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('param', EventParams),
    async (context) => {
      const { eventId } = context.req.valid('param');
      return context.json({ data: await flows.deliver(eventId) });
    },
  );

  router.post(
    `${sandbox}/orders/:recordId/pay`,
    describeRoute({
      tags,
      summary: 'Pay an order on the sandbox checkout',
      operationId: 'lifecycleExamplePaySandboxCheckout',
      description:
        'Plays the customer on the provider’s hosted checkout of the order’s current round: the session is paid or declined at the provider, which then sends its webhook, now or — with `hold` — when it is delivered by hand.',
      responses: {
        201: dataResponse(WebhookEventSchema, 'The webhook the provider sent.'),
        400: apiErrorResponse(
          400,
          'The checkout is not open (`SANDBOX_SESSION_CLOSED`).',
        ),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('param', RecordParams),
    apiValidator('json', PayCheckoutInput),
    async (context) => {
      const { recordId } = context.req.valid('param');
      const { outcome, hold } = context.req.valid('json');
      return context.json(
        { data: await flows.payCheckout(recordId, outcome, hold) },
        201,
      );
    },
  );

  router.get(
    `${sandbox}/checkouts/:sessionId`,
    describeRoute({
      tags,
      summary: 'Get a sandbox checkout session',
      operationId: 'lifecycleExampleGetSandboxCheckout',
      description: 'The session as the payment provider keeps it.',
      responses: {
        200: dataResponse(CheckoutSessionSchema),
        401: apiErrorResponse(401),
        404: apiErrorResponse(404, 'No such session (`SANDBOX_NOT_FOUND`).'),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('param', CheckoutParams),
    async (context) => {
      const { sessionId } = context.req.valid('param');
      return context.json({ data: await flows.checkout(sessionId) });
    },
  );

  router.get(
    `${sandbox}/stock`,
    describeRoute({
      tags,
      summary: 'List the sandbox warehouse’s stock',
      operationId: 'lifecycleExampleListSandboxStock',
      description:
        'How many of each flash-sale item are left, and how many are held by reservations.',
      responses: {
        200: listResponse(StockLevelSchema),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    async (context) => {
      const stock = await flows.stock();
      return context.json({ data: stock, meta: { total: stock.length } });
    },
  );
}
