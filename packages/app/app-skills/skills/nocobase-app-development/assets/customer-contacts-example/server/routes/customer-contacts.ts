import { Hono } from 'hono';
import type { Application } from '@nocobase/app-server/application';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import { CustomerContactsService } from '../providers/customer-contacts.js';

const Id = z.string().min(1).max(64);
const Status = z.enum(['active', 'paused', 'closed']);
const Name = z.string().trim().min(1).max(100);
const Customer = z
  .object({
    id: Id,
    name: z.string(),
    status: Status,
    ownerId: Id,
    notes: z.string(),
  })
  .meta({ ref: 'CrmExampleCustomer' });
const Contact = z
  .object({
    id: Id,
    customerId: Id,
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    title: z.string(),
  })
  .meta({ ref: 'CrmExampleContact' });
const Rep = z
  .object({ id: Id, name: z.string(), active: z.boolean() })
  .meta({ ref: 'CrmExampleRep' });
const Query = z.object({
  search: z.string().trim().max(100).optional(),
  status: Status.optional(),
  ownerId: Id.optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(10),
});
const Meta = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
const Params = z.object({ id: Id });
const ContactInput = z.strictObject({
  customerId: Id,
  name: Name,
  email: z.union([z.email().max(254), z.literal('')]),
  phone: z.string().trim().max(100),
  title: z.string().trim().max(100),
});
const CustomerInput = z.union([
  z
    .strictObject({
      name: Name.optional(),
      notes: z.string().max(2000).optional(),
      status: Status.optional(),
    })
    .refine((v) => Object.keys(v).length > 0),
  z.strictObject({ ownerId: Id }),
]);
const BatchInput = z.strictObject({
  ids: z
    .array(Id)
    .min(1)
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length),
  values: z.union([
    z.strictObject({ status: Status }),
    z.strictObject({ ownerId: Id }),
  ]),
});
const BatchResult = z.object({
  items: z.array(
    z.union([
      z.object({ id: Id, outcome: z.literal('updated') }),
      z.object({
        id: Id,
        outcome: z.literal('failed'),
        reason: z.enum(['FORBIDDEN', 'STATE_CONFLICT']),
      }),
    ]),
  ),
  updated: z.number(),
  failed: z.number(),
});
const Saved = z.object({ saved: z.boolean() });
const doc = (
  operationId: string,
  summary: string,
  schema: z.ZodType,
  list = false,
  status = 200,
) =>
  describeRoute({
    tags: ['CustomerContactsExample'],
    operationId,
    summary,
    description:
      'Requires native authentication and the corresponding CRM business action. Hidden and missing records both return 403. Writes recheck field, record and target policies; closed customers cannot be changed.',
    responses: {
      [status]: list ? listResponse(schema, Meta) : dataResponse(schema),
      ...apiErrorResponses,
      400: apiErrorResponse(400),
      409: apiErrorResponse(
        409,
        'The customer is closed (STATE_CONFLICT); the transaction is rolled back.',
      ),
      413: apiErrorResponse(413, 'The request exceeds 32 KiB.'),
    },
  });

export const customerContactsRoutes = defineApiRoutes((app: Application) => {
  const router = new Hono<AuthEnv & AuthorizationEnv>();
  router.onError(apiErrorHandler);
  router.use(
    '/customerContacts/*',
    app.container.resolve(authenticationToken).required({ scopedKeys: false }),
    app.container.resolve(authorizationToken).middleware(),
    bodyLimit({
      maxSize: 32 * 1024,
      onError: () => {
        throw new ApiError({
          status: 'INVALID_ARGUMENT',
          httpStatus: 413,
          reason: 'BODY_TOO_LARGE',
          domain: 'customerContacts',
          message: 'The request exceeds 32 KiB.',
        });
      },
    }),
  );
  if (!app.container.has(databaseManagerToken)) {
    router.all('/customerContacts/*', describeRoute({ hide: true }), () => {
      throw new ApiError({
        status: 'UNAVAILABLE',
        reason: 'DATABASE_UNAVAILABLE',
        domain: 'customerContacts',
        message: 'The database is unavailable.',
      });
    });
    return new Hono().route('/', router);
  }
  const database = app.container.resolve(databaseManagerToken);
  router.get(
    '/customerContacts/customers',
    doc('crmExampleListCustomers', 'List permitted customers', Customer, true),
    apiValidator('query', Query),
    async (c) =>
      c.json(
        await new CustomerContactsService(
          database.connection(),
          c.get('authz'),
        ).listCustomers(c.req.valid('query')),
      ),
  );
  router.get(
    '/customerContacts/customers/options',
    doc(
      'crmExampleCustomerOptions',
      'Search permitted customer options',
      Customer,
      true,
    ),
    apiValidator('query', Query),
    async (c) =>
      c.json(
        await new CustomerContactsService(
          database.connection(),
          c.get('authz'),
        ).listCustomers(c.req.valid('query')),
      ),
  );
  router.get(
    '/customerContacts/salesReps/options',
    doc('crmExampleRepOptions', 'Search permitted active owners', Rep, true),
    apiValidator('query', Query),
    async (c) =>
      c.json(
        await new CustomerContactsService(
          database.connection(),
          c.get('authz'),
        ).listReps(c.req.valid('query')),
      ),
  );
  router.get(
    '/customerContacts/salesReps/:id',
    doc('crmExampleGetRep', 'Read a selected owner', Rep),
    apiValidator('param', Params),
    async (c) =>
      c.json({
        data: await new CustomerContactsService(
          database.connection(),
          c.get('authz'),
        ).getRep(c.req.valid('param').id),
      }),
  );
  router.get(
    '/customerContacts/customers/:id',
    doc('crmExampleGetCustomer', 'Read a customer', Customer),
    apiValidator('param', Params),
    async (c) =>
      c.json({
        data: await new CustomerContactsService(
          database.connection(),
          c.get('authz'),
        ).getCustomer(c.req.valid('param').id),
      }),
  );
  const mutate = async <T>(
    authz: AuthorizationEnv['Variables']['authz'],
    kind: 'customer' | 'contact' | 'reset',
    values: Parameters<CustomerContactsService['updateCustomer']>[1],
    execute: (service: CustomerContactsService) => Promise<T>,
  ) => {
    const service = new CustomerContactsService(database.connection(), authz);
    // Resolve authorization through its native store before acquiring the business transaction.
    await service.prepareWrite(kind, values);
    return database.transaction((connection) =>
      execute(service.withConnection(connection)),
    );
  };
  router.patch(
    '/customerContacts/customers/:id',
    doc(
      'crmExampleUpdateCustomer',
      'Edit customer details or assign an owner',
      Customer,
    ),
    apiValidator('param', Params),
    apiValidator('json', CustomerInput),
    async (c) =>
      c.json({
        data: await mutate(
          c.get('authz'),
          'customer',
          c.req.valid('json'),
          (service) =>
            service.updateCustomer(
              c.req.valid('param').id,
              c.req.valid('json'),
            ),
        ),
      }),
  );
  router.post(
    '/customerContacts/customers/batchUpdate',
    doc(
      'crmExampleBatchUpdateCustomers',
      'Assign one value to selected customers',
      BatchResult,
    ),
    apiValidator('json', BatchInput),
    async (c) =>
      c.json({
        data: await mutate(
          c.get('authz'),
          'customer',
          c.req.valid('json').values,
          (service) =>
            service.updateCustomers(
              c.req.valid('json').ids,
              c.req.valid('json').values,
            ),
        ),
      }),
  );
  router.get(
    '/customerContacts/customers/:id/contacts',
    doc(
      'crmExampleListContacts',
      'List contacts for a permitted customer',
      Contact,
      true,
    ),
    apiValidator('param', Params),
    apiValidator('query', Query),
    async (c) =>
      c.json(
        await new CustomerContactsService(
          database.connection(),
          c.get('authz'),
        ).listContacts(c.req.valid('param').id, c.req.valid('query')),
      ),
  );
  router.get(
    '/customerContacts/contacts/:id',
    doc('crmExampleGetContact', 'Read a contact', Contact),
    apiValidator('param', Params),
    async (c) =>
      c.json({
        data: await new CustomerContactsService(
          database.connection(),
          c.get('authz'),
        ).getContact(c.req.valid('param').id),
      }),
  );
  router.post(
    '/customerContacts/contacts',
    doc('crmExampleCreateContact', 'Create a contact', Contact, false, 201),
    apiValidator('json', ContactInput),
    async (c) =>
      c.json(
        {
          data: await mutate(c.get('authz'), 'contact', {}, (service) =>
            service.saveContact(c.req.valid('json')),
          ),
        },
        201,
      ),
  );
  router.patch(
    '/customerContacts/contacts/:id',
    doc('crmExampleUpdateContact', 'Edit a contact and its customer', Contact),
    apiValidator('param', Params),
    apiValidator('json', ContactInput),
    async (c) =>
      c.json({
        data: await mutate(c.get('authz'), 'contact', {}, (service) =>
          service.saveContact(c.req.valid('json'), c.req.valid('param').id),
        ),
      }),
  );
  router.delete(
    '/customerContacts/contacts/:id',
    doc('crmExampleDeleteContact', 'Delete a contact', Saved),
    apiValidator('param', Params),
    async (c) =>
      c.json({
        data: await mutate(c.get('authz'), 'contact', {}, (service) =>
          service.deleteContact(c.req.valid('param').id),
        ),
      }),
  );
  router.post(
    '/customerContacts/reset',
    doc(
      'crmExampleReset',
      'Reset the customer/contact learning dataset',
      Saved,
    ),
    async (c) =>
      c.json({
        data: await mutate(c.get('authz'), 'reset', {}, (service) =>
          service.reset(),
        ),
      }),
  );
  return new Hono().route('/', router);
});
