/** Studio chooses authorized projects; the plugin evaluates every knowledge node. */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import {
  KnowledgeHitSchema,
  KnowledgeSpaceSummarySchema,
  knowledgeErrorHandler,
} from '@nocobase/app-plugin-knowledge/server';
import { knowledgeToken } from '@nocobase/app-plugin-knowledge/server/tokens';
import {
  projectsToken,
  projectsAccessToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponses,
  apiValidator,
  cliRoute,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { Hono, type Context } from 'hono';
import { z } from 'zod';

import { SYSTEM_SPACE, PROJECT_SCOPE } from '../../shared/knowledge.js';
import { callerOfRequest } from '../agents/run-principal.js';
import { createPermissionSource } from '../agents/commands/permissions.js';
import { studioError } from '../http/errors.js';

export const knowledgeDirectoryRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken) ||
      !container.has(knowledgeToken) ||
      !container.has(projectsToken)
    )
      return new Hono();
    const routes = new Hono();
    routes.onError(knowledgeErrorHandler);
    routes.use('*', container.resolve(authenticationToken).required());
    routes.use('*', container.resolve(authorizationToken).middleware());
    routes.use('*', async (c, next) => {
      const authz = c.get('authz' as never) as AuthorizationContext;
      if (
        !(await authz.can({
          resource: { type: 'page', id: 'knowledge' },
          action: 'access',
        }))
      )
        throw studioError(
          'PERMISSION_DENIED',
          'KNOWLEDGE_DIRECTORY_FORBIDDEN',
          'This needs the knowledge page grant.',
        );
      await next();
    });
    const permissions = createPermissionSource(() =>
      container.has(projectsAccessToken)
        ? container.resolve(projectsAccessToken)
        : undefined,
    );
    const candidates = async (c: Parameters<typeof callerOfRequest>[0]) => {
      const caller = callerOfRequest(c);
      if (!caller)
        throw studioError(
          'UNAUTHENTICATED',
          'UNAUTHENTICATED',
          'Sign in first.',
        );
      const projects = await container
        .resolve(projectsToken)
        .projects.list(await permissions.viewerOf(caller));
      return {
        reader: { userId: caller.userId },
        refs: [
          ...projects.map((project) => ({
            scope: PROJECT_SCOPE,
            scopeId: project.id,
          })),
          SYSTEM_SPACE,
        ],
      };
    };
    routes.get(
      '/',
      describeRoute({
        tags: ['Studio'],
        summary: 'List authorized knowledge spaces and document counts',
        operationId: 'studioListKnowledgeDirectory',
        description:
          'Authorized project spaces and shared system knowledge, including readable empty spaces. Counts exclude folders and inherited duplicates. This bounded project directory is not paged.',
        responses: {
          200: listResponse(
            KnowledgeSpaceSummarySchema,
            z.object({ total: z.number().int() }),
          ),
          ...apiErrorResponses,
        },
        ...cliRoute(false),
      }),
      async (c) => {
        const { reader, refs } = await candidates(c as unknown as Context);
        const data = await container
          .resolve(knowledgeToken)
          .docs.summaries(reader, refs);
        return c.json({ data, meta: { total: data.length } });
      },
    );
    routes.get(
      '/search',
      describeRoute({
        tags: ['Studio'],
        summary: 'Search all authorized knowledge spaces',
        operationId: 'studioSearchKnowledgeDirectory',
        description:
          'Top ranked live sections across all authorized projects and system knowledge, independent of expanded client trees. Folder paths contain readable ancestors only. Ranking is not an exhaustive paged list.',
        responses: {
          200: listResponse(KnowledgeHitSchema, z.object({})),
          ...apiErrorResponses,
        },
        ...cliRoute(false),
      }),
      apiValidator(
        'query',
        z.object({
          q: z.string().default(''),
          pageSize: z.coerce.number().int().min(1).max(100).optional(),
        }),
      ),
      async (c) => {
        const { reader, refs } = await candidates(c as unknown as Context);
        const query = c.req.valid('query');
        return c.json({
          data: await container
            .resolve(knowledgeToken)
            .docs.searchMany(reader, refs, query.q, { limit: query.pageSize }),
          meta: {},
        });
      },
    );
    return new Hono().route('/knowledgeDirectory', routes);
  });
