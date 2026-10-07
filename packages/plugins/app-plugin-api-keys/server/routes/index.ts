import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AuthEnv } from '@nocobase/app-plugin-authentication/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  emptyResponse,
  listResponse,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';

import { requireSignInSession } from '../key-sessions.js';
import { scopedApiKeysToken } from '../tokens.js';
import { toApiKeysApiError } from './errors.js';
import {
  ApiKeyParams,
  ApiKeysListMeta,
  ApiKeyViewSchema,
  CreateApiKeyInput,
  CreatedApiKeySchema,
  KeyScopeObjectSchema,
  KeyScopeOptionsSchema,
  ScopeGroupParams,
  ScopeObjectsQuery,
} from './schemas.js';

const tags = ['ApiKeys'];

/** Every route refuses a request made with an API key: keys are managed from a sign-in. */
const signInOnly =
  'Takes a signed-in session: a request made with any API key is refused (`403`).';

const keyNotFound = apiErrorResponse(
  404,
  'The caller has no key with this id (`KEY_NOT_FOUND`).',
);
const creationForbidden = apiErrorResponse(
  403,
  'The caller may not use API keys or may not create keys of their own (`API_KEY_CREATION_FORBIDDEN`).',
);

type Env = {
  Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
};

/**
 * `/api/apiKeys`: a person's own keys, with or without a scope. Self-service: every endpoint acts on the caller's
 * keys only, and only from a sign-in: a request made with any API key is refused (`requireSignInSession`).
 */
export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    if (!container.has(authenticationToken)) return router;
    const keys = container.resolve(scopedApiKeysToken);
    const routes = new Hono<Env>();
    routes.onError((error, context) =>
      apiErrorHandler(toApiKeysApiError(error), context),
    );
    routes.use('*', container.resolve(authenticationToken).required());
    // Managing keys takes a sign-in: no key, scoped or not, creates, rotates or revokes keys.
    routes.use('*', requireSignInSession());
    if (container.has(authorizationToken))
      routes.use('*', container.resolve(authorizationToken).middleware());
    const userId = (context: Context<Env>) => context.get('auth')!.user.id;
    const identity = async (context: Context<Env>) =>
      context.get('authz')?.identity ??
      (await keys.identityOf(userId(context)));
    // Creating and rotating are refused before the input is read when the person may not create keys.
    const mayCreate: MiddlewareHandler<Env> = async (context, next) => {
      await keys.requireOwnCreation(userId(context));
      await next();
    };

    routes.get(
      '/scopeOptions',
      describeRoute({
        tags,
        summary: 'List what a scoped key may be limited to',
        operationId: 'apiKeysListScopeOptions',
        ...cliRoute({ command: 'api-key scope-options' }),
        description: signInOnly,
        responses: {
          200: dataResponse(KeyScopeOptionsSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) =>
        context.json({
          data: {
            ...(await keys.scopeOptions(userId(context))),
            mayCreate: await keys.mayCreateOwn(userId(context)),
          },
        }),
    );
    // The records a person may pick for a group: bounded by what they see, and narrowed by `q` or `id`.
    routes.get(
      '/scopeObjects/:group',
      describeRoute({
        tags,
        summary: 'List the records a scope group may be limited to',
        operationId: 'apiKeysListScopeObjects',
        ...cliRoute({
          command: 'api-key scope-objects',
          columns: ['id', 'title', 'description'],
          examples: ['api-key scope-objects pm.projects --q checkout'],
        }),
        description: `${signInOnly} Bounded by what the caller can see and narrowed by \`q\` or repeated \`id\`; not paged.`,
        responses: {
          200: listResponse(KeyScopeObjectSchema, ApiKeysListMeta),
          ...apiErrorResponses,
          404: apiErrorResponse(
            404,
            'The scope group does not exist (`UNKNOWN_SCOPE_GROUP`).',
          ),
        },
      }),
      apiValidator('param', ScopeGroupParams),
      apiValidator('query', ScopeObjectsQuery),
      async (context) => {
        const { group } = context.req.valid('param');
        const { q, id } = context.req.valid('query');
        const data = await keys.scopeObjects(group, await identity(context), {
          ...(q ? { search: q } : {}),
          ...(id ? { ids: id } : {}),
        });
        return context.json({ data, meta: { total: data.length } });
      },
    );
    // A person's own keys: a bounded list, not paged.
    routes.get(
      '/',
      describeRoute({
        tags,
        summary: 'List my API keys',
        operationId: 'apiKeysListKeys',
        ...cliRoute({
          command: 'api-key list',
          columns: [
            'id',
            'name',
            'start',
            'enabled',
            'expiresAt',
            'lastUsedAt',
          ],
        }),
        description: `${signInOnly} Never returns a key's secret.`,
        responses: {
          200: listResponse(ApiKeyViewSchema, ApiKeysListMeta),
          ...apiErrorResponses,
        },
      }),
      async (context) => {
        const data = await keys.list(userId(context));
        return context.json({ data, meta: { total: data.length } });
      },
    );
    routes.post(
      '/',
      mayCreate,
      describeRoute({
        tags,
        summary: 'Create an API key',
        operationId: 'apiKeysCreateKey',
        ...cliRoute({
          command: 'api-key create',
          examples: [
            'api-key create --name ci --expires-in-days 90',
            'api-key create --file key.json',
          ],
          bodyFile: 'file',
        }),
        description: `${signInOnly} The secret is in this response only. \`scope: null\` makes a key that acts as the caller in full.`,
        responses: {
          201: dataResponse(CreatedApiKeySchema, 'The created key.'),
          ...apiErrorResponses,
          403: creationForbidden,
          400: apiErrorResponse(
            400,
            'The expiry or the scope is not allowed (`EXPIRY_REQUIRED`, `INVALID_EXPIRY`, `INVALID_SCOPE`, `EMPTY_SCOPE`, `UNKNOWN_SCOPE_GROUP`, `SCOPE_LEVEL_NOT_OFFERED`, `SCOPE_OBJECTS_NOT_OFFERED`, `UNKNOWN_SCOPE_OBJECT`).',
          ),
        },
      }),
      apiValidator('json', CreateApiKeyInput),
      async (context) => {
        context.header('Cache-Control', 'no-store');
        return context.json(
          {
            data: await keys.create(
              userId(context),
              context.req.valid('json'),
              await identity(context),
            ),
          },
          201,
        );
      },
    );
    routes.post(
      '/:keyId/rotate',
      mayCreate,
      describeRoute({
        tags,
        summary: 'Rotate an API key',
        operationId: 'apiKeysRotateKey',
        ...cliRoute({
          command: 'api-key rotate',
          flags: { keyId: { name: 'key' } },
          confirm: 'Rotate this key? The old secret stops working.',
        }),
        description: `${signInOnly} Replaces the key with a new secret, keeping its name, scope and lifetime; the old secret stops working.`,
        responses: {
          200: dataResponse(CreatedApiKeySchema),
          ...apiErrorResponses,
          403: creationForbidden,
          404: keyNotFound,
        },
      }),
      apiValidator('param', ApiKeyParams),
      async (context) => {
        context.header('Cache-Control', 'no-store');
        return context.json({
          data: await keys.rotate(
            userId(context),
            context.req.valid('param').keyId,
          ),
        });
      },
    );
    routes.delete(
      '/:keyId',
      describeRoute({
        tags,
        summary: 'Revoke an API key',
        operationId: 'apiKeysRevokeKey',
        ...cliRoute({
          command: 'api-key delete',
          flags: { keyId: { name: 'key' } },
          confirm: 'Revoke this key? Whatever uses it stops working.',
        }),
        description: signInOnly,
        responses: {
          204: emptyResponse('The key was revoked.'),
          ...apiErrorResponses,
          404: keyNotFound,
        },
      }),
      apiValidator('param', ApiKeyParams),
      async (context) => {
        await keys.revoke(userId(context), context.req.valid('param').keyId);
        return context.body(null, 204);
      },
    );

    router.route('/apiKeys', routes);
    return router;
  });

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
