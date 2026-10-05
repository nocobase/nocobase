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
import type {
  RestrictionRule,
  RestrictionRulesApi,
} from '@nocobase/authorization/restriction-rules';
import {
  AUTHORIZATION_API_TAGS as tags,
  AUTHORIZATION_ERROR_DOMAIN,
  assertRuleKeyAvailable,
  createRouteHandler,
  createRuleSupportRoutes,
  createSettingsRouter,
  parse,
  rethrowRuleConflict,
  settingsAccess,
  TotalMetaSchema,
  RuleParams,
  SubjectRuleBody,
  SubjectRulePatchBody,
  validateDataScopeRule,
  type AuthorizationExtensionHost,
} from '@nocobase/app-plugin-authorization/server/extension';
import { RuleSchema } from './schemas.js';

/** The settings item suffix, and the rule name stored grants refer to. */
export const RESTRICTION_RULES_RULE = 'restriction-rules';
export const RESTRICTION_RULES_SETTINGS: string = `authorization.${RESTRICTION_RULES_RULE}`;
/** The route prefix under `/api/authorization`. */
export const RESTRICTION_RULES_PATH = '/restrictionRules';

type RestrictionRulesAdministrationApi = Omit<
  RestrictionRulesApi,
  'withTransaction'
>;

/** Every `/restrictionRules` route, gated by `settings:authorization.restriction-rules`. */
export function createRestrictionRulesHandler(
  authz: AuthorizationExtensionHost,
  api: RestrictionRulesAdministrationApi,
): AuthorizationRouteHandler {
  const routes = createSettingsRouter();
  const checked = (value: unknown): RestrictionRule => {
    const rule = parse.rule(value, { withSubjects: true });
    validateDataScopeRule(authz, rule);
    return { ...rule, subjects: rule.subjects ?? [] };
  };
  const existing = async (key: string): Promise<RestrictionRule> => {
    const rule = await api.get(key);
    if (rule) return rule;
    throw new ApiError({
      status: 'NOT_FOUND',
      reason: 'RULE_NOT_FOUND',
      domain: AUTHORIZATION_ERROR_DOMAIN,
      message: `Restriction rule ${key} was not found.`,
    });
  };
  // Fixed segments (`options`, `subjects`, `records`) are registered before `/:key`.
  routes.route(
    '/',
    createRuleSupportRoutes(authz, {
      path: RESTRICTION_RULES_PATH,
      settings: RESTRICTION_RULES_SETTINGS,
      name: 'RestrictionRule',
    }),
  );
  // A bounded configuration list: every rule, with `meta.total`.
  routes.get(
    RESTRICTION_RULES_PATH,
    settingsAccess(RESTRICTION_RULES_SETTINGS, 'read'),
    describeRoute({
      tags,
      summary: 'List restriction rules',
      operationId: 'authorizationListRestrictionRules',
      description:
        'Every restriction rule. A bounded configuration list: it is not paged. Requires `settings:authorization.restriction-rules` `read`.',
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
    RESTRICTION_RULES_PATH,
    settingsAccess(RESTRICTION_RULES_SETTINGS, 'create'),
    describeRoute({
      tags,
      summary: 'Create a restriction rule',
      operationId: 'authorizationCreateRestrictionRule',
      description:
        'A restriction rule narrows the records the listed subjects reach for each action; it intersects every other source. A resource, action, data scope or record access the registered model does not accept answers `400` with reason `INVALID_AUTHORIZATION_INPUT`. Requires `settings:authorization.restriction-rules` `create`.',
      responses: {
        201: dataResponse(RuleSchema, 'The created rule.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The registered model does not accept a resource, action, data scope or record access the rule names (`INVALID_AUTHORIZATION_INPUT`).',
        ),
        409: apiErrorResponse(
          409,
          'A rule with this key already exists (`RULE_ALREADY_EXISTS`).',
        ),
      },
    }),
    apiValidator('json', SubjectRuleBody),
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
    `${RESTRICTION_RULES_PATH}/:key`,
    settingsAccess(RESTRICTION_RULES_SETTINGS, 'update'),
    describeRoute({
      tags,
      summary: 'Update a restriction rule',
      operationId: 'authorizationUpdateRestrictionRule',
      description:
        'Changes only the fields the body names; `null` clears a title or reason. A changed `key` renames the rule. A resource, action, data scope or record access the registered model does not accept answers `400` with reason `INVALID_AUTHORIZATION_INPUT`. Requires `settings:authorization.restriction-rules` `update`.',
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
          'Another rule already uses the new key (`RULE_ALREADY_EXISTS`).',
        ),
      },
    }),
    apiValidator('param', RuleParams),
    apiValidator('json', SubjectRulePatchBody),
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
    `${RESTRICTION_RULES_PATH}/:key`,
    settingsAccess(RESTRICTION_RULES_SETTINGS, 'delete'),
    describeRoute({
      tags,
      summary: 'Delete a restriction rule',
      operationId: 'authorizationDeleteRestrictionRule',
      description:
        'Requires `settings:authorization.restriction-rules` `delete`.',
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
