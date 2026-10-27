/**
 * `/api/knowledge`, for signed-in people; what each may do is the application's access resolver's answer. And
 * `/api/knowledge/tickets/:ticketId/redeem`, where a ticket's file arrives with the ticket as its only credential.
 */
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  ApiError,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { knowledgeIndexingToken } from '../tokens.js';
import { createKnowledgeIndexingRoutes } from './indexing.js';
import { knowledgeAccessToken, knowledgeToken } from '../tokens.js';
import { createKnowledgeRoutes, createKnowledgeTicketRoutes } from './api.js';
import { knowledgeOnlineAgent } from '../online-agent/integration.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(async ({ container }) => {
    const router = new Hono();
    // Registered first: a ticket's route answers before the session guard below, which would otherwise match it too.
    router.route(
      '/knowledge/tickets',
      createKnowledgeTicketRoutes(container.resolve(knowledgeToken)),
    );
    const routes = new Hono<AuthEnv>();
    const authentication = container.resolve(authenticationToken);
    const integration = await knowledgeOnlineAgent(container);
    routes.use(
      '*',
      authentication.required(integration ? { scopedKeys: true } : undefined),
    );
    if (integration)
      routes.use('*', async (context, next) => {
        const auth = context.get('auth');
        if (
          auth &&
          !(
            auth.credential?.type === integration.credentialType &&
            auth.credential.scheme === 'runToken'
          ) &&
          (await authentication.isScopedSession(auth, context.req.raw))
        ) {
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'SCOPED_KEY_FORBIDDEN',
            domain: 'authentication',
            message:
              'This endpoint does not accept scoped API keys or service-account keys.',
          });
        }
        await next();
      });
    if (
      container.has(authorizationToken) &&
      container.has(knowledgeIndexingToken)
    )
      routes.route(
        '/',
        createKnowledgeIndexingRoutes(
          container.resolve(knowledgeIndexingToken),
          container.resolve(authorizationToken).middleware(),
        ),
      );
    routes.route(
      '/',
      createKnowledgeRoutes(
        container.resolve(knowledgeToken),
        (c) => {
          const auth = c.get('auth' as never) as AuthEnv['Variables']['auth'];
          if (!auth)
            throw new ApiError({
              status: 'UNAUTHENTICATED',
              reason: 'UNAUTHENTICATED',
              domain: 'authentication',
              message: 'Sign in first.',
            });
          return {
            userId: auth.user.id,
            ...(integration &&
            auth.credential?.type === integration.credentialType
              ? { actor: { kind: 'online-agent', id: auth.credential.id } }
              : {}),
          };
        },
        (space) =>
          container.has(knowledgeAccessToken)
            ? container.resolve(knowledgeAccessToken).space(space)
            : null,
        { acceptOnlineAgent: integration !== null },
      ),
    );
    router.route('/knowledge', routes);
    return router;
  });

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
