/**
 * `/api/knowledge`, for signed-in people; what each may do is the application's access resolver's answer. And
 * `/api/knowledge/tickets/:ticketId/redeem`, where a ticket's file arrives with the ticket as its only credential.
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { knowledgeAccessToken, knowledgeToken } from '../tokens.js';
import { createKnowledgeRoutes, createKnowledgeTicketRoutes } from './api.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    // Registered first: a ticket's route answers before the session guard below, which would otherwise match it too.
    router.route(
      '/knowledge/tickets',
      createKnowledgeTicketRoutes(container.resolve(knowledgeToken)),
    );
    const routes = new Hono();
    routes.use('*', container.resolve(authenticationToken).required());
    routes.route(
      '/',
      createKnowledgeRoutes(
        container.resolve(knowledgeToken),
        (c) => ({
          userId: (c.get('auth' as never) as { user: { id: string } }).user.id,
        }),
        (space) =>
          container.has(knowledgeAccessToken)
            ? container.resolve(knowledgeAccessToken).space(space)
            : null,
      ),
    );
    router.route('/knowledge', routes);
    return router;
  });

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
