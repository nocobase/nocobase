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
  OnboardingInput,
  OnboardingUpdate,
  OnboardingDetail,
  OnboardingRecord,
  OnboardingState,
} from '../../shared/onboarding.js';
import { OnboardingService, onboardingError } from '../providers/onboarding.js';

const params = z.object({ id: z.string().uuid() });
const key = z.object({ 'idempotency-key': z.string().min(1).max(200) });
const saved = z.object({ id: z.string() });
const describe = (operationId: string, summary: string, schema: z.ZodType) =>
  describeRoute({
    tags: ['Onboarding'],
    operationId,
    summary,
    description:
      'Requires a native session and an explicit onboarding capability. Drafts are private to their coordinator; HR viewers can read submitted cases only. No ownership bypass for administrators.',
    responses: {
      200: dataResponse(schema),
      404: apiErrorResponse(404),
      409: apiErrorResponse(409),
      ...apiErrorResponses,
    },
  });
export const onboardingRoutes = defineApiRoutes((app: Application) => {
  const router = new Hono<AuthEnv>();
  router.onError((error, c) => {
    const fields =
      error instanceof LifecycleError ? lifecycleErrorFields(error) : undefined;
    return apiErrorHandler(
      fields ? new ApiError({ ...fields, domain: 'onboarding' }) : error,
      c,
    );
  });
  if (!app.container.has(databaseManagerToken)) {
    // Only registered while storage is unavailable.
    router.all('*', describeRoute({ hide: true }), () => {
      throw new ApiError({
        domain: 'onboarding',
        reason: 'DATABASE_UNAVAILABLE',
        message: 'The database is unavailable.',
        status: 'UNAVAILABLE',
      });
    });
    return new Hono().route('/onboarding', router);
  }
  const connection = app.container.resolve(databaseManagerToken).connection();
  const service = new OnboardingService(
    connection,
    app.container.resolve(lifecycleExampleServiceToken).runtime,
    app.container.resolve(authorizationToken),
  );
  const permit =
    (action?: 'coordinate' | 'view'): MiddlewareHandler<AuthEnv> =>
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
        throw onboardingError(
          'BODY_TOO_LARGE',
          'The request exceeds 64 KiB.',
          'INVALID_ARGUMENT',
          413,
        );
      },
    }),
  );
  router.get(
    '/context',
    describe(
      'onboardingContext',
      'Read onboarding capabilities',
      z.object({ id: z.string(), coordinate: z.boolean(), view: z.boolean() }),
    ),
    async (c) => c.json({ data: await service.actor(c.get('auth')!.user.id) }),
  );
  router.get(
    '/candidates',
    permit('coordinate'),
    describeRoute({
      tags: ['Onboarding'],
      operationId: 'onboardingCandidates',
      summary: 'Search active authorized departments',
      responses: {
        200: listResponse(z.object({ id: z.string(), name: z.string() })),
        ...apiErrorResponses,
      },
    }),
    apiValidator(
      'query',
      z.object({
        kind: z.literal('departments'),
        q: z.string().max(160).default(''),
      }),
    ),
    async (c) => {
      const data = await service.candidates(
        await service.actor(c.get('auth')!.user.id),
        c.req.valid('query').q,
      );
      return c.json({ data, meta: { total: data.length } });
    },
  );
  router.get(
    '/',
    permit(),
    describeRoute({
      tags: ['Onboarding'],
      operationId: 'onboardingList',
      summary: 'List your onboarding cases and authorized submitted cases',
      responses: {
        200: listResponse(
          OnboardingRecord,
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
        status: OnboardingState.optional(),
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
      'onboardingGet',
      'Read an authorized case, documents, employee and history',
      OnboardingDetail,
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
    permit('coordinate'),
    describe(
      'onboardingCreate',
      'Save your draft and documents atomically',
      saved,
    ),
    apiValidator('header', key),
    apiValidator('json', OnboardingInput),
    async (c) => {
      const actor = await service.actor(c.get('auth')!.user.id);
      const authorize = async () =>
        service.require(await service.actor(actor.id), 'coordinate');
      const result = await executeIdempotentMutation({
        connection,
        key: c.req.valid('header')['idempotency-key'],
        principal: `${app.appName}:${actor.id}`,
        operation: 'onboarding/create',
        input: c.req.valid('json'),
        authorize,
        authorizeReplay: authorize,
        execute: (tx) =>
          service.save(actor, c.req.valid('json'), undefined, undefined, tx),
      });
      c.header('Idempotency-Replayed', String(result.replayed));
      return c.json({ data: result.data });
    },
  );
  router.patch(
    '/:id',
    permit('coordinate'),
    describe(
      'onboardingUpdate',
      'Save your draft using its displayed version',
      saved,
    ),
    apiValidator('param', params),
    apiValidator('header', key),
    apiValidator('json', OnboardingUpdate),
    async (c) => {
      const actor = await service.actor(c.get('auth')!.user.id),
        id = c.req.valid('param').id;
      const { version, ...input } = c.req.valid('json');
      const authorize = async () =>
        service.authorizeWrite(id, await service.actor(actor.id));
      const result = await executeIdempotentMutation({
        connection,
        key: c.req.valid('header')['idempotency-key'],
        principal: `${app.appName}:${actor.id}`,
        operation: `onboarding/${id}/update`,
        input: c.req.valid('json'),
        authorize,
        authorizeReplay: authorize,
        execute: (tx) => service.save(actor, input, id, version, tx),
      });
      c.header('Idempotency-Replayed', String(result.replayed));
      return c.json({ data: result.data });
    },
  );
  router.post(
    '/:id/fire',
    permit('coordinate'),
    describe(
      'onboardingSubmit',
      'Validate the complete draft and create one employee atomically',
      saved,
    ),
    apiValidator('param', params),
    apiValidator('header', key),
    apiValidator(
      'json',
      z.strictObject({
        transition: z.literal('submit'),
        version: z.number().int().nonnegative(),
      }),
    ),
    async (c) => {
      const actor = await service.actor(c.get('auth')!.user.id),
        id = c.req.valid('param').id;
      const authorize = async () =>
        service.authorizeWrite(id, await service.actor(actor.id));
      const operationKey = c.req.valid('header')['idempotency-key'];
      const result = await executeIdempotentMutation({
        connection,
        key: operationKey,
        principal: `${app.appName}:${actor.id}`,
        operation: `onboarding/${id}/submit`,
        input: c.req.valid('json'),
        authorize,
        authorizeReplay: authorize,
        execute: (tx) =>
          service.submit(
            id,
            actor,
            c.req.valid('json').version,
            operationKey,
            tx,
          ),
      });
      c.header('Idempotency-Replayed', String(result.replayed));
      return c.json({ data: result.data });
    },
  );
  return new Hono().route('/onboarding', router);
});
