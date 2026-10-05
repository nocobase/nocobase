import type {
  DatabaseManager,
  RepositoryRecord,
  UpdateMutationValues,
} from '@nocobase/db';
import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { ORDERS } from '../sales-authorization.js';
import {
  AUTHORIZATION_EXAMPLE_DOMAIN,
  AUTHORIZATION_EXAMPLE_TAGS as tags,
  authorizeSalesAction,
  bodyTooLargeResponse,
  forbidden,
  forbiddenResponse,
  type SalesActionEnv,
  stateConflict,
  stateConflictError,
  writableRepository,
} from './mutations.js';
import {
  DeliverOrderInput,
  OrderParams,
  OrderRelations,
  SalesOrder,
  UpdateOrderRelationsInput,
} from './schemas.js';

export function createOrderRoutes(
  database: DatabaseManager,
): Hono<SalesActionEnv> {
  const router = new Hono<SalesActionEnv>();

  router.get(
    '/sales/orders/:orderId/relations',
    authorizeSalesAction('example.sales.orders', 'view'),
    describeRoute({
      tags,
      summary: "Get an order's relations",
      operationId: 'authorizationExampleGetOrderRelations',
      description:
        "The order's carrier, checks and collaborators, which mutation operations the caller's `manageRelations` grant allows on each, and the carriers it may connect. Requires `composite:example.sales.orders` `view`.",
      responses: {
        200: dataResponse(OrderRelations),
        ...apiErrorResponses,
        403: forbiddenResponse,
      },
    }),
    apiValidator('param', OrderParams),
    async (c) => {
      const { orderId } = c.req.valid('param');
      const order = await database
        .repository(ORDERS)
        .withPolicy(c.var.salesPolicies[ORDERS])
        .findOne({
          filter: { id: orderId },
          select: (select) =>
            select
              .fields('id', 'title', 'status')
              .include('carrier', (carrier) => carrier.fields('id', 'title'))
              .include('checks', (checks) =>
                checks.fields('id', 'title', 'done'),
              )
              .include('collaborators', (carrier) =>
                carrier.fields('id', 'title'),
              ),
        });
      if (!order) throw forbidden();

      const manage = await c.var.authz.authorize({
        resource: { type: 'composite', id: 'example.sales.orders' },
        action: 'manageRelations',
      });

      const policy =
        manage.effect !== 'deny'
          ? manage.conditions?.database?.[ORDERS]
          : undefined;
      const editable =
        policy &&
        (await writableRepository(database, ORDERS, policy, [])?.findOne({
          filter: { id: orderId },
        }));

      const write =
        editable && order.status === 'ready' ? policy?.update : undefined;
      const relations = write && write !== true ? write.relations : undefined;

      const operations: Record<string, string[]> = {};
      const options: Record<string, RepositoryRecord[]> = {};
      for (const name of ['carrier', 'checks', 'collaborators']) {
        const node = write === true ? true : relations && relations[name];
        if (node === true) {
          operations[name] = [
            'create',
            'update',
            'upsert',
            'connect',
            'disconnect',
            'set',
            'delete',
          ];
        } else if (node) {
          operations[name] = Object.keys(node).filter((key) => key !== 'scope');
        } else {
          operations[name] = [];
        }

        if (
          name !== 'checks' &&
          node &&
          (node === true || node.connect || node.set)
        ) {
          options[name] = await database
            .repository('authorizationExampleCarriers')
            .withPolicy({
              read: {
                scope: node === true ? true : (node.scope ?? true),
                fields: ['id', 'title'],
                relations: false,
              },
              create: false,
              update: false,
              delete: false,
            })
            .findMany({
              select: (select) => select.fields('id', 'title'),
              sort: (sort) => sort.field('title').asc(),
            });
        }
      }

      let access = 'allowed';
      if (!policy) access = 'notGranted';
      else if (!editable) access = 'outsideScope';
      else if (order.status !== 'ready') access = 'notReady';

      return c.json({
        data: {
          ...order,
          operations,
          options,
          access,
        },
      });
    },
  );

  router.patch(
    '/sales/orders/:orderId/relations',
    authorizeSalesAction('example.sales.orders', 'manageRelations'),
    describeRoute({
      tags,
      summary: "Update a ready order's relations",
      operationId: 'authorizationExampleUpdateOrderRelations',
      description:
        'Applies a Repository mutation tree to the order\'s `carrier`, `checks` or `collaborators`, such as `{ "carrier": { "connect": { "id": "carrier-1" } } }`. The bound Policy decides which operations and targets are allowed. Requires `composite:example.sales.orders` `manageRelations`.',
      responses: {
        200: dataResponse(SalesOrder, 'The updated order.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The tree is one the Policy refuses, or the order is no longer ready (`STATE_CONFLICT`).',
        ),
        403: forbiddenResponse,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', OrderParams),
    apiValidator('json', UpdateOrderRelationsInput),
    async (c) => {
      const { orderId } = c.req.valid('param');
      const values = c.req.valid('json');
      const policy = c.var.salesPolicies[ORDERS];

      const order = await writableRepository(
        database,
        ORDERS,
        policy,
        [],
      )?.findOne({
        filter: { id: orderId },
      });
      if (!order) throw forbidden();
      if (order.status !== 'ready')
        throw stateConflictError(
          'Only a ready order can change its relations.',
        );

      // Recheck state in the mutation predicate; DB executes nested writes atomically.

      const { record } = await database
        .repository(ORDERS)
        .withPolicy(policy)
        .updateOne({
          filter: { id: orderId, status: 'ready' },
          values: values as UpdateMutationValues<Partial<RepositoryRecord>>,
        });

      return c.json({ data: record });
    },
  );

  router.post(
    '/sales/orders/:orderId/deliver',
    authorizeSalesAction('example.sales.orders', 'deliver'),
    describeRoute({
      tags,
      summary: 'Deliver an order',
      operationId: 'authorizationExampleDeliverOrder',
      description:
        'Moves a ready order to `delivered` with its delivery reference. Requires `composite:example.sales.orders` `deliver` with `status` and `deliveryReference` writable.',
      responses: {
        200: dataResponse(SalesOrder, 'The delivered order.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The reference is blank (`DELIVERY_REFERENCE_REQUIRED`), or the order is no longer ready (`STATE_CONFLICT`).',
        ),
        403: forbiddenResponse,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', OrderParams),
    apiValidator('json', DeliverOrderInput),
    async (c) => {
      const { orderId } = c.req.valid('param');
      const values = c.req.valid('json');
      if (!values.deliveryReference.trim())
        throw new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'DELIVERY_REFERENCE_REQUIRED',
          domain: AUTHORIZATION_EXAMPLE_DOMAIN,
          message: 'A delivery reference is required.',
          fieldViolations: [
            { field: 'deliveryReference', description: 'Must not be blank.' },
          ],
        });
      const policy = c.var.salesPolicies[ORDERS];

      const order = await writableRepository(database, ORDERS, policy, [
        'status',
        'deliveryReference',
      ])?.findOne({ filter: { id: orderId } });
      if (!order) throw forbidden();
      if (order.status !== 'ready')
        throw stateConflictError('Only a ready order can be delivered.');

      const { record } = await database
        .repository(ORDERS)
        .withPolicy(policy)
        .updateOne({
          filter: { id: orderId, status: 'ready' },
          values: { ...values, status: 'delivered' },
        })
        .catch(stateConflict);

      return c.json({ data: record });
    },
  );

  return router;
}
