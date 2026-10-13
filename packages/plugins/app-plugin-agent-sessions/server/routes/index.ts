import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  defineRootRoutes,
  type AppApiRouteContribution,
  type AppRootRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { agentSessionsErrorHandler } from '../errors.js';
import { agentSessionsToken } from '../tokens.js';
import { toolRoutes } from '../tools.js';
import { bridgeRoutes } from './bridge.js';
import { sessionRoutes } from './sessions.js';

/** `/agentSessions`: every route answers only the signed-in person, about their own computers and sessions. */
export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const service = container.resolve(agentSessionsToken);
    const router = new Hono();
    router.onError(agentSessionsErrorHandler);
    router.use(
      '/agentSessions/*',
      container.resolve(authenticationToken).required(),
    );
    router.route('/agentSessions/bridge', bridgeRoutes(service));
    router.route('/agentSessions', sessionRoutes(service));
    return router;
  });

/** The tools' MCP endpoint, which answers JSON-RPC and authenticates by the session's tools token (`tools.ts`). */
export const mcpRoutes: AppRootRouteContribution<AppPluginApplication> =
  defineRootRoutes(({ container }) =>
    toolRoutes(container.resolve(agentSessionsToken).toolHost),
  );

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
  mcpRoutes,
];

export default routes;
