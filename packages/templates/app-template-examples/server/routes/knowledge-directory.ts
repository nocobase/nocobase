import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import {
  knowledgeToken,
  knowledgeErrorHandler,
  KnowledgeSpaceSummarySchema,
  KnowledgeHitSchema,
} from '@nocobase/app-plugin-knowledge/server';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponses,
  apiValidator,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { KNOWLEDGE_SPACES } from '../../shared/knowledge-spaces.js';
import { EXAMPLES_APP_TAGS as tags } from './domain.js';
import {
  KnowledgeDirectoryMeta,
  KnowledgeDirectorySearchQuery,
} from './schemas.js';

export const knowledgeDirectoryRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const authorization = app.container.resolve(authorizationToken);
    const knowledge = app.container.resolve(knowledgeToken);
    // Includes declared empty spaces; the Knowledge service filters every result by the reader's access.
    const refs = KNOWLEDGE_SPACES.map(({ scope, scopeId }) => ({
      scope,
      scopeId,
    }));
    router.onError(knowledgeErrorHandler);
    router.use(
      '*',
      app.container
        .resolve(authenticationToken)
        .required({ scopedKeys: false }),
      authorization.middleware(),
      async (context, next) => {
        await context.get('authz').require({
          resource: { type: 'page', id: 'knowledge' },
          action: 'access',
        });
        await next();
      },
    );
    router.get(
      '/',
      describeRoute({
        tags,
        summary: 'List accessible knowledge spaces',
        operationId: 'examplesListKnowledgeSpaces',
        description:
          'The default application knowledge space, including when empty, filtered by document access. Requires Knowledge page access and an unscoped authenticated person.',
        responses: {
          200: listResponse(
            KnowledgeSpaceSummarySchema,
            KnowledgeDirectoryMeta,
          ),
          ...apiErrorResponses,
        },
      }),
      async (context) => {
        const reader = { userId: context.get('auth')!.user.id };
        const data = await knowledge.docs.summaries(reader, refs);
        return context.json({ data, meta: { total: data.length } });
      },
    );
    router.get(
      '/search',
      describeRoute({
        tags,
        summary: 'Search accessible knowledge spaces',
        operationId: 'examplesSearchKnowledgeSpaces',
        description:
          'Returns the best ranked sections across the application catalog, filtered by space and document permissions. Requires Knowledge page access and an unscoped authenticated person. Results use the Knowledge recall limit rather than pagination.',
        responses: {
          200: listResponse(KnowledgeHitSchema, KnowledgeDirectoryMeta),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', KnowledgeDirectorySearchQuery),
      async (context) => {
        const reader = { userId: context.get('auth')!.user.id };
        const data = await knowledge.docs.searchMany(
          reader,
          refs,
          context.req.valid('query').q,
        );
        return context.json({ data, meta: { total: data.length } });
      },
    );
    return new Hono().route('/knowledgeDirectory', router);
  });
