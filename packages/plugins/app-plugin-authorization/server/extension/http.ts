import { Hono } from 'hono';
import { ApiError, apiErrorResponse } from '@nocobase/app-server/router';
import {
  AuthorizationDeniedError,
  type AuthorizationContext,
  type AuthorizationRouteHandler,
} from '@nocobase/authorization/core';

export interface SettingsRouterEnv {
  Bindings: {
    authorization: AuthorizationContext;
  };
}

/**
 * A router for one authorization settings surface. Denied requests answer
 * `403 PERMISSION_DENIED`, malformed input `400 INVALID_AUTHORIZATION_INPUT`,
 * both in the standard API error body; anything else is rethrown.
 */
export function createSettingsRouter(): Hono<SettingsRouterEnv> {
  const routes = new Hono<SettingsRouterEnv>();
  routes.onError((error, context) => {
    if (error instanceof TypeError)
      return apiErrorResponse(
        context,
        new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'INVALID_AUTHORIZATION_INPUT',
          domain: 'authorization',
          message: error.message,
          cause: error,
        }),
      );
    if (error instanceof ApiError || error instanceof AuthorizationDeniedError)
      return apiErrorResponse(context, error);
    throw error;
  });
  return routes;
}

/** The one settings check: `settings:<id>` `<action>`, or `AuthorizationDeniedError`. */
export function requireSettings(
  authorization: AuthorizationContext,
  id: string,
  action: string,
): Promise<void> {
  return authorization.require({
    resource: { type: 'settings', id },
    action,
  });
}

/** Adapts a settings router to `authz.routes.add`. */
export function createRouteHandler(
  routes: Hono<SettingsRouterEnv>,
): AuthorizationRouteHandler {
  return (input) =>
    Promise.resolve(
      routes.fetch(atPath(input.request, input.path), {
        authorization: input.authorization,
      }),
    );
}

/** The request as the router sees it: at the dispatcher-relative path. */
function atPath(request: Request, path: string): Request {
  const url = new URL(request.url);
  if (url.pathname === path) return request;
  url.pathname = path;
  return new Request(url, {
    method: request.method,
    headers: request.headers,
    ...(request.body ? { body: request.body, duplex: 'half' } : {}),
  });
}

/** A JSON body, or `undefined` when there is none. */
export async function jsonBody(request: {
  json(): Promise<unknown>;
}): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
