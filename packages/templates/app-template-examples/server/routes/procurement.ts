import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { lifecycleExampleServiceToken } from '@nocobase/app-plugin-lifecycle-example/server';
import { databaseManagerToken } from '@nocobase/db';
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
  executeIdempotentMutation,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import {
  ProcurementInput,
  ProcurementUpdate,
  ProcurementDetail,
  ProcurementRecord,
  ProcurementCandidate,
  ProcurementState,
} from '../../shared/procurement.js';
import {
  ProcurementService,
  procurementError,
} from '../providers/procurement.js';

const params = z.object({ id: z.string().uuid() });
const key = z.object({ 'idempotency-key': z.string().min(1).max(200) });
const saved = z.object({ id: z.string(), replayed: z.boolean().optional() });
const describe = (operationId: string, summary: string, schema: z.ZodType) =>
  describeRoute({
    tags: ['Procurement'],
    operationId,
    summary,
    description:
      'Requires a native session and explicit procurement capability. Every record operation also enforces applicant/designated-reviewer scope. No administrator bypass of ownership rules.',
    responses: {
      200: dataResponse(schema),
      400: apiErrorResponse(400),
      404: apiErrorResponse(404),
      409: apiErrorResponse(409),
      ...apiErrorResponses,
    },
  });

export const procurementRoutes = defineApiRoutes((app: Application) => {
  const router = new Hono<AuthEnv>();
  router.onError((error, c) => {
    const fields =
      error instanceof LifecycleError ? lifecycleErrorFields(error) : undefined;
    return apiErrorHandler(
      fields ? new ApiError({ ...fields, domain: 'procurement' }) : error,
      c,
    );
  });
  if (!app.container.has(databaseManagerToken)) {
    // Only registered while storage is unavailable.
    router.all('*', describeRoute({ hide: true }), () => {
      throw new ApiError({
        domain: 'procurement',
        status: 'UNAVAILABLE',
        reason: 'DATABASE_UNAVAILABLE',
        message: 'The database is unavailable.',
      });
    });
    return new Hono().route('/procurement', router);
  }
  const connection = app.container.resolve(databaseManagerToken).connection();
  const service = new ProcurementService(
    connection,
    app.container.resolve(lifecycleExampleServiceToken).runtime,
    app.container.resolve(authorizationToken),
  );
  const permit =
    (action?: 'request' | 'review'): MiddlewareHandler<AuthEnv> =>
    async (c, next) => {
      service.require(await service.actor(c.get('auth')!.user.id), action);
      await next();
    };
  router.use(
    '*',
    app.container.resolve(authenticationToken).required({ scopedKeys: false }),
    bodyLimit({
      maxSize: 64 * 1024,
      onError: () => {
        throw new ApiError({
          domain: 'procurement',
          status: 'INVALID_ARGUMENT',
          httpStatus: 413,
          reason: 'BODY_TOO_LARGE',
          message: 'The request exceeds 64 KiB.',
        });
      },
    }),
  );
  router.get(
    '/context',
    describe(
      'procurementContext',
      'Read procurement capabilities',
      z.object({ id: z.string(), request: z.boolean(), review: z.boolean() }),
    ),
    async (c) => c.json({ data: await service.actor(c.get('auth')!.user.id) }),
  );
  router.get(
    '/candidates',
    permit('request'),
    describeRoute({
      tags: ['Procurement'],
      operationId: 'procurementCandidates',
      summary: 'Search selectable procurement references',
      responses: {
        200: listResponse(ProcurementCandidate),
        ...apiErrorResponses,
      },
    }),
    apiValidator(
      'query',
      z.object({
        kind: z.enum(['suppliers', 'materials', 'reviewers']),
        q: z.string().max(160).default(''),
        active: z.enum(['true', 'false']).default('true'),
      }),
    ),
    async (c) => {
      const q = c.req.valid('query');
      const data = await service.candidates(
        await service.actor(c.get('auth')!.user.id),
        q.kind,
        q.q,
        q.active === 'true',
      );
      return c.json({ data, meta: { total: data.length } });
    },
  );
  router.get(
    '/',
    permit(),
    describeRoute({
      tags: ['Procurement'],
      operationId: 'procurementList',
      summary: 'List your requests and designated reviews',
      responses: {
        200: listResponse(
          ProcurementRecord,
          z.object({
            total: z.number(),
            page: z.number(),
            pageSize: z.number(),
          }),
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator(
      'query',
      z.object({
        q: z.string().max(160).default(''),
        status: ProcurementState.optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
      }),
    ),
    async (c) =>
      c.json(
        await service.list(
          await service.actor(c.get('auth')!.user.id),
          c.req.valid('query'),
        ),
      ),
  );
  router.get(
    '/:id',
    permit(),
    describe(
      'procurementGet',
      'Read a request, its lines and authorized history',
      ProcurementDetail,
    ),
    apiValidator('param', params),
    async (c) =>
      c.json({
        data: await service.detail(
          c.req.valid('param').id,
          await service.actor(c.get('auth')!.user.id),
        ),
      }),
  );
  router.post(
    '/',
    permit('request'),
    describe(
      'procurementCreate',
      'Save a draft and its lines atomically',
      saved,
    ),
    apiValidator('header', key),
    apiValidator('json', ProcurementInput),
    async (c) => {
      const actor = await service.actor(c.get('auth')!.user.id);
      const authorize = async () => {
        if (!(await service.actor(actor.id)).request)
          throw procurementError(
            'PROCUREMENT_FORBIDDEN',
            'An applicant role is required.',
            'PERMISSION_DENIED',
          );
      };
      const eligible = await service.reviewerEligible(
        c.req.valid('json').reviewerId,
        actor,
      );
      const result = await executeIdempotentMutation({
        connection,
        key: c.req.valid('header')['idempotency-key'],
        principal: `${app.appName}:${actor.id}`,
        operation: 'procurement/create',
        input: c.req.valid('json'),
        authorize,
        authorizeReplay: authorize,
        execute: (tx) =>
          service.save(
            actor,
            c.req.valid('json'),
            undefined,
            undefined,
            tx,
            eligible,
          ),
      });
      c.header('Idempotency-Replayed', String(result.replayed));
      return c.json({ data: result.data });
    },
  );
  router.patch(
    '/:id',
    permit('request'),
    describe(
      'procurementUpdate',
      'Save your editable request with its displayed version',
      saved,
    ),
    apiValidator('param', params),
    apiValidator('header', key),
    apiValidator('json', ProcurementUpdate),
    async (c) => {
      const { version, ...input } = c.req.valid('json');
      const actor = await service.actor(c.get('auth')!.user.id);
      const eligible = await service.reviewerEligible(input.reviewerId, actor);
      const id = c.req.valid('param').id;
      const authorize = async () => {
        const current = await service.actor(actor.id);
        const row = await service.row(id, current);
        if (!current.request || row.applicantId !== current.id)
          throw procurementError(
            'PROCUREMENT_FORBIDDEN',
            'Only the applicant can edit.',
            'PERMISSION_DENIED',
          );
      };
      const result = await executeIdempotentMutation({
        connection,
        key: c.req.valid('header')['idempotency-key'],
        principal: `${app.appName}:${actor.id}`,
        operation: `procurement/${id}/update`,
        input: c.req.valid('json'),
        authorize,
        authorizeReplay: authorize,
        execute: (tx) => service.save(actor, input, id, version, tx, eligible),
      });
      c.header('Idempotency-Replayed', String(result.replayed));
      return c.json({ data: result.data });
    },
  );
  router.post(
    '/:id/fire',
    permit(),
    describe(
      'procurementFire',
      'Submit, approve or reject with a version and operation key',
      saved,
    ),
    apiValidator('param', params),
    apiValidator(
      'json',
      z.strictObject({
        transition: z.enum(['submit', 'approve', 'reject']),
        version: z.number().int().nonnegative(),
        requestId: z.string().min(1).max(200),
      }),
    ),
    async (c) => {
      const input = c.req.valid('json');
      return c.json({
        data: await service.fire(
          c.req.valid('param').id,
          await service.actor(c.get('auth')!.user.id),
          input.transition,
          input.version,
          input.requestId,
        ),
      });
    },
  );
  return new Hono().route('/procurement', router);
});
