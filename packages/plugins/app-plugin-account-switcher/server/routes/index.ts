import {
  authenticationToken,
  type AuthEnv,
  type AuthSession,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  emptyResponse,
  getClientAddress,
  listResponse,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';

import { resolveAccountSwitcherMode } from '../config.js';
import { accountSwitchBrowserOnly } from '../errors.js';
import { accountSwitcherServiceToken } from '../tokens.js';
import {
  AccountSwitchStateSchema,
  ListAccountsQuery,
  StartSwitchInput,
  SwitchableAccountSchema,
} from './schemas.js';

const tags = ['AccountSwitcher'];

function sessionOf(context: Context<AuthEnv>): NonNullable<AuthSession> {
  // `required()` ahead of every route has established the session.
  return context.get('auth') as NonNullable<AuthSession>;
}

const accountSwitcherRoutes: AppRouteContribution<AppPluginApplication> =
  defineApiRoutes((app) => {
    const router = new Hono();
    if (resolveAccountSwitcherMode(app.config, app.nodeEnv) === 'off')
      return router;

    const { container } = app;
    const auth = container.resolve(authenticationToken);
    const service = () => container.resolve(accountSwitcherServiceToken);
    const routes = new Hono<AuthEnv>();
    routes.onError(apiErrorHandler);
    // A switch belongs to a browser's session: a key or a CLI token never starts one or learns of it.
    const browserOnly: MiddlewareHandler<AuthEnv> = async (context, next) => {
      if (
        context.req.header('x-api-key') ||
        !getCookie(context, await auth.sessionCookieName())
      )
        throw accountSwitchBrowserOnly();
      await next();
    };
    // The caller's permission is decided by the service for the signed-in person: while a switch is in force, the
    // request's own authorization context would answer for the account acted as.
    routes.use('*', auth.required(), browserOnly);

    routes.get(
      '/state',
      describeRoute({
        tags,
        summary:
          'Read whether accounts can be switched and any switch in force',
        operationId: 'accountSwitcherGetState',
        responses: {
          200: dataResponse(AccountSwitchStateSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) =>
        context.json({ data: await service().state(sessionOf(context)) }),
    );

    routes.get(
      '/accounts',
      describeRoute({
        tags,
        summary: 'List the accounts the signed-in person can switch to',
        operationId: 'accountSwitcherListAccounts',
        description:
          'Enabled person accounts, including the signed-in person’s own. Requires an unrestricted Permission Set on the signed-in person.',
        responses: {
          200: listResponse(SwitchableAccountSchema),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', ListAccountsQuery),
      async (context) => {
        const query = context.req.valid('query');
        const { items, total } = await service().listAccounts(
          sessionOf(context),
          query,
        );
        return context.json({
          data: items,
          meta: { page: query.page, pageSize: query.pageSize, total },
        });
      },
    );

    routes.post(
      '/switches',
      describeRoute({
        tags,
        summary: 'Start acting as another account',
        operationId: 'accountSwitcherStartSwitch',
        description:
          'Makes this browser session act as the account until the switch ends, replacing any switch in force. Requires an unrestricted Permission Set on the signed-in person.',
        responses: {
          201: dataResponse(AccountSwitchStateSchema),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', StartSwitchInput),
      async (context) => {
        const state = await service().start(sessionOf(context), {
          userId: context.req.valid('json').userId,
          ...clientOf(context),
        });
        return context.json({ data: state }, 201);
      },
    );

    routes.delete(
      '/switches/current',
      describeRoute({
        tags,
        summary: 'Return to the signed-in person’s own account',
        operationId: 'accountSwitcherEndCurrentSwitch',
        description:
          'Ends the switch in force for this browser session. Does nothing when there is none.',
        responses: {
          204: emptyResponse(),
          401: apiErrorResponse(401),
          403: apiErrorResponse(403),
          500: apiErrorResponse(500),
        },
      }),
      async (context) => {
        await service().stop(sessionOf(context));
        return context.body(null, 204);
      },
    );

    router.route('/accountSwitcher', routes);
    return router;
  });

function clientOf(context: Context): {
  ipAddress?: string;
  userAgent?: string;
} {
  const ipAddress = getClientAddress(context);
  const userAgent = context.req.header('user-agent');
  return {
    ...(ipAddress ? { ipAddress } : {}),
    ...(userAgent ? { userAgent } : {}),
  };
}

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  accountSwitcherRoutes,
];

export default routes;
