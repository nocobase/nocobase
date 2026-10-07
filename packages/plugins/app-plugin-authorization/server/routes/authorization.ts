import type { Auth } from '@nocobase/app-plugin-authentication';
import {
  apiErrorHandler,
  apiErrorResponse,
  dataResponse,
  describeRoute,
  getRequestId,
  requestIdHeader,
} from '@nocobase/app-server/router';
import type { AuthorizationEnv } from '@nocobase/authorization/core';
import { Hono, type Context } from 'hono';
import type { AppAuthorization } from '../authorization.js';
import { AUTHORIZATION_API_TAGS } from '../extension/options.js';
import { AuthorizationSnapshotSchema } from './schemas.js';

/**
 * `/permissions` for the signed-in user; every other path goes to whichever
 * plugin registered it with `authz.routes.add`.
 */
export function createAuthorizationRoutes(
  auth: Auth,
  authorization: AppAuthorization,
): Hono<AuthorizationEnv> {
  const routes = new Hono<AuthorizationEnv>();
  routes.onError(apiErrorHandler);
  // A scoped API key may ask what it may do: the snapshot and every registered check go through `authz`, which
  // narrows them to the key's scope.
  routes.use('*', auth.required({ scopedKeys: true }));
  routes.use('*', authorization.middleware());
  routes.get(
    '/permissions',
    describeRoute({
      tags: AUTHORIZATION_API_TAGS,
      summary: "Get the signed-in user's permissions",
      operationId: 'authorizationGetPermissions',
      description:
        'What the client may show the signed-in user: either unrestricted access, or each resource with the actions its grants permit outright. An action permitted only conditionally is not listed; the server still checks every request.',
      responses: {
        200: dataResponse(AuthorizationSnapshotSchema),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    async (context) =>
      context.json({ data: await context.get('authz').snapshot() }),
  );
  // The dispatcher is middleware for every path below `/api/authorization`, not an endpoint, so it declares nothing: a
  // `describeRoute()` here would apply to every route below it. The provider registers the settings routers it forwards
  // to with the API documentation (`documentAuthorizationRoutes`), which documents and checks them at their full paths.
  routes.all('*', async (context, next) => {
    const response = authorization.routes.handle({
      request: withRequestId(context.req.raw, getRequestId(context)),
      path: mountedPath(context),
      authorization: context.get('authz'),
    });
    if (response) return await response;
    await next();
  });
  return routes;
}

/** The request path with the mount removed. */
function mountedPath(context: Context<AuthorizationEnv>): string {
  const wildcard = context.req.routePath.indexOf('*');
  const mount =
    wildcard === -1
      ? ''
      : context.req.routePath.slice(0, wildcard).replace(/\/$/, '');
  return context.req.path.slice(mount.length) || '/';
}

/** The request carrying this request's id, so a settings router answers with the same one. */
function withRequestId(request: Request, requestId: string): Request {
  if (request.headers.get(requestIdHeader) === requestId) return request;
  const headers = new Headers(request.headers);
  headers.set(requestIdHeader, requestId);
  return new Request(request, { headers });
}
