import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  defineRootRoutes,
  type AppApiRouteContribution,
  type AppRootRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';

import { agentSessionsErrorHandler } from '../errors.js';
import { agentSessionsToken } from '../tokens.js';
import { toolRoutes } from '../tools.js';
import { bridgeRoutes } from './bridge.js';
import { sessionRoutes } from './sessions.js';

/**
 * `/agentSessions`: every route answers only the signed-in person, about their own computers and sessions; the bridge's
 * routes also answer a computer's key, for that computer (`computer-key.ts`).
 */
export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const service = container.resolve(agentSessionsToken);
    const auth = container.resolve(authenticationToken);
    const router = new Hono();
    router.onError(agentSessionsErrorHandler);
    const bridge = (context: Context): boolean =>
      context.req.path.includes('/agentSessions/bridge/');
    router.use('/agentSessions/*', auth.required({ skip: bridge }));
    router.use('/agentSessions/bridge/*', auth.required({ scopedKeys: true }));
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
