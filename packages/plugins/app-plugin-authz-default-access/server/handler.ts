import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import type { AuthorizationRouteHandler } from '@nocobase/authorization/core';
import {
  DefaultAccessConflictError,
  type DefaultAccessApi,
  type DefaultAccessRule,
} from '@nocobase/authorization/default-access';
import {
  AUTHORIZATION_API_TAGS as tags,
  AUTHORIZATION_ERROR_DOMAIN,
  assertRuleKeyAvailable,
  createRouteHandler,
  createRuleSupportRoutes,
  createSettingsRouter,
  DataScopeRuleBody,
  DataScopeRulePatchBody,
  parse,
  rethrowRuleConflict,
  settingsAccess,
  TotalMetaSchema,
  RuleParams,
  validateDataScopeRule,
  type AuthorizationExtensionHost,
} from '@nocobase/app-plugin-authorization/server/extension';
import { RuleSchema } from './schemas.js';

/** The settings item suffix, and the rule name stored grants refer to. */
export const DEFAULT_ACCESS_RULE = 'default-access';
export const DEFAULT_ACCESS_SETTINGS: string = `authorization.${DEFAULT_ACCESS_RULE}`;
/** The route prefix under `/api/authorization`. */
export const DEFAULT_ACCESS_PATH = '/defaultAccess';

type DefaultAccessAdministrationApi = Omit<DefaultAccessApi, 'withTransaction'>;

/** Every `/defaultAccess` route, gated by `settings:authorization.default-access`. */
export function createDefaultAccessHandler(
  authz: AuthorizationExtensionHost,
  api: DefaultAccessAdministrationApi,
): AuthorizationRouteHandler {
  const routes = createSettingsRouter((error) =>
    error instanceof DefaultAccessConflictError
      ? new ApiError({
          status: 'ALREADY_EXISTS',
          reason: 'DEFAULT_ACCESS_CONFLICT',
          domain: AUTHORIZATION_ERROR_DOMAIN,
          message: error.message,
          metadata: { existing: error.existing },
          cause: error,
        })
      : undefined,
  );
  const checked = (value: unknown): DefaultAccessRule => {
    const { key, resource, actions } = parse.rule(value);
    const rule = { key, resource, actions };
    validateDataScopeRule(authz, rule);
    return rule;
  };
  const existing = async (key: string): Promise<DefaultAccessRule> => {
    const rule = await api.get(key);
    if (rule) return rule;
    throw new ApiError({
      status: 'NOT_FOUND',
      reason: 'RULE_NOT_FOUND',
      domain: AUTHORIZATION_ERROR_DOMAIN,
      message: `Default-access rule ${key} was not found.`,
    });
  };
  // Fixed segments (`options`, `subjects`, `records`) are registered before `/:key`.
  routes.route(
    '/',
    createRuleSupportRoutes(authz, {
      path: DEFAULT_ACCESS_PATH,
      settings: DEFAULT_ACCESS_SETTINGS,
      name: 'DefaultAccessRule',
    }),
  );
  // A bounded configuration list: every rule, with `meta.total`.
  routes.get(
    DEFAULT_ACCESS_PATH,
    settingsAccess(DEFAULT_ACCESS_SETTINGS, 'read'),
    describeRoute({
      tags,
      summary: 'List default-access rules',
      operationId: 'authorizationListDefaultAccessRules',
      description:
        'Every default-access rule. A bounded configuration list: it is not paged. Requires `settings:authorization.default-access` `read`.',
      responses: {
        200: listResponse(RuleSchema, TotalMetaSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) => {
      const rules = await api.list();
      return context.json({ data: rules, meta: { total: rules.length } });
    },
  );
  routes.post(
    DEFAULT_ACCESS_PATH,
    settingsAccess(DEFAULT_ACCESS_SETTINGS, 'create'),
    describeRoute({
      tags,
      summary: 'Create a default-access rule',
      operationId: 'authorizationCreateDefaultAccessRule',
      description:
        'A default-access rule gives every identity records for each action of one resource, in addition to its grants. A resource, action, data scope or record access the registered model does not accept answers `400` with reason `INVALID_AUTHORIZATION_INPUT`. Requires `settings:authorization.default-access` `create`.',
      responses: {
        201: dataResponse(RuleSchema, 'The created rule.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The registered model does not accept a resource, action, data scope or record access the rule names (`INVALID_AUTHORIZATION_INPUT`).',
        ),
        409: apiErrorResponse(
          409,
          'A rule with this key already exists (`RULE_ALREADY_EXISTS`), or another default-access rule already covers this resource (`DEFAULT_ACCESS_CONFLICT`).',
        ),
      },
    }),
    apiValidator('json', DataScopeRuleBody),
    async (context) => {
      const rule = checked(context.req.valid('json'));
      await assertRuleKeyAvailable((key) => api.get(key), rule.key);
      return context.json(
        {
          data: await api.create(rule).catch(rethrowRuleConflict(rule.key)),
        },
        201,
      );
    },
  );
  routes.patch(
    `${DEFAULT_ACCESS_PATH}/:key`,
    settingsAccess(DEFAULT_ACCESS_SETTINGS, 'update'),
    describeRoute({
      tags,
      summary: 'Update a default-access rule',
      operationId: 'authorizationUpdateDefaultAccessRule',
      description:
        'Changes only the fields the body names. A changed `key` renames the rule. A resource, action, data scope or record access the registered model does not accept answers `400` with reason `INVALID_AUTHORIZATION_INPUT`. Requires `settings:authorization.default-access` `update`.',
      responses: {
        200: dataResponse(RuleSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The registered model does not accept a resource, action, data scope or record access the rule names (`INVALID_AUTHORIZATION_INPUT`).',
        ),
        404: apiErrorResponse(
          404,
          'The rule does not exist (`RULE_NOT_FOUND`).',
        ),
        409: apiErrorResponse(
          409,
          'Another rule already uses the new key (`RULE_ALREADY_EXISTS`), or another default-access rule already covers this resource (`DEFAULT_ACCESS_CONFLICT`).',
        ),
      },
    }),
    apiValidator('param', RuleParams),
    apiValidator('json', DataScopeRulePatchBody),
    async (context) => {
      const { key } = context.req.valid('param');
      const rule = checked({
        ...(await existing(key)),
        ...context.req.valid('json'),
      });
      // A changed `key` renames the rule, and the new key must be free.
      await assertRuleKeyAvailable((next) => api.get(next), rule.key, key);
      return context.json({
        data: await api.update(key, rule).catch(rethrowRuleConflict(rule.key)),
      });
    },
  );
  routes.delete(
    `${DEFAULT_ACCESS_PATH}/:key`,
    settingsAccess(DEFAULT_ACCESS_SETTINGS, 'delete'),
    describeRoute({
      tags,
      summary: 'Delete a default-access rule',
      operationId: 'authorizationDeleteDefaultAccessRule',
      description: 'Requires `settings:authorization.default-access` `delete`.',
      responses: {
        204: emptyResponse('The rule was deleted.'),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'The rule does not exist (`RULE_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', RuleParams),
    async (context) => {
      const { key } = context.req.valid('param');
      await existing(key);
      await api.delete(key);
      return context.body(null, 204);
    },
  );
  return createRouteHandler(routes);
}
