import { auditRecordKey, describeAudit } from '@nocobase/audit';
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
  SharingRule,
  SharingRulesApi,
} from '@nocobase/authorization/sharing-rules';
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
export const SHARING_RULES_RULE = 'sharing-rules';
export const SHARING_RULES_SETTINGS: string = `authorization.${SHARING_RULES_RULE}`;
/** The route prefix under `/api/authorization`. */
export const SHARING_RULES_PATH = '/sharingRules';

const auditCollection = 'authorizationSharingRules';

type SharingRulesAdministrationApi = Omit<SharingRulesApi, 'withTransaction'>;

/** Every `/sharingRules` route, gated by `settings:authorization.sharing-rules`. */
export function createSharingRulesHandler(
  authz: AuthorizationExtensionHost,
  api: SharingRulesAdministrationApi,
): AuthorizationRouteHandler {
  const routes = createSettingsRouter();
  const checked = async (value: unknown): Promise<SharingRule> => {
    const rule = parse.rule(value, { withSubjects: true });
    validateDataScopeRule(authz, rule);
    const subjects = rule.subjects ?? [];
    // A subject type may keep some of its ids from being shared with, such as service accounts, which act as no person.
    for (const type of new Set(subjects.map((subject) => subject.type))) {
      const definition = authz.subjects.get(type);
      if (!definition?.filterShareable) continue;
      const ids = subjects
        .filter((subject) => subject.type === type)
        .map((subject) => subject.id);
      const shareable = new Set(await definition.filterShareable(ids));
      const refused = ids.filter((id) => !shareable.has(id));
      if (refused.length)
        throw new TypeError(
          `A sharing rule cannot name ${type} ${refused.join(', ')}: only people can be shared with.`,
        );
    }
    return { ...rule, subjects };
  };
  const existing = async (key: string): Promise<SharingRule> => {
    const rule = await api.get(key);
    if (rule) return rule;
    throw new ApiError({
      status: 'NOT_FOUND',
      reason: 'RULE_NOT_FOUND',
      domain: AUTHORIZATION_ERROR_DOMAIN,
      message: `Sharing rule ${key} was not found.`,
    });
  };
  // Fixed segments (`options`, `subjects`, `records`) are registered before `/:key`.
  routes.route(
    '/',
    createRuleSupportRoutes(authz, {
      path: SHARING_RULES_PATH,
      settings: SHARING_RULES_SETTINGS,
      name: 'SharingRule',
    }),
  );
  // A bounded configuration list: every rule, with `meta.total`.
  routes.get(
    SHARING_RULES_PATH,
    settingsAccess(SHARING_RULES_SETTINGS, 'read'),
    describeRoute({
      tags,
      summary: 'List sharing rules',
      operationId: 'authorizationListSharingRules',
      description:
        'Every sharing rule. A bounded configuration list: it is not paged. Requires `settings:authorization.sharing-rules` `read`.',
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
    SHARING_RULES_PATH,
    describeAudit({
      action: 'create',
      resource: `settings:${SHARING_RULES_SETTINGS}`,
      target: (context) => ({
        collection: auditCollection,
        key: context.req.param('key'),
      }),
      resolveTargets: ({ response }, context) => {
        const previous = context.req.param('key');
        const key = auditRecordKey(response, 'data', 'key') ?? previous;
        return {
          source:
            previous && previous !== key
              ? { collection: auditCollection, key: previous }
              : undefined,
          targets: [{ collection: auditCollection, key }],
        };
      },
    }),
    settingsAccess(SHARING_RULES_SETTINGS, 'create'),
    describeRoute({
      tags,
      summary: 'Create a sharing rule',
      operationId: 'authorizationCreateSharingRule',
      description:
        'A sharing rule gives the listed subjects extra records for each action, in addition to their grants; it never selects all records. A resource, action, data scope or record access the registered model does not accept answers `400` with reason `INVALID_AUTHORIZATION_INPUT`. Requires `settings:authorization.sharing-rules` `create`.',
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
      const rule = await checked(context.req.valid('json'));
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
    `${SHARING_RULES_PATH}/:key`,
    describeAudit({
      action: 'update',
      resource: `settings:${SHARING_RULES_SETTINGS}`,
      target: (context) => ({
        collection: auditCollection,
        key: context.req.param('key'),
      }),
      resolveTargets: ({ response }, context) => {
        const previous = context.req.param('key');
        const key = auditRecordKey(response, 'data', 'key') ?? previous;
        return {
          source:
            previous && previous !== key
              ? { collection: auditCollection, key: previous }
              : undefined,
          targets: [{ collection: auditCollection, key }],
        };
      },
    }),
    settingsAccess(SHARING_RULES_SETTINGS, 'update'),
    describeRoute({
      tags,
      summary: 'Update a sharing rule',
      operationId: 'authorizationUpdateSharingRule',
      description:
        'Changes only the fields the body names; `null` clears a title or reason. A changed `key` renames the rule. A resource, action, data scope or record access the registered model does not accept answers `400` with reason `INVALID_AUTHORIZATION_INPUT`. Requires `settings:authorization.sharing-rules` `update`.',
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
      const rule = await checked({
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
    `${SHARING_RULES_PATH}/:key`,
    describeAudit({
      action: 'delete',
      resource: `settings:${SHARING_RULES_SETTINGS}`,
      target: (context) => ({
        collection: auditCollection,
        key: context.req.param('key'),
      }),
    }),
    settingsAccess(SHARING_RULES_SETTINGS, 'delete'),
    describeRoute({
      tags,
      summary: 'Delete a sharing rule',
      operationId: 'authorizationDeleteSharingRule',
      description: 'Requires `settings:authorization.sharing-rules` `delete`.',
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
