import type { AuthorizationEnv } from '@nocobase/authorization/core';
import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { KnowledgeIndexing } from '../indexing/index.js';
import { knowledgeErrorHandler } from './errors.js';
import { tags } from './openapi.js';
import {
  SaveIndexingBody,
  RebuildIndexingBody,
  RetryIndexingBody,
  KnowledgeIndexingReceiptSchema,
  KnowledgeIndexingSettingsSchema,
  KnowledgeIndexingStatusSchema,
  KnowledgeIndexingInstanceSchema,
  KnowledgeEmbeddingServiceSchema,
  KnowledgeIndexingDirectoryMetaSchema,
} from './schemas.js';

/** Authentication runs in the parent; the original authorization middleware retains API-key scope. */
export function createKnowledgeIndexingRoutes(
  service: KnowledgeIndexing,
  authorization: MiddlewareHandler<AuthorizationEnv>,
): Hono<AuthorizationEnv> {
  const router = new Hono<AuthorizationEnv>();
  router.onError(knowledgeErrorHandler);
  const access =
    (action: string): MiddlewareHandler<AuthorizationEnv> =>
    async (context, next) => {
      await context
        .get('authz')
        .require({ resource: { type: 'settings', id: 'kb.indexing' }, action });
      await next();
    };
  const limited = bodyLimit({
    maxSize: 32 * 1024,
    onError: () => {
      throw new ApiError({
        status: 'INVALID_ARGUMENT',
        httpStatus: 413,
        reason: 'BODY_TOO_LARGE',
        domain: 'knowledge',
        message: 'The indexing request body must not exceed 32 KiB.',
      });
    },
  });
  const conflicts = {
    409: apiErrorResponse(
      409,
      'The settings revision or request id conflicts with a previous operation.',
    ),
  };
  const precondition = {
    400: apiErrorResponse(
      400,
      'The index configuration or its dependencies do not allow this operation.',
    ),
  };
  router.get(
    '/indexingSettings',
    authorization,
    access('read'),
    describeRoute({
      tags,
      summary: 'Read global Knowledge index settings',
      operationId: 'knowledgeGetIndexingSettings',
      responses: {
        200: dataResponse(KnowledgeIndexingSettingsSchema),
        ...apiErrorResponses,
      },
    }),
    async (c) => c.json({ data: await service.settings(c.get('authz')) }),
  );
  router.put(
    '/indexingSettings',
    authorization,
    access('configure'),
    describeRoute({
      tags,
      summary: 'Replace global Knowledge index settings',
      operationId: 'knowledgeReplaceIndexingSettings',
      description:
        'A non-null configuration acknowledges reindexing all spaces and possible model costs. A receipt confirms durable acceptance, not completion.',
      responses: {
        200: dataResponse(KnowledgeIndexingReceiptSchema),
        ...apiErrorResponses,
        ...precondition,
        ...conflicts,
        413: apiErrorResponse(413),
      },
    }),
    limited,
    apiValidator('json', SaveIndexingBody),
    async (c) =>
      c.json({ data: await service.save(c.get('authz'), c.req.valid('json')) }),
  );
  router.get(
    '/indexingSettings/status',
    authorization,
    access('read'),
    describeRoute({
      tags,
      summary: 'Read global Knowledge index progress',
      operationId: 'knowledgeGetIndexingStatus',
      responses: {
        200: dataResponse(KnowledgeIndexingStatusSchema),
        ...apiErrorResponses,
      },
    }),
    async (c) => c.json({ data: await service.status(c.get('authz')) }),
  );
  router.post(
    '/indexingSettings/rebuild',
    authorization,
    access('rebuild'),
    describeRoute({
      tags,
      summary: 'Rebuild the Knowledge index across all spaces',
      operationId: 'knowledgeRebuildIndexing',
      responses: {
        202: dataResponse(KnowledgeIndexingReceiptSchema),
        ...apiErrorResponses,
        ...precondition,
        ...conflicts,
        413: apiErrorResponse(413),
      },
    }),
    limited,
    apiValidator('json', RebuildIndexingBody),
    async (c) =>
      c.json(
        { data: await service.rebuild(c.get('authz'), c.req.valid('json')) },
        202,
      ),
  );
  router.post(
    '/indexingSettings/retry',
    authorization,
    access('rebuild'),
    describeRoute({
      tags,
      summary: 'Retry failed work in the current Knowledge index',
      operationId: 'knowledgeRetryIndexing',
      responses: {
        202: dataResponse(KnowledgeIndexingReceiptSchema),
        ...apiErrorResponses,
        ...precondition,
        ...conflicts,
        413: apiErrorResponse(413),
      },
    }),
    limited,
    apiValidator('json', RetryIndexingBody),
    async (c) =>
      c.json(
        { data: await service.retry(c.get('authz'), c.req.valid('json')) },
        202,
      ),
  );
  router.get(
    '/indexingInstances',
    authorization,
    access('read'),
    describeRoute({
      tags,
      summary: 'List configured Knowledge index instances',
      operationId: 'knowledgeListIndexingInstances',
      responses: {
        200: listResponse(
          KnowledgeIndexingInstanceSchema,
          KnowledgeIndexingDirectoryMetaSchema,
        ),
        ...apiErrorResponses,
      },
    }),
    async (c) => {
      const result = await service.instances(c.get('authz'));
      return c.json({
        data: result.items,
        meta: { total: result.items.length, reason: result.reason },
      });
    },
  );
  router.get(
    '/embeddingModels',
    authorization,
    access('read'),
    describeRoute({
      tags,
      summary: 'List embedding models available to Knowledge',
      operationId: 'knowledgeListEmbeddingModels',
      responses: {
        200: listResponse(
          KnowledgeEmbeddingServiceSchema,
          KnowledgeIndexingDirectoryMetaSchema,
        ),
        ...apiErrorResponses,
      },
    }),
    async (c) => {
      const result = await service.models(c.get('authz'));
      return c.json({
        data: result.items,
        meta: { total: result.items.length, reason: result.reason },
      });
    },
  );
  return router;
}
