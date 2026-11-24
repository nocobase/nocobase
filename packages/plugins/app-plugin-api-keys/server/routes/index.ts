import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import {
  authorizationOptions,
  AuthorizationOptionsSchema,
  authorizationToken,
  grantableAuthorizationOptions,
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
import { ApiKeyRequestError, type ApiKeysConfig } from '../scoped-keys.js';
import {
  memberApiKeysToken,
  scopedApiKeysToken,
  systemApiKeysToken,
} from '../tokens.js';
import { installKeyAdministration, installSystemKeys } from './admin.js';
import { toApiKeysApiError } from './errors.js';
import {
  ApiKeyDetailSchema,
  ApiKeyParams,
  ApiKeysListMeta,
  OwnApiKeysListMeta,
  ApiKeyViewSchema,
  CreateApiKeyInput,
  CreatedApiKeySchema,
  GrantablePermissionsSchema,
  KeyScopeObjectSchema,
  KeyScopeOptionsSchema,
  ObjectSourceParams,
  ScopeGroupParams,
  ScopeObjectsQuery,
  ScopeRecordsMeta,
  ScopeRecordsQuery,
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
 * The routes added with key permissions in format 2 stay off the command line for now, documented only, so an
 * application's command line, and the tests that pin it, stay as they were until it offers them.
 */
const newRouteOffCommandLine = cliRoute(false);

/**
 * `/api/apiKeys`: a person's own keys, with or without a scope. Self-service: every endpoint acts on the caller's
 * keys only, and only from a sign-in: a request made with any API key is refused (`requireSignInSession`).
 */
export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container, config }) => {
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
    // Members' keys and the rules: administration, registered before `/:keyId`, which would otherwise match them. A
    // host that composes these routes without the plugin's provider, as an application's own tests may, goes without.
    if (container.has(authorizationToken) && container.has(memberApiKeysToken))
      installKeyAdministration(routes, {
        keys,
        members: container.resolve(memberApiKeysToken),
      });
    // Creating and rotating are refused before the input is read when the person may not create keys.
    const mayCreate: MiddlewareHandler<Env> = async (context, next) => {
      await keys.requireOwnCreation(userId(context));
      await next();
    };

    routes.get(
      '/grantable',
      describeRoute({
        tags,
        summary: 'List what I may give a key',
        operationId: 'apiKeysListGrantable',
        ...newRouteOffCommandLine,
        description: `${signInOnly} The actions the caller holds today, those no key may hold marked with the reason, and the templates resolved to what the caller holds.`,
        responses: {
          200: dataResponse(GrantablePermissionsSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) =>
        context.json({
          data: await keys.grantable(userId(context), await identity(context)),
        }),
    );
    routes.get(
      '/scopeOptions',
      describeRoute({
        tags,
        summary: 'List what a scoped key may be limited to',
        operationId: 'apiKeysListScopeOptions',
        deprecated: true,
        ...cliRoute({ command: 'api-key scope-options' }),
        description: `Deprecated: read \`GET /api/apiKeys/grantable\`. ${signInOnly}`,
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
        deprecated: true,
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
    // The records a key may be limited to for a business: bounded by what the caller sees, narrowed by `q` or `id`.
    routes.get(
      '/objects/:business',
      describeRoute({
        tags,
        summary: 'List the records a key may be limited to',
        operationId: 'apiKeysListObjects',
        ...newRouteOffCommandLine,
        description: `${signInOnly} The records of a business a key's permissions may be limited to (\`permissions.objects\`), bounded by what the caller can see and narrowed by \`q\` or repeated \`id\`; not paged.`,
        responses: {
          200: listResponse(KeyScopeObjectSchema, ApiKeysListMeta),
          ...apiErrorResponses,
          404: apiErrorResponse(
            404,
            'No record source is registered for the business (`UNKNOWN_OBJECT_SOURCE`).',
          ),
        },
      }),
      apiValidator('param', ObjectSourceParams),
      apiValidator('query', ScopeObjectsQuery),
      async (context) => {
        const { business } = context.req.valid('param');
        const { q, id } = context.req.valid('query');
        const data = await keys.objects(business, await identity(context), {
          ...(q ? { search: q } : {}),
          ...(id ? { ids: id } : {}),
        });
        return context.json({ data, meta: { total: data.length } });
      },
    );
    // The records a key's data scope may be limited to: the ones the caller sees through that composite action.
    routes.get(
      '/scopeRecords',
      describeRoute({
        tags,
        summary: 'List the records a key’s data scope may be limited to',
        operationId: 'apiKeysListScopeRecords',
        ...newRouteOffCommandLine,
        description: `${signInOnly} The records the caller can see through a composite action's data scope, which a key's permissions may limit that scope to (\`{ type: 'records', ids }\`); filtered by \`q\` (in the id or title) or repeated \`id\` and paged (\`page\`, 50 a page; \`meta.hasMore\`) by the database.`,
        responses: {
          200: listResponse(KeyScopeObjectSchema, ScopeRecordsMeta),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', ScopeRecordsQuery),
      async (context) => {
        const { resource, action, scope, q, id, page } =
          context.req.valid('query');
        const { records, hasMore } = await keys.scopeRecords(
          await identity(context),
          {
            resource,
            action,
            scope,
            ...(id ? { ids: id } : {}),
            ...(q ? { search: q } : {}),
            ...(page ? { page } : {}),
          },
        );
        return context.json({
          data: records,
          meta: { total: records.length, hasMore },
        });
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
        description: `${signInOnly} Never returns a key's secret. \`meta\` says whether the caller may create keys, and keys that act as them in full.`,
        responses: {
          200: listResponse(ApiKeyViewSchema, OwnApiKeysListMeta),
          ...apiErrorResponses,
        },
      }),
      async (context) => {
        const data = await keys.list(userId(context));
        return context.json({
          data,
          meta: {
            total: data.length,
            mayCreate: await keys.mayCreateOwn(userId(context)),
            allowSameAsMe: (await keys.rules()).allowSameAsMe,
          },
        });
      },
    );
    routes.get(
      '/:keyId',
      describeRoute({
        tags,
        summary: 'Get an API key',
        operationId: 'apiKeysGetKey',
        ...newRouteOffCommandLine,
        description: `${signInOnly} One of the caller's keys, never its secret, with the actions it lost because the caller no longer holds them (\`lapsed\`).`,
        responses: {
          200: dataResponse(ApiKeyDetailSchema),
          ...apiErrorResponses,
          404: keyNotFound,
        },
      }),
      apiValidator('param', ApiKeyParams),
      async (context) =>
        context.json({
          data: await keys.detail(
            userId(context),
            context.req.valid('param').keyId,
          ),
        }),
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
        description: `${signInOnly} The secret is in this response only. \`permissions: null\` (or the deprecated \`scope: null\`) makes a key that acts as the caller in full.`,
        responses: {
          201: dataResponse(CreatedApiKeySchema, 'The created key.'),
          ...apiErrorResponses,
          403: apiErrorResponse(
            403,
            'The caller may not create keys of their own (`API_KEY_CREATION_FORBIDDEN`), does not hold a permission they give the key (`KEY_SCOPE_EXCEEDS_YOURS`), or asked for a key that acts as them in full while such keys are off (`SAME_AS_ME_DISABLED`).',
          ),
          400: apiErrorResponse(
            400,
            'The expiry or the permissions are not allowed (`EXPIRY_REQUIRED`, `INVALID_EXPIRY`, `INVALID_SCOPE`, `EMPTY_SCOPE`, `UNKNOWN_PERMISSION`, `KEY_ACTION_HUMAN_ONLY`, `UNKNOWN_SCOPE_GROUP`, `SCOPE_LEVEL_NOT_OFFERED`, `SCOPE_OBJECTS_NOT_OFFERED`, `UNKNOWN_SCOPE_OBJECT`).',
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
    // The permission catalogue a key's detail shows: what the caller holds, plus the actions this key still names after
    // the caller lost them, which the server reads from the key itself.
    routes.get(
      '/:keyId/catalog',
      describeRoute({
        tags,
        summary: 'List the permission catalogue of my key',
        operationId: 'apiKeysGetKeyCatalog',
        ...newRouteOffCommandLine,
        description: `${signInOnly} The authorization catalogue limited to what the caller holds today, plus the actions of this key the caller no longer holds, so its detail can show them as lapsed. Answers 404 without the authorization plugin.`,
        responses: {
          200: dataResponse(AuthorizationOptionsSchema),
          ...apiErrorResponses,
          404: keyNotFound,
        },
      }),
      apiValidator('param', ApiKeyParams),
      async (context) => {
        const detail = await keys.detail(
          userId(context),
          context.req.valid('param').keyId,
        );
        if (!container.has(authorizationToken))
          throw new ApiKeyRequestError(
            404,
            'KEY_NOT_FOUND',
            'Key permissions need the authorization plugin.',
          );
        const authz = container.resolve(authorizationToken);
        const [options, snapshot] = await Promise.all([
          authorizationOptions(authz),
          authz.for(await keys.identityOf(userId(context))).snapshot(),
        ]);
        return context.json({
          data: grantableAuthorizationOptions(
            options,
            snapshot,
            detail.lapsed.map((grant) => ({
              resource: grant.resource,
              actions: grant.actions.map(({ action }) => action),
            })),
          ),
        });
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
    if (
      container.has(authorizationToken) &&
      container.has(systemApiKeysToken) &&
      config.get<ApiKeysConfig>('apiKeys')?.systemApiKeyRoutes !== false
    ) {
      const system = new Hono<Env>();
      system.onError((error, context) =>
        apiErrorHandler(toApiKeysApiError(error), context),
      );
      system.use('*', container.resolve(authenticationToken).required());
      system.use('*', requireSignInSession());
      system.use('*', container.resolve(authorizationToken).middleware());
      installSystemKeys(system, container.resolve(systemApiKeysToken));
      router.route('/systemApiKeys', system);
    }
    return router;
  });

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
