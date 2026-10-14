/**
 * Studio's roles, members and access settings (`/access`), and the organization's API keys (`/organizationKeys`).
 * Every path is behind authentication and the authorization context; what the caller may do is read once per request,
 * kept to the scope of the API key the request came with (`StudioAccess.permissionsOf`), and checked before the input.
 * A scoped key may reach `/access` (the `studio.members` permission group); no key at all reaches the organization's
 * keys, which take a sign-in (`requireSignInSession`).
 *
 * | route                                          | needs                       |
 * | ---------------------------------------------- | --------------------------- |
 * | `GET /access/me`                               | signed in                   |
 * | `GET /access/catalog`                          | `studio.roles/read`         |
 * | `GET /access/roles`, `/access/roles/:roleKey`  | `studio.roles/read`           |
 * | `POST`, `PATCH`, `DELETE /access/roles…`       | `studio.roles/manage`   |
 * | `GET` / `PUT /access/settings`                 | `pm.general/read`, `update` |
 * | `GET /organizationKeys…`                       | `studio.apiKeys/read`        |
 * | any write of `/organizationKeys…`              | `studio.apiKeys/manage`      |
 */
import { requireSignInSession } from '@nocobase/app-plugin-api-keys/server';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  emptyResponse,
  listResponse,
  type ApiResponseObject,
  type CliRouteOptions,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import type { AuthorizationIdentity } from '@nocobase/authorization/core';
import { Hono, type Context, type MiddlewareHandler } from 'hono';

import { databaseManagerToken } from '@nocobase/db';
import { z } from 'zod';
import { prepareStudioAccessUpgrade } from './upgrade-preflight.js';
import {
  restoreStudioAccess,
  type AccessUpgradeChange,
} from './upgrade-recovery.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import { boundedList } from '../http/input.js';
import {
  AccessCatalogSchema,
  AccessMeSchema,
  AccessSettingsInput,
  AccessSettingsSchema,
  CreatedOrgApiKeySchema,
  CreateOrgKeyInput,
  CreateRoleInput,
  KeyParams,
  KeyScopeOptionsSchema,
  OrgApiKeyEventSchema,
  OrgApiKeySchema,
  RoleParams,
  RoleSchema,
  SaveRoleInput,
  SetOrgKeyScopeInput,
  UpdateOrgKeyInput,
} from './schemas.js';
import type { AccessViewer } from './service.js';
import { studioAccessToken, studioApiKeysToken } from './token.js';

type Env = { Variables: { studioViewer: AccessViewer } };

const tags = ['Studio'];
type SettingKey = keyof AccessViewer['permissions']['settings'];

/** Refuses a caller without the settings capability, before the input is read. */
function requires(key: SettingKey, message: string): MiddlewareHandler<Env> {
  return async (context, next) => {
    if (!context.get('studioViewer').permissions.settings[key])
      throw studioError('PERMISSION_DENIED', 'FORBIDDEN', message);
    await next();
  };
}

export const accessRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const { container } = app;
    // Without authentication and authorization (an application's own tests) there is nothing to serve.
    if (
      !container.has(authorizationToken) ||
      !container.has(authenticationToken)
    )
      return new Hono();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const access = container.resolve(studioAccessToken);
    const { roles } = access;
    const apiKeys = () => container.resolve(studioApiKeysToken);

    /** A router behind authentication with the caller's viewer; `signInOnly` refuses every API key. */
    const scoped = (signInOnly: boolean) => {
      const routes = new Hono<Env>();
      routes.onError(studioErrorHandler);
      routes.use('*', authentication.required({ scopedKeys: true }));
      if (signInOnly)
        routes.use('*', requireSignInSession() as unknown as MiddlewareHandler);
      routes.use('*', authorization.middleware());
      routes.use('*', async (context, next) => {
        const auth = context.get('auth' as never) as { user: { id: string } };
        const authz = context.get('authz' as never) as {
          identity: Parameters<typeof access.permissionsOf>[0];
        };
        context.set('studioViewer', {
          userId: auth.user.id,
          permissions: await access.permissionsOf(authz.identity),
        });
        await next();
      });
      return routes;
    };
    const viewer = (context: Context<Env>) => context.get('studioViewer');

    const readMembers = requires(
      'studio.roles/read',
      'You may not read the member settings.',
    );
    const defineRoles = requires(
      'studio.roles/manage',
      'Only someone who may define roles may do this.',
    );

    const settings = scoped(false);
    settings.get(
      '/me',
      describeRoute({
        tags,
        summary: 'Get the caller’s own roles',
        operationId: 'accessGetMe',
        ...cliRoute({ command: 'access me' }),
        responses: {
          200: dataResponse(AccessMeSchema),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      async (c) => c.json({ data: await roles.me(viewer(c)) }),
    );
    settings.get(
      '/catalog',
      readMembers,
      describeRoute({
        tags,
        summary: 'Get what a role can hold',
        description:
          'The businesses and settings items the assembled plugins registered with the authorization plugin: titles, descriptions, sections, and each business action with the levels it offers and the action that grants each.',
        operationId: 'accessGetCatalog',
        ...cliRoute({ command: 'access catalog' }),
        responses: {
          200: dataResponse(AccessCatalogSchema),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      (c) => {
        const { businesses, settings: items } = access.catalog();
        return c.json({ data: { businesses, settings: items } });
      },
    );
    settings.get(
      '/roles',
      readMembers,
      describeRoute({
        tags,
        summary: 'List the roles',
        operationId: 'accessListRoles',
        ...cliRoute({
          command: 'access role list',
          columns: ['key', 'title', 'builtIn', 'holderCount'],
        }),
        description: 'Needs `studio.roles` `read`.',
        responses: { 200: listResponse(RoleSchema), ...apiErrorResponses },
      }),
      async (c) => c.json(boundedList(await roles.list(viewer(c)))),
    );
    settings.post(
      '/roles',
      defineRoles,
      describeRoute({
        tags,
        summary: 'Create a role',
        operationId: 'accessCreateRole',
        ...cliRoute({
          command: 'access role create',
          bodyFile: 'file',
          examples: ['access role create --file role.json'],
        }),
        description: 'Needs `pm.members` `define-roles`.',
        responses: {
          201: dataResponse(RoleSchema),
          400: apiErrorResponse(
            400,
            'When the title, a page, a capability or a level is not one the catalog offers.',
          ),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', CreateRoleInput),
      async (c) =>
        c.json(
          { data: await roles.create(viewer(c), c.req.valid('json')) },
          201,
        ),
    );
    settings.get(
      '/roles/:roleKey',
      readMembers,
      describeRoute({
        tags,
        summary: 'Get a role',
        operationId: 'accessGetRole',
        ...cliRoute({
          command: 'access role get',
          flags: { roleKey: { name: 'role' } },
        }),
        description: 'Needs `studio.roles` `read`.',
        responses: {
          200: dataResponse(RoleSchema),
          404: apiErrorResponse(404),
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', RoleParams),
      async (c) =>
        c.json({
          data: await roles.get(viewer(c), c.req.valid('param').roleKey),
        }),
    );
    settings.patch(
      '/roles/:roleKey',
      defineRoles,
      describeRoute({
        tags,
        summary: 'Update a role',
        operationId: 'accessUpdateRole',
        ...cliRoute({
          command: 'access role update',
          bodyFile: 'file',
          flags: { roleKey: { name: 'role' } },
        }),
        description:
          'Needs `pm.members` `define-roles`. A field left out keeps what the role grants now; `owner` is not edited (403 `ROLE_NOT_EDITABLE`).',
        responses: {
          200: dataResponse(RoleSchema),
          400: apiErrorResponse(
            400,
            'When the title, a page, a capability or a level is not one the catalog offers.',
          ),
          404: apiErrorResponse(404),
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', RoleParams),
      apiValidator('json', SaveRoleInput),
      async (c) =>
        c.json({
          data: await roles.update(
            viewer(c),
            c.req.valid('param').roleKey,
            c.req.valid('json'),
          ),
        }),
    );
    settings.delete(
      '/roles/:roleKey',
      defineRoles,
      describeRoute({
        tags,
        summary: 'Delete a role',
        operationId: 'accessDeleteRole',
        ...cliRoute({
          command: 'access role delete',
          flags: { roleKey: { name: 'role' } },
          confirm: 'Delete this role? Its holders lose what it grants.',
        }),
        description:
          'Needs `pm.members` `define-roles`. Built-in roles are not deleted (403 `ROLE_BUILT_IN`).',
        responses: {
          204: emptyResponse(),
          400: apiErrorResponse(
            400,
            'When someone still holds the role (`ROLE_IN_USE`) or it is the default role (`ROLE_IS_DEFAULT`).',
          ),
          404: apiErrorResponse(404),
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', RoleParams),
      async (c) => {
        await roles.remove(viewer(c), c.req.valid('param').roleKey);
        return c.body(null, 204);
      },
    );
    settings.get(
      '/settings',
      requires('pm.general/read', 'You may not read the general settings.'),
      describeRoute({
        tags,
        summary: 'Get the access settings',
        operationId: 'accessGetSettings',
        ...cliRoute({ command: 'access settings get' }),
        description: 'Needs `pm.general` `read`.',
        responses: {
          200: dataResponse(AccessSettingsSchema),
          ...apiErrorResponses,
        },
      }),
      async (c) => c.json({ data: await roles.settings(viewer(c)) }),
    );
    settings.put(
      '/settings',
      requires('pm.general/update', 'You may not change the general settings.'),
      describeRoute({
        tags,
        summary: 'Replace the access settings',
        operationId: 'accessReplaceSettings',
        ...cliRoute({
          command: 'access settings set',
          examples: ['access settings set --default-role contributor'],
        }),
        description: 'Needs `pm.general` `update`.',
        responses: {
          200: dataResponse(AccessSettingsSchema),
          400: apiErrorResponse(400, 'When the default role does not exist.'),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', AccessSettingsInput),
      async (c) =>
        c.json({
          data: await roles.updateSettings(viewer(c), c.req.valid('json')),
        }),
    );

    // The organization's API keys: a sign-in only, never an API key of any kind.
    const keys = scoped(true);
    const readKeys = requires(
      'studio.apiKeys/read',
      'You may not see the organization’s API keys.',
    );
    const manageKeys = requires(
      'studio.apiKeys/manage',
      'Only someone who manages API keys may do this.',
    );
    const identity = (c: Context) =>
      (c.get('authz' as never) as { identity: AuthorizationIdentity }).identity;
    /** A route of `/organizationKeys`: a signed-in session only, needing `studio.apiKeys` `action`. */
    const keyRoute = (
      action: 'read' | 'manage',
      route: {
        summary: string;
        operationId: string;
        description?: string;
        responses: Record<string, ApiResponseObject>;
        cli: CliRouteOptions;
      },
    ) =>
      describeRoute({
        tags,
        summary: route.summary,
        operationId: route.operationId,
        ...cliRoute({
          ...route.cli,
          flags: { keyId: { name: 'key' }, ...route.cli.flags },
        }),
        description: [
          `Needs a signed-in session (every API key is refused) and \`studio.apiKeys\` \`${action}\`.`,
          route.description,
        ]
          .filter(Boolean)
          .join(' '),
        security: [{ cookieAuth: [] }],
        responses: { ...route.responses, ...apiErrorResponses },
      });
    keys.get(
      '/',
      readKeys,
      keyRoute('read', {
        summary: 'List the organization’s API keys',
        operationId: 'organizationKeysListKeys',
        cli: {
          command: 'access org-key list',
          columns: ['id', 'name', 'status', 'start', 'expiresAt', 'lastUsedAt'],
        },
        responses: { 200: listResponse(OrgApiKeySchema) },
      }),
      async (c) => c.json(boundedList(await apiKeys().list(viewer(c)))),
    );
    keys.get(
      '/scopeOptions',
      manageKeys,
      keyRoute('manage', {
        summary: 'Get the permission groups a key may be given',
        operationId: 'organizationKeysGetScopeOptions',
        cli: { command: 'access org-key scope-options' },
        responses: { 200: dataResponse(KeyScopeOptionsSchema) },
      }),
      async (c) => c.json({ data: await apiKeys().scopeOptions(viewer(c)) }),
    );
    keys.post(
      '/',
      manageKeys,
      keyRoute('manage', {
        summary: 'Create an organization API key',
        operationId: 'organizationKeysCreateKey',
        cli: {
          command: 'access org-key create',
          bodyFile: 'file',
          examples: ['access org-key create --file key.json'],
        },
        description:
          'The secret is answered once. The key gets only what the caller holds (403 `KEY_SCOPE_EXCEEDS_YOURS`).',
        responses: {
          201: dataResponse(CreatedOrgApiKeySchema),
          400: apiErrorResponse(
            400,
            'When the name, expiry or permission groups are not acceptable.',
          ),
        },
      }),
      apiValidator('json', CreateOrgKeyInput),
      async (c) => {
        c.header('Cache-Control', 'no-store');
        return c.json(
          {
            data: await apiKeys().create(
              viewer(c),
              identity(c),
              c.req.valid('json'),
            ),
          },
          201,
        );
      },
    );
    keys.get(
      '/:keyId',
      readKeys,
      keyRoute('read', {
        summary: 'Get an organization API key',
        operationId: 'organizationKeysGetKey',
        cli: { command: 'access org-key get' },
        responses: {
          200: dataResponse(OrgApiKeySchema),
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', KeyParams),
      async (c) =>
        c.json({
          data: await apiKeys().get(viewer(c), c.req.valid('param').keyId),
        }),
    );
    keys.patch(
      '/:keyId',
      manageKeys,
      keyRoute('manage', {
        summary: 'Update an organization API key’s name or description',
        operationId: 'organizationKeysUpdateKey',
        cli: { command: 'access org-key update' },
        responses: {
          200: dataResponse(OrgApiKeySchema),
          400: apiErrorResponse(400, 'When the name is not acceptable.'),
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', KeyParams),
      apiValidator('json', UpdateOrgKeyInput),
      async (c) =>
        c.json({
          data: await apiKeys().update(
            viewer(c),
            c.req.valid('param').keyId,
            c.req.valid('json'),
          ),
        }),
    );
    keys.put(
      '/:keyId/scope',
      manageKeys,
      keyRoute('manage', {
        summary: 'Replace an organization API key’s permissions',
        operationId: 'organizationKeysReplaceKeyScope',
        cli: { command: 'access org-key scope set', bodyFile: 'file' },
        description:
          'The key gets only what the caller holds (403 `KEY_SCOPE_EXCEEDS_YOURS`).',
        responses: {
          200: dataResponse(OrgApiKeySchema),
          400: apiErrorResponse(
            400,
            'When a permission group or level is not one offered.',
          ),
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', KeyParams),
      apiValidator('json', SetOrgKeyScopeInput),
      async (c) =>
        c.json({
          data: await apiKeys().setScope(
            viewer(c),
            identity(c),
            c.req.valid('param').keyId,
            c.req.valid('json'),
          ),
        }),
    );
    keys.post(
      '/:keyId/rotate',
      manageKeys,
      keyRoute('manage', {
        summary: 'Rotate an organization API key’s secret',
        operationId: 'organizationKeysRotateKey',
        cli: {
          command: 'access org-key rotate',
          confirm: 'Rotate this key? The old secret stops working.',
        },
        description:
          'Keeps the identity, key id, name and permissions; the new secret is answered once.',
        responses: {
          200: dataResponse(CreatedOrgApiKeySchema),
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', KeyParams),
      async (c) => {
        c.header('Cache-Control', 'no-store');
        return c.json({
          data: await apiKeys().rotate(viewer(c), c.req.valid('param').keyId),
        });
      },
    );
    keys.post(
      '/:keyId/disable',
      manageKeys,
      keyRoute('manage', {
        summary: 'Disable an organization API key',
        operationId: 'organizationKeysDisableKey',
        cli: { command: 'access org-key disable' },
        responses: {
          200: dataResponse(OrgApiKeySchema),
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', KeyParams),
      async (c) =>
        c.json({
          data: await apiKeys().disable(viewer(c), c.req.valid('param').keyId),
        }),
    );
    keys.post(
      '/:keyId/enable',
      manageKeys,
      keyRoute('manage', {
        summary: 'Enable an organization API key',
        operationId: 'organizationKeysEnableKey',
        cli: { command: 'access org-key enable' },
        responses: {
          200: dataResponse(OrgApiKeySchema),
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', KeyParams),
      async (c) =>
        c.json({
          data: await apiKeys().enable(viewer(c), c.req.valid('param').keyId),
        }),
    );
    // An audit trail per key: short, answered whole.
    keys.get(
      '/:keyId/events',
      readKeys,
      keyRoute('read', {
        summary: 'List what happened to an organization API key',
        operationId: 'organizationKeysListKeyEvents',
        cli: {
          command: 'access org-key events',
          columns: ['createdAt', 'action', 'actor.name'],
        },
        description: 'Newest first.',
        responses: {
          200: listResponse(OrgApiKeyEventSchema),
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', KeyParams),
      async (c) =>
        c.json(
          boundedList(
            await apiKeys().events(viewer(c), c.req.valid('param').keyId),
          ),
        ),
    );
    keys.delete(
      '/:keyId',
      manageKeys,
      keyRoute('manage', {
        summary: 'Delete an organization API key',
        operationId: 'organizationKeysDeleteKey',
        cli: {
          command: 'access org-key delete',
          confirm: 'Delete this key? Whatever uses it stops working.',
        },
        responses: { 204: emptyResponse(), 404: apiErrorResponse(404) },
      }),
      apiValidator('param', KeyParams),
      async (c) => {
        await apiKeys().remove(viewer(c), c.req.valid('param').keyId);
        return c.body(null, 204);
      },
    );

    settings.get(
      '/upgrades/pm358/prepare',
      defineRoles,
      requireSignInSession() as unknown as MiddlewareHandler,
      describeRoute({
        tags,
        summary: 'Prepare a credentials-free Studio access upgrade inventory',
        operationId: 'accessPrepareUpgrade',
        ...cliRoute({
          command: 'access upgrade prepare',
          identities: ['user'],
        }),
        responses: {
          200: dataResponse(
            z.object({
              version: z.string(),
              roles: z.array(
                z.object({
                  roleId: z.string(),
                  roleKey: z.string(),
                  beforeGrants: z.string(),
                  afterGrants: z.string().nullable(),
                  blocked: z.string().nullable(),
                }),
              ),
              assignmentHash: z.string(),
              defaultRoleHash: z.string(),
              keyReviewRequired: z.number().int(),
              unknownAccountKindCount: z.number().int(),
            }),
          ),
          ...apiErrorResponses,
        },
      }),
      async (c) =>
        c.json({
          data: await prepareStudioAccessUpgrade(
            container.resolve(databaseManagerToken).connection(),
            access,
          ),
        }),
    );
    settings.get(
      '/upgrades/pm358',
      defineRoles,
      requireSignInSession() as unknown as MiddlewareHandler,
      describeRoute({
        tags,
        summary: 'Read the Studio access upgrade recovery record',
        operationId: 'accessReadUpgradeChanges',
        ...cliRoute({
          command: 'access upgrade inspect',
          identities: ['user'],
        }),
        responses: {
          200: dataResponse(
            z.object({ version: z.string(), changedRoles: z.number().int() }),
          ),
          ...apiErrorResponses,
        },
      }),
      async (c) => {
        const rows = await container
          .resolve(databaseManagerToken)
          .connection()
          .repository<AccessUpgradeChange>('studioAccessUpgradeChanges')
          .findMany({ filter: { version: 'pm358-v1' } });
        return c.json({
          data: { version: 'pm358-v1', changedRoles: rows.length },
        });
      },
    );
    settings.post(
      '/upgrades/pm358/restore',
      defineRoles,
      requireSignInSession() as unknown as MiddlewareHandler,
      describeRoute({
        tags,
        summary: 'Restore the Studio access grants during maintenance',
        operationId: 'accessRestoreUpgradeChanges',
        ...cliRoute({
          command: 'access upgrade restore',
          identities: ['user'],
          confirm:
            'Restore the recorded role grants? All old writers must remain stopped.',
        }),
        responses: {
          200: dataResponse(z.object({ restored: z.number().int() })),
          ...apiErrorResponses,
        },
      }),
      async (c) => {
        if (
          app.config.get<boolean>('studio.accessUpgrade.maintenance') !== true
        )
          throw studioError(
            'FAILED_PRECONDITION',
            'STUDIO_ACCESS_MAINTENANCE_REQUIRED',
            'Stop old writers and confirm maintenance before restoration.',
          );
        const restored = await restoreStudioAccess(
          container.resolve(databaseManagerToken),
          authorization,
        );
        return c.json({ data: { restored } });
      },
    );

    const router = new Hono();
    router.route('/access', settings);
    router.route('/organizationKeys', keys);
    return router;
  });
