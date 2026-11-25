import { describeAudit } from '@nocobase/app-server/audit';
import type { AuthEnv } from '../auth.js';
import { authAuditOptions } from '../audit.js';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorResponses,
  cliRoute,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
  getClientAddress,
  isApiExecutionResultObserved,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';

import type { MiddlewareHandler } from 'hono';

import {
  AUTHENTICATION_SETTINGS_ID,
  authenticationSettingsAccessToken,
  authenticationToken,
} from '../tokens.js';
import { authenticationSettingsServiceToken } from '../settings-service.js';
import type { AuthenticationProviderConfig } from '../providers/authentication.js';
import {
  AuthenticationProviderSchema,
  AuthenticationProvidersMetaSchema,
  AuthenticationSettingsSchema,
  PasswordResetCapabilitySchema,
} from './schemas.js';

export const apiRoutes: AppApiRouteContribution<
  AppPluginApplication<AuthenticationProviderConfig>
> = defineApiRoutes((app) => {
  const router = new Hono();

  const auth = app.container.resolve(authenticationToken);
  router.on(
    ['GET', 'POST'],
    '/auth/*',
    describeAudit((context) =>
      context.req.method === 'POST'
        ? authAuditOptions(
            context.req.path.slice(context.req.routePath.indexOf('*') - 1),
          )
        : false,
    ),
    // A catch-all handing every request to Better Auth; its endpoints are documented one by one from Better Auth's own
    // generator, through the fragment the provider adds.
    describeRoute({ hide: true }),
    (context: Context<AuthEnv>) =>
      auth.handler(context.req.raw, {
        clientAddress: getClientAddress(context),
        onIdentity: isApiExecutionResultObserved(context)
          ? ({ userId, session }) => {
              if (session) context.set('auth', session);
              context.set('authHttpIdentity', { userId });
            }
          : undefined,
      }),
  );
  router.get(
    '/authentication/capabilities',
    describeRoute({
      ...cliRoute(false),
      operationId: 'authenticationGetCapabilities',
      security: [],
      summary: 'Read public authentication capabilities',
      description: 'Returns whether password reset by email is configured.',
      tags: ['Authentication'],
      responses: {
        200: dataResponse(
          PasswordResetCapabilitySchema,
          'Public authentication capabilities.',
        ),
      },
    }),
    (context) =>
      context.json({
        data: { passwordResetAvailable: auth.passwordResetAvailable() },
      }),
  );
  const settings = app.container.resolve(authenticationSettingsServiceToken);
  let access: MiddlewareHandler | undefined;
  router.get(
    '/authentication/settings',
    auth.required(),
    // The authorization plugin binds the check; without it nobody may read the settings.
    async (context, next) => {
      access ??= app.container.has(authenticationSettingsAccessToken)
        ? app.container.resolve(authenticationSettingsAccessToken)
        : denyAll;
      return access(context, next);
    },
    describeRoute({
      ...cliRoute(false),
      operationId: 'authenticationGetSettings',
      summary: 'Read the sign-in and authentication settings',
      description: `Returns the effective sign-in, registration, password, password reset and session settings, where each comes from (an environment variable, \`config.yml\`, code or a default) and the problems an administrator should fix. Requires the \`settings:${AUTHENTICATION_SETTINGS_ID}\` \`read\` permission. Never returns a secret, a signing key, a client secret or a mail credential; the settings are read-only and change through configuration.`,
      tags: ['Authentication'],
      responses: {
        200: dataResponse(
          AuthenticationSettingsSchema,
          'The effective authentication settings.',
        ),
        ...apiErrorResponses,
      },
    }),
    async (context) => context.json({ data: await settings.read() }),
  );
  router.get(
    '/authentication/providers',
    auth.required(),
    describeRoute({
      ...cliRoute(false),
      operationId: 'authenticationListProviders',
      summary: 'List the sign-in providers a person can link',
      description:
        'Lists the single sign-on and social providers the application configures, by id and name only, so a signed-in person can link one to their account through Better Auth. A bounded configuration list, not paged.',
      tags: ['Authentication'],
      responses: {
        200: listResponse(
          AuthenticationProviderSchema,
          AuthenticationProvidersMetaSchema,
        ),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const providers = await settings.providers();
      return context.json({
        data: providers,
        meta: { total: providers.length },
      });
    },
  );
  return router;
});

const denyAll: MiddlewareHandler = () => {
  throw new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'AUTHENTICATION_SETTINGS_FORBIDDEN',
    domain: 'authentication',
    message:
      'Reading the authentication settings requires the authorization plugin.',
  });
};

const routes: readonly AppApiRouteContribution<
  AppPluginApplication<AuthenticationProviderConfig>
>[] = [apiRoutes];

export default routes;
