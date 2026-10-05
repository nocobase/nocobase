import type {
  Authorization,
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationRouteHandler,
  AuthorizationSubject,
  ResourceRef,
} from '@nocobase/authorization/core';
import type { PermissionSetsApi } from '@nocobase/authorization/permission-sets';
import {
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import { z } from 'zod';
import {
  createRouteHandler,
  createSettingsRouter,
  settingsAccess,
} from '../extension/http.js';
import {
  AUTHORIZATION_API_TAGS as tags,
  createSubjectRoutes,
} from '../extension/options.js';
import { AuthorizationOptionsSchema } from '../extension/schemas.js';
import type { AuthorizationExtensionHost } from '../host.js';
import { authorizationOptions } from '../options.js';
import {
  AuthorizationDecisionSchema,
  BatchDecideBody,
  BatchDecisionSchema,
  ConfiguredAccessQuery,
  ConfiguredAccessSchema,
  DecideBody,
} from './schemas.js';

export const INSPECTOR_SETTINGS = 'authorization.inspector';

/** A decision, with the underlying checks of a composite action. */
export type InspectedDecision = AuthorizationDecision & {
  readonly checks?: readonly unknown[];
};

/** Every `/inspector` route, gated by `settings:authorization.inspector` `inspect`. */
export function createInspectorHandler(
  host: AuthorizationExtensionHost & Pick<Authorization, 'for'>,
  permissionSets: Pick<
    PermissionSetsApi,
    'getEffective' | 'protection' | 'listAssignments'
  >,
): AuthorizationRouteHandler {
  const routes = createSettingsRouter();
  // The subjects the request middleware adds for this principal.
  const subjectsOf = async (
    subject: AuthorizationSubject,
  ): Promise<AuthorizationSubject[]> => [
    ...(subject.type === 'user' ? [{ type: 'authenticated', id: '*' }] : []),
    ...(await host.subjects.resolveFor(subject)),
  ];
  const contextFor = async (
    subject: AuthorizationSubject,
  ): Promise<AuthorizationContext> =>
    host.for({ principal: subject, subjects: await subjectsOf(subject) });

  routes.get(
    '/inspector/options',
    settingsAccess(INSPECTOR_SETTINGS, 'inspect'),
    describeRoute({
      tags,
      summary: 'List what the permission inspector can check',
      operationId: 'authorizationListInspectorOptions',
      description:
        'The workspace catalogue the inspector picks resources and actions from. Requires `settings:authorization.inspector` `inspect`.',
      responses: {
        200: dataResponse(AuthorizationOptionsSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) => context.json({ data: await authorizationOptions(host) }),
  );
  routes.route(
    '/',
    createSubjectRoutes(
      host,
      '/inspector',
      INSPECTOR_SETTINGS,
      'inspect',
      'Inspector',
    ),
  );
  routes.post(
    '/inspector/decide',
    settingsAccess(INSPECTOR_SETTINGS, 'inspect'),
    describeRoute({
      tags,
      summary: 'Decide one action for a subject',
      operationId: 'authorizationDecideAccess',
      description:
        'The decision the application would reach if `subject` asked to perform `action` on `resource`, with the subjects the request middleware would add for it. Nothing is performed. Requires `settings:authorization.inspector` `inspect`.',
      responses: {
        200: dataResponse(AuthorizationDecisionSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', DecideBody),
    async (context) => {
      const input = context.req.valid('json');
      const inspected = await contextFor(input.subject);
      return context.json({
        data: await decide(inspected, input.resource, input.action),
      });
    },
  );
  routes.post(
    '/inspector/batchDecide',
    settingsAccess(INSPECTOR_SETTINGS, 'inspect'),
    describeRoute({
      tags,
      summary: 'Decide up to 100 actions for a subject',
      operationId: 'authorizationBatchDecideAccess',
      description:
        'One decision per check, in the order of `checks`. Requires `settings:authorization.inspector` `inspect`.',
      responses: {
        200: dataResponse(z.array(BatchDecisionSchema)),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', BatchDecideBody),
    async (context) => {
      const { subject, checks } = context.req.valid('json');
      const inspected = await contextFor(subject);
      const results = [];
      // Bounded concurrency; the context shares one grant and rule cache.
      for (let offset = 0; offset < checks.length; offset += 4)
        results.push(
          ...(await Promise.all(
            checks.slice(offset, offset + 4).map(async (check) => ({
              resource: check.resource,
              action: check.action,
              decision: await decide(inspected, check.resource, check.action),
            })),
          )),
        );
      return context.json({ data: results });
    },
  );
  // A pure read of what one subject's stored grants cover, so a GET.
  routes.get(
    '/inspector/configuredAccess',
    settingsAccess(INSPECTOR_SETTINGS, 'inspect'),
    describeRoute({
      tags,
      summary: "Summarize a subject's configured access",
      operationId: 'authorizationGetConfiguredAccess',
      description:
        'What the stored grants of the Permission Sets a subject holds cover, and which assignment brings each set. Requires `settings:authorization.inspector` `inspect`.',
      responses: {
        200: dataResponse(ConfiguredAccessSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ConfiguredAccessQuery),
    async (context) => {
      const query = context.req.valid('query');
      const subject: AuthorizationSubject = {
        type: query.subjectType,
        id: query.subjectId,
      };
      const subjects = await subjectsOf(subject);
      const [sets, assignments] = await Promise.all([
        permissionSets.getEffective({ principal: subject, subjects }),
        permissionSets.listAssignments(),
      ]);
      const holders = [subject, ...subjects];
      const resources = [
        ...new Map(
          sets.flatMap((set) =>
            set.grants
              .filter((grant) => grant.actions.length > 0)
              .map(
                (grant) =>
                  [JSON.stringify(grant.resource), grant.resource] as const,
              ),
          ),
        ).values(),
      ];
      return context.json({
        data: {
          unrestricted: sets.some(
            (set) => permissionSets.protection(set.key)?.unrestricted === true,
          ),
          types: [...new Set(resources.map((resource) => resource.type))],
          resources,
          identity: {
            subjects: subjects.map(({ type, id }) => ({ type, id })),
          },
          // Which assignment of the principal or its subjects brings each set.
          sets: sets.map((set) => ({
            key: set.key,
            ...(set.title === undefined ? {} : { title: set.title }),
            sources: assignments
              .filter(
                (assignment) =>
                  assignment.permissionSet === set.key &&
                  holders.some(
                    (holder) =>
                      holder.type === assignment.subject.type &&
                      holder.id === assignment.subject.id,
                  ),
              )
              .map(({ subject: { type, id } }) => ({ type, id })),
          })),
        },
      });
    },
  );
  return createRouteHandler(routes);
}

async function decide(
  context: AuthorizationContext,
  resource: ResourceRef,
  action: string,
): Promise<InspectedDecision> {
  const decision = await context.authorize({ resource, action });
  if (resource.type !== 'composite') return decision;
  const checks: unknown = decision.conditions?.checks;
  return { ...decision, checks: Array.isArray(checks) ? checks : [] };
}
