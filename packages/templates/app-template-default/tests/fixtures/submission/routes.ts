import {
  authorizationToken,
  grantBacked,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  ApiError,
  defineApiRoutes,
  defineRepositoryApiRoutes,
  executeIdempotentMutation,
  describeRoute,
  apiValidator,
  dataResponse,
  apiErrorResponses,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import {
  createRepositoryLifecycleStore,
  defineLifecycle,
  LifecycleRuntime,
  type LifecycleRecord,
} from '@nocobase/lifecycle';
import { Hono } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

interface Borrowing extends LifecycleRecord {
  status: 'draft' | 'approved';
  name: string;
  assetTag: string;
}
type BorrowingTypes = {
  record: Borrowing;
  state: Borrowing['status'];
  parameters: Record<string, never>;
  services: Record<string, never>;
};
/** Isolated synthetic business fixture. Authentication uses this application's native session. */
export default defineApiRoutes(async (app: Application) => {
  const database = app.container.resolve(databaseManagerToken);
  const connection = database.connection();
  const auth = app.container.resolve(authenticationToken);
  const authorization = app.container.resolve(authorizationToken);
  authorization.resourceTypes.add({
    type: 'submissionBorrowing',
    actions: ['read', 'create', 'update', 'delete', 'approve'],
    authorize: grantBacked(),
  });
  const runtime = new LifecycleRuntime({
    store: createRepositoryLifecycleStore(database),
  });
  runtime.register(
    defineLifecycle<BorrowingTypes>({
      name: 'borrowings',
      initial: 'draft',
      states: ['draft', { name: 'approved', final: true }],
      transitions: {
        approve: {
          from: 'draft',
          to: 'approved',
          onTransition: async ({ record, transactionHandle }) => {
            const tx = transactionHandle as typeof connection;
            await tx.repository('inventoryEntries').createOne({
              values: { id: randomUUID(), borrowingId: record.id },
            });
          },
        },
      },
    }),
  );
  const router = new Hono<AuthEnv & AuthorizationEnv>();
  router.use('*', auth.required(), authorization.middleware());
  router.use('*', async (c, next) => {
    const path = c.req.path;
    const action = path.endsWith('/createOne')
      ? 'create'
      : path.endsWith('/updateOne')
        ? 'update'
        : path.endsWith('/deleteOne')
          ? 'delete'
          : path.endsWith('/approve')
            ? 'approve'
            : 'read';
    await c.get('authz').require(
      path.endsWith('/fixtureAccess')
        ? {
            resource: {
              type: 'settings',
              id: 'authorization.permission-sets',
            },
            action: 'update',
          }
        : { resource: { type: 'submissionBorrowing', id: '*' }, action },
    );
    await next();
  });
  let revoked = false;
  router.use('*', async (c, next) => {
    if (revoked && !c.req.path.endsWith('/fixtureAccess'))
      throw new ApiError({
        status: 'PERMISSION_DENIED',
        reason: 'FIXTURE_REVOKED',
        domain: 'submissionFixture',
        message: 'The business permission was revoked.',
      });
    await next();
  });
  const routes = defineRepositoryApiRoutes({
    repositories: [
      {
        name: 'borrowings',
        policy: {
          read: true,
          create: {
            scope: true,
            fields: ['id', 'name', 'assetTag', 'statusChangedAt'],
          },
          update: { scope: true, fields: ['name', 'assetTag'] },
          delete: true,
        },
        actions: { findMany: {}, createOne: {}, updateOne: {}, deleteOne: {} },
      },
    ],
  });
  router.route('/', await routes.createRouter(app));
  const info = (operationId: string, summary: string) =>
    describeRoute({
      tags: ['SubmissionFixture'],
      summary,
      operationId,
      responses: { 200: dataResponse(z.unknown()), ...apiErrorResponses },
    });
  router.get(
    '/submissionFixture/evidence',
    info('submissionFixtureEvidence', 'Inspect synthetic business data'),
    async (c) =>
      c.json({
        data: {
          rows: await connection.repository('borrowings').findMany(),
          entries: await connection.repository('inventoryEntries').findMany(),
          history: await connection
            .repository('lifecycleTransitions')
            .findMany(),
        },
      }),
  );
  router.post(
    '/submissionFixture/fixtureAccess',
    info('submissionFixtureAccess', 'Change the synthetic business permission'),
    apiValidator('json', z.strictObject({ revoked: z.boolean() })),
    (c) => {
      revoked = c.req.valid('json').revoked;
      return c.json({ data: { revoked } });
    },
  );
  router.post(
    '/submissionFixture/:id/approve',
    info('submissionFixtureApprove', 'Approve a synthetic borrowing'),
    apiValidator('param', z.object({ id: z.string() })),
    apiValidator('header', z.object({ 'idempotency-key': z.string() })),
    apiValidator('json', z.strictObject({ note: z.string() })),
    async (c) => {
      const user = c.get('auth') as { user: { id: string } };
      const id = c.req.valid('param').id;
      const result = await executeIdempotentMutation({
        connection,
        key: c.req.valid('header')['idempotency-key'],
        principal: user.user.id,
        operation: `borrowings/${id}/approve`,
        input: c.req.valid('json'),
        authorize: async () => {
          if (revoked)
            throw new ApiError({
              status: 'PERMISSION_DENIED',
              reason: 'FIXTURE_REVOKED',
              domain: 'submissionFixture',
              message: 'Permission revoked.',
            });
        },
        authorizeReplay: async () => {
          if (
            !(await connection
              .repository('borrowings')
              .findOne({ filter: { id } }))
          )
            throw new Error('Borrowing unavailable.');
        },
        execute: async (transaction) => {
          await runtime.fire('borrowings', id, 'approve', {
            actor: { id: user.user.id },
            requestId: c.req.valid('header')['idempotency-key'],
            input: c.req.valid('json'),
            transaction,
          });
          return { approved: true, id };
        },
      });
      c.header('Idempotency-Replayed', String(result.replayed));
      return c.json({ data: result.data });
    },
  );
  return new Hono().route('/', router);
});
