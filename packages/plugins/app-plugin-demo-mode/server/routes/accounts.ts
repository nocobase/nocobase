import { authorizationToken } from '@nocobase/app-plugin-authorization';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  getClientAddress,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';

import { DemoAccountSignIn } from '../accounts.js';
import { resolveDemoModeSettings } from '../config.js';
import { demoDataToken, demoModeServiceToken } from '../tokens.js';
import {
  DemoDefaultSignInSchema,
  DemoSignInAccountSchema,
  UsernameParam,
} from './schemas.js';

const tags = ['DemoMode'];

/**
 * Quick sign-in for visitors of a demo: every enabled person account, entered without a password. Public, since a visitor has no account yet; offered only while demo mode is on and
 * `demoMode.quickSignIn` is not switched off.
 */
export const accountRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes((app) => {
    const { container } = app;
    const router = new Hono();
    if (!container.has(authenticationToken)) return router;
    const auth = container.resolve(authenticationToken);
    const settings = resolveDemoModeSettings(app.config);
    const service = new DemoAccountSignIn({
      auth,
      database: container.resolve(databaseManagerToken),
      authorization: () =>
        container.has(authorizationToken)
          ? container.resolve(authorizationToken)
          : undefined,
      enabled: () =>
        settings.quickSignIn && container.resolve(demoModeServiceToken).enabled,
      accounts: async () => {
        const status = await container.resolve(demoDataToken).status();
        return status.accounts;
      },
    });
    const accounts = new Hono<AuthEnv>();
    accounts.onError(apiErrorHandler);
    // `optional()` reads who is signed in and refuses a cookie-carrying write from another origin.
    accounts.use('*', auth.optional());
    accounts.get(
      '/',
      describeRoute({
        tags,
        summary: 'List the system accounts visitors may enter',
        operationId: 'demoModeListAccounts',
        security: [],
        description:
          'Enabled person accounts a visitor may enter without a password, including existing administrators and accounts created outside the dataset. Passwords are never returned. Empty outside Demo Mode or when quick sign-in is switched off.',
        responses: {
          200: listResponse(DemoSignInAccountSchema),
          500: apiErrorResponse(500),
        },
      }),
      async (context) => {
        const data = await service.list(context.req.raw.headers);
        return context.json({ data, meta: { total: data.length } });
      },
    );
    accounts.post(
      '/signInDefault',
      describeRoute({
        tags,
        summary: 'Enter the demo as Super Admin',
        operationId: 'demoModeSignInDefaultAccount',
        security: [],
        description:
          'Creates an ordinary session for an existing enabled Super Admin when an anonymous visitor opens the home page in Demo Mode. Existing sessions are retained. Does nothing outside Demo Mode, with quick sign-in disabled or when no enabled Super Admin exists.',
        responses: {
          200: dataResponse(DemoDefaultSignInSchema),
          400: apiErrorResponse(400),
          403: apiErrorResponse(403),
          500: apiErrorResponse(500),
        },
      }),
      async (context) => {
        const cookies = await service.signInDefault(
          context.req.raw,
          getClientAddress(context),
        );
        for (const cookie of cookies)
          context.header('Set-Cookie', cookie, { append: true });
        return context.json({ data: { signedIn: cookies.length > 0 } });
      },
    );
    accounts.post(
      '/:username/signIn',
      describeRoute({
        tags,
        summary: 'Sign in as a system account in Demo Mode',
        operationId: 'demoModeSignInAccount',
        security: [],
        description:
          'Ends the request’s own session, if any, and creates an ordinary session for the selected enabled person account. Requires Demo Mode and quick sign-in. Neither dataset ownership nor a known password is required.',
        responses: {
          200: dataResponse(DemoSignInAccountSchema),
          400: apiErrorResponse(
            400,
            'Authentication could not create the session (`DEMO_ACCOUNT_SIGN_IN_FAILED`).',
          ),
          403: apiErrorResponse(
            403,
            'A cookie-carrying request from another origin.',
          ),
          404: apiErrorResponse(
            404,
            'The account cannot be entered (`DEMO_ACCOUNT_NOT_FOUND`).',
          ),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('param', UsernameParam),
      async (context) => {
        const { account, cookies } = await service.signIn(
          context.req.raw,
          context.req.valid('param').username,
          getClientAddress(context),
        );
        for (const cookie of cookies)
          context.header('Set-Cookie', cookie, { append: true });
        return context.json({ data: account });
      },
    );
    router.route('/demoMode/accounts', accounts);
    return router;
  });
