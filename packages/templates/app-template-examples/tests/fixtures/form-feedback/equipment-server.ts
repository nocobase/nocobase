import { randomUUID } from 'node:crypto';
import type { Application } from '@nocobase/app-server/application';
// Test-only routes for an isolated application; authentication and authorization remain native.
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { databaseManagerToken } from '@nocobase/db';
import {
  ApiError,
  apiErrorHandler,
  apiValidator,
  apiErrorResponse,
  dataResponse,
  describeRoute,
  defineApiRoutes,
} from '@nocobase/app-server/router';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import { Hono } from 'hono';
import { z } from 'zod';

export const equipmentRoutes = defineApiRoutes<Application>((app) => {
  const routes = new Hono<AuthorizationEnv>();
  const auth = app.container.resolve(authenticationToken);
  const db = app.container.resolve(databaseManagerToken);
  routes.use(
    '/equipmentFixture',
    auth.required(),
    app.container.resolve(authorizationToken).middleware(),
  );
  routes.onError(apiErrorHandler);
  const schema = z.object({
    mode: z.string(),
    name: z.string(),
    department: z.string(),
    items: z.array(z.object({ key: z.string(), name: z.string() })),
    attachment: z.string(),
    recordId: z.string().optional(),
  });
  const description = {
    tags: ['Equipment fixture'],
    summary: 'Equipment verification fixture',
    responses: {
      200: dataResponse(z.unknown()),
      400: apiErrorResponse(400),
      401: apiErrorResponse(401),
      403: apiErrorResponse(403),
    },
  };
  routes.get(
    '/equipmentFixture',
    describeRoute({ ...description, operationId: 'equipmentFixtureGet' }),
    async (c) => {
      await c.get('authz').require({
        resource: { type: 'user', id: '*' },
        action: 'create',
      });
      const repository = db.repository('equipmentFixture');
      if (!(await repository.findOne({ filter: { id: 'retained' } })))
        await repository.createOne({
          values: {
            id: 'retained',
            name: 'Legacy camera',
            department: 'Operations',
            attachment: 'safety-check.pdf',
            workflow: 'approved',
            customField: 'asset-714',
          },
        });
      return c.json({
        data: await repository.findOne({ filter: { id: 'retained' } }),
        requests: await repository.findMany({}),
        history: await db.repository('equipmentFixtureHistory').findMany({}),
      });
    },
  );
  routes.post(
    '/equipmentFixture',
    describeRoute({ ...description, operationId: 'equipmentFixtureSave' }),
    apiValidator('json', schema),
    async (c) => {
      await c.get('authz').require({
        resource: { type: 'user', id: '*' },
        action: 'create',
      });
      const input = c.req.valid('json');
      if (input.mode === 'denied')
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          reason: 'RESTRICTED',
          domain: 'equipment-fixture',
          message: 'Private equipment details',
        });
      if (input.mode !== 'success' && input.mode !== 'approve')
        throw new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'EQUIPMENT_INVALID',
          domain: 'equipment-fixture',
          message: 'Private developer stack',
          fieldViolations:
            input.mode === 'structured'
              ? [
                  {
                    field: 'items[1].name',
                    description: 'Private item value',
                    reason: 'ITEM',
                  },
                  {
                    field: 'items.0.name',
                    description: 'Private item value',
                    reason: 'ITEM',
                  },
                ]
              : input.mode === 'business'
                ? [
                    {
                      field: 'department',
                      reason: 'DEPARTMENT',
                      description: 'Private business detail',
                    },
                  ]
                : [
                    {
                      field: 'privateSalary',
                      description: 'Secret salary 123',
                    },
                  ],
        });
      return db.transaction(async (connection) => {
        const repository = connection.repository('equipmentFixture');
        const history = connection.repository('equipmentFixtureHistory');
        if (input.mode === 'approve') {
          const request = await repository.findOne({
            filter: { id: input.recordId, workflow: 'submitted' },
          });
          if (!request)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              reason: 'NOT_SUBMITTED',
              domain: 'equipment-fixture',
              message: 'Only submitted requests can be approved.',
            });
          await repository.updateMany({
            filter: { id: input.recordId, workflow: 'submitted' },
            values: { workflow: 'approved' },
          });
          await history.createOne({
            values: {
              id: randomUUID(),
              recordId: input.recordId,
              event: 'approved',
              actor: 'native-administrator',
            },
          });
          return c.json({
            data: await repository.findOne({ filter: { id: input.recordId } }),
          });
        }
        if (input.department !== 'Operations')
          throw new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: 'DEPARTMENT',
            domain: 'equipment-fixture',
            message: 'Private business detail',
            fieldViolations: [
              {
                field: 'department',
                reason: 'DEPARTMENT',
                description: 'Private business detail',
              },
            ],
          });
        const id = randomUUID();
        await repository.createOne({
          values: {
            id,
            name: input.name,
            department: input.department,
            attachment: input.attachment,
            workflow: 'submitted',
            customField: 'asset-714',
          },
        });
        await history.createOne({
          values: {
            id: randomUUID(),
            recordId: id,
            event: 'submitted',
            actor: 'native-administrator',
          },
        });
        return c.json({ data: await repository.findOne({ filter: { id } }) });
      });
    },
  );
  return new Hono().route('/', routes);
});
