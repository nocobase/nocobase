import { ApiError, parseApiInput } from '@nocobase/app-server/router';
import type { AuthorizationRouteHandler } from '@nocobase/authorization/core';
import type {
  RestrictionRule,
  RestrictionRulesApi,
} from '@nocobase/authorization/restriction-rules';
import {
  AUTHORIZATION_ERROR_DOMAIN,
  assertRuleKeyAvailable,
  createRouteHandler,
  createRuleSupportRoutes,
  createSettingsRouter,
  parse,
  requireSettings,
  rethrowRuleConflict,
  settingsAccess,
  RuleParams,
  SubjectRuleBody,
  SubjectRulePatchBody,
  validateDataScopeRule,
  type AuthorizationExtensionHost,
} from '@nocobase/app-plugin-authorization/server/extension';
import { validator } from 'hono/validator';

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
    }),
  );
  // A bounded configuration list: every rule, with `meta.total`.
  routes.get(RESTRICTION_RULES_PATH, async (context) => {
    await requireSettings(
      context.env.authorization,
      RESTRICTION_RULES_SETTINGS,
      'read',
    );
    const rules = await api.list();
    return context.json({ data: rules, meta: { total: rules.length } });
  });
  routes.post(
    RESTRICTION_RULES_PATH,
    settingsAccess(RESTRICTION_RULES_SETTINGS, 'create'),
    validator('json', (value) => parseApiInput(SubjectRuleBody, value)),
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
    validator('param', (value) => parseApiInput(RuleParams, value)),
    validator('json', (value) => parseApiInput(SubjectRulePatchBody, value)),
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
    validator('param', (value) => parseApiInput(RuleParams, value)),
    async (context) => {
      const { key } = context.req.valid('param');
      await existing(key);
      await api.delete(key);
      return context.body(null, 204);
    },
  );
  return createRouteHandler(routes);
}
