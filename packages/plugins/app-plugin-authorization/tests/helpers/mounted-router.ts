import { createAppPaths } from '@nocobase/app-server/config';
import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import type { AuthorizationPlugin } from '@nocobase/authorization/core';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import {
  authorizationToken,
  type AppAuthorization,
} from '../../server/index.js';
import { apiRoutes } from '../../server/routes/index.js';
import { createInspectorHandler } from '../../server/routes/inspector.js';
import { createPermissionSetHandler } from '../../server/routes/permission-sets.js';

/** The request header naming the caller; `admin` when absent. */
export const TEST_USER = 'x-test-user';

const caller = (header: string | undefined): string => header ?? 'admin';

/** Resolves the principal from {@link TEST_USER}, for a fixture without sessions. */
export function testIdentity(): AuthorizationPlugin {
  return {
    id: 'test-identity',
    setup(authz) {
      authz.use(async (request, next) => {
        request.principal = {
          type: 'user',
          id: caller(request.http.req.header(TEST_USER)),
        };
        await next();
      });
    },
  };
}

/** Signs every request in as {@link TEST_USER}. */
const signedIn: MiddlewareHandler = async (context, next) => {
  context.set('auth', { user: { id: caller(context.req.header(TEST_USER)) } });
  await next();
};

/**
 * The plugin routes mounted under `/api`, as an application mounts them. A
 * fixture without the administration routes gets them registered here.
 */
export async function mountedRouter(
  authorization: AppAuthorization,
  options: {
    authenticate?: MiddlewareHandler;
    container?: ServiceContainer;
  } = {},
): Promise<Hono> {
  const routes = authorization.routes.list();
  if (!routes.includes('/permissionSets'))
    authorization.routes.add(
      '/permissionSets',
      createPermissionSetHandler(authorization, authorization.permissionSets),
    );
  if (!routes.includes('/inspector'))
    authorization.routes.add(
      '/inspector',
      createInspectorHandler(authorization, authorization.permissionSets),
    );
  const container = options.container ?? new ServiceContainer();
  const authenticate = options.authenticate ?? signedIn;
  container.instance(authenticationToken, {
    required: () => authenticate,
  } as unknown as Auth);
  container.instance(authorizationToken, authorization);
  const router = await apiRoutes.createRouter({
    appName: 'main',
    publicBasePath: '',
    config: { app: { name: 'main', publicBasePath: '' } },
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  });
  return new Hono().route('/api', router);
}

/** A JSON request, sent as `user` when one is named. */
export function json(
  method: string,
  body?: unknown,
  user?: string,
): RequestInit {
  return {
    method,
    headers: {
      'content-type': 'application/json',
      ...(user ? { [TEST_USER]: user } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}
