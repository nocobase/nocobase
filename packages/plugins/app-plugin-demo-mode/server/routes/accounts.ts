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
import { z } from 'zod';

import { DemoAccountSignIn, type DemoSignInAccount } from '../accounts.js';
import { resolveDemoModeSettings } from '../config.js';
import { demoDataToken, demoModeServiceToken } from '../tokens.js';

const tags = ['Demo mode'];

const DemoSignInAccountSchema: z.ZodType<DemoSignInAccount> = z
  .object({
    username: z.string(),
    name: z.string(),
    role: z.string().meta({
      description: 'What the account does in the demo, such as its job title.',
    }),
    current: z.boolean().meta({
      description: 'Whether the request is signed in as this account.',
    }),
  })
  .meta({ ref: 'DemoModeSignInAccount' });

const UsernameParam = z.object({ username: z.string().min(1).max(255) });

/**
 * Quick sign-in for visitors of a demo: the accounts the imported dataset lists, and signing in as one of them without
 * its password. Public, since a visitor has no account yet; offered only while demo mode is on and
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
      enabled: () =>
        settings.quickSignIn &&
        container.resolve(demoModeServiceToken).mode !== 'off',
      accounts: async () => {
        const status = await container.resolve(demoDataToken).status();
        return { datasetId: status.datasetId, accounts: status.accounts };
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
        summary: 'List the demo accounts visitors may enter',
        operationId: 'demoModeListAccounts',
        security: [],
        description:
          'The accounts of the imported demo dataset a visitor may sign in as without a password, without their passwords. Empty when the application is not a demo, quick sign-in is switched off or no demo data is imported.',
        responses: {
          200: listResponse(DemoSignInAccountSchema),
          500: apiErrorResponse(500),
        },
      }),
      async (context) =>
        context.json({
          data: await service.list(context.req.raw.headers),
        }),
    );
    accounts.post(
      '/:username/signIn',
      describeRoute({
        tags,
        summary: 'Sign in as a demo account',
        operationId: 'demoModeSignInAccount',
        security: [],
        description:
          'Ends the request’s own session, if any, and signs in as the demo account with the password its dataset lists, setting the ordinary session cookie. Only for accounts the list offers.',
        responses: {
          200: dataResponse(DemoSignInAccountSchema),
          400: apiErrorResponse(
            400,
            'Better Auth refused the dataset’s password (`DEMO_ACCOUNT_SIGN_IN_FAILED`).',
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
