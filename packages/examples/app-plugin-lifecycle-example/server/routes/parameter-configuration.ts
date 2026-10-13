import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import {
  apiErrorResponse,
  apiValidator,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { Context, Hono, MiddlewareHandler } from 'hono';
import { z } from 'zod';
import type { JsonObject } from '@nocobase/lifecycle';
import type { ParameterConfigurationService } from '../services/parameter-configuration.js';
import { signedInUser, tags } from './api.js';
import { ActAsQuery } from './schemas.js';

const object = z.record(z.string(), z.unknown());
const groupParams = z.object({ groupId: z.string().min(1).max(100) });
const saveInput = z.strictObject({
  values: object,
  expectedRevision: z.number().int().min(0),
  requestId: z.string().min(1).max(100),
});
function actor(context: Context<AuthEnv>): string {
  signedInUser(context);
  return context.req.query('actAs') ?? signedInUser(context);
}
export function configurationRoutes(
  router: Hono<AuthEnv>,
  base: string,
  service: ParameterConfigurationService,
): void {
  const permission =
    (operation: 'read' | 'write' | 'candidates'): MiddlewareHandler<AuthEnv> =>
    async (context, next) => {
      service.authorize(
        actor(context),
        operation,
        context.req.param('groupId'),
      );
      await next();
    };
  const describe = (
    operationId: string,
    summary: string,
    list: boolean = false,
  ) =>
    describeRoute({
      tags,
      operationId,
      summary,
      responses: {
        200: list
          ? listResponse(object, z.object({ total: z.number().int() }))
          : dataResponse(object),
        400: apiErrorResponse(400),
        401: apiErrorResponse(401),
        403: apiErrorResponse(403),
        404: apiErrorResponse(404),
        409: apiErrorResponse(409),
      },
    });
  router.get(
    `${base}/parameterGroups`,
    permission('read'),
    describe(
      'lifecycleExampleListParameterGroups',
      'List readable parameter groups',
      true,
    ),
    apiValidator('query', ActAsQuery),
    async (context) => {
      const data = await service.list(actor(context));
      return context.json({ data, meta: { total: data.length } });
    },
  );
  const referenceType = z.enum(['department', 'role', 'user']);
  const referenceSchema = z.object({
    id: z.string().meta({ description: 'Scoped reference ID.' }),
    name: z.string().meta({ description: 'Reference display name.' }),
    active: z.boolean().optional(),
  });
  const referenceMeta = z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });
  router.get(
    `${base}/parameterGroups/financeReviewers/references`,
    permission('candidates'),
    describeRoute({
      tags,
      operationId: 'lifecycleExampleSearchReviewerReferences',
      summary: 'Search scoped reviewer references',
      description:
        'Requires a signed-in session and candidate lookup permission. Queries only the selected reference type by name; blank searches return no candidates. Active users only, at most ten results per page.',
      responses: {
        200: listResponse(referenceSchema, referenceMeta),
        401: apiErrorResponse(401),
        403: apiErrorResponse(403),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator(
      'query',
      ActAsQuery.extend({
        type: referenceType,
        q: z.string().trim().max(100).default(''),
        page: z.coerce.number().int().min(1).max(100000).default(1),
        pageSize: z.coerce.number().int().min(1).max(10).default(10),
      }),
    ),
    async (context) => {
      const { type, q, page, pageSize } = context.req.valid('query');
      return context.json(
        await service.references(actor(context), type, q, page, pageSize),
      );
    },
  );
  router.get(
    `${base}/parameterGroups/financeReviewers/references/:type/:referenceId`,
    permission('candidates'),
    describeRoute({
      tags,
      operationId: 'lifecycleExampleGetReviewerReference',
      summary: 'Read a selected scoped reviewer reference',
      description:
        'Requires a signed-in session and candidate lookup permission. Resolves only the selected ID, including inactive saved references.',
      responses: {
        200: dataResponse(referenceSchema.nullable()),
        401: apiErrorResponse(401),
        403: apiErrorResponse(403),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator(
      'param',
      z.object({
        type: referenceType,
        referenceId: z.string().min(1).max(100),
      }),
    ),
    apiValidator('query', ActAsQuery),
    async (context) => {
      const { type, referenceId } = context.req.valid('param');
      return context.json({
        data: await service.reference(actor(context), type, referenceId),
      });
    },
  );
  router.post(
    `${base}/parameterGroups/financeReviewers/previewCandidates`,
    permission('candidates'),
    describeRoute({
      tags,
      operationId: 'lifecycleExamplePreviewReviewerCandidates',
      summary: 'Preview eligible candidates without creating tasks',
      responses: {
        200: dataResponse(z.array(z.string())),
        400: apiErrorResponse(400),
        401: apiErrorResponse(401),
        403: apiErrorResponse(403),
      },
    }),
    apiValidator('query', ActAsQuery),
    apiValidator(
      'json',
      z.strictObject({ values: object, applicantId: z.string().min(1) }),
    ),
    async (context) => {
      const { values, applicantId } = context.req.valid('json');
      return context.json({
        data: await service.candidates(
          values as JsonObject,
          applicantId,
          actor(context),
        ),
      });
    },
  );
  router.get(
    `${base}/parameterGroups/:groupId`,
    permission('read'),
    describe(
      'lifecycleExampleGetParameterGroup',
      'Read the current configuration and code-owned bindings',
    ),
    apiValidator('param', groupParams),
    apiValidator('query', ActAsQuery),
    async (context) =>
      context.json({
        data: await service.read(
          context.req.valid('param').groupId,
          actor(context),
        ),
      }),
  );
  router.put(
    `${base}/parameterGroups/:groupId`,
    permission('write'),
    describe(
      'lifecycleExampleSaveParameterGroup',
      'Save a complete immutable configuration version using CAS',
    ),
    apiValidator('param', groupParams),
    apiValidator('query', ActAsQuery),
    apiValidator('json', saveInput),
    async (context) => {
      const { values, expectedRevision, requestId } = context.req.valid('json');
      return context.json({
        data: await service.save(
          context.req.valid('param').groupId,
          values as JsonObject,
          expectedRevision,
          requestId,
          actor(context),
        ),
      });
    },
  );
  router.get(
    `${base}/parameterHistory/:lifecycle/:recordId`,
    permission('read'),
    describe(
      'lifecycleExampleParameterHistory',
      'Read actual historical values separately from current effective values',
    ),
    apiValidator(
      'param',
      z.object({
        lifecycle: z.enum([
          'expenses',
          'tickets',
          'reviewerDemo',
          'reviewerLiveDemo',
        ]),
        recordId: z.string().regex(/^[1-9]\d*$/),
      }),
    ),
    apiValidator('query', ActAsQuery),
    async (context) => {
      const { lifecycle, recordId } = context.req.valid('param');
      return context.json({
        data: await service.history(lifecycle, recordId, actor(context)),
      });
    },
  );
  for (const name of ['reviewerDemo', 'reviewerLiveDemo'] as const)
    router.post(
      `${base}/${name}`,
      permission('read'),
      describeRoute({
        tags,
        operationId:
          name === 'reviewerDemo'
            ? 'lifecycleExampleCreateSnapshotReviewerDemo'
            : 'lifecycleExampleCreateLiveReviewerDemo',
        summary: 'Create a finite any-candidate review demonstration',
        responses: {
          201: dataResponse(object),
          401: apiErrorResponse(401),
          403: apiErrorResponse(403),
        },
      }),
      apiValidator('query', ActAsQuery),
      apiValidator('json', z.strictObject({})),
      async (context) =>
        context.json(
          { data: await service.createReview(name, actor(context)) },
          201,
        ),
    );
}
