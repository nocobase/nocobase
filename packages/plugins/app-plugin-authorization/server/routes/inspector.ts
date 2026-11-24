import { auditRoute } from '@nocobase/app-server/audit';
import type {
  Authorization,
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationRouteHandler,
  AuthorizationSubject,
  ResourceRef,
} from '@nocobase/authorization/core';
import { dataScopeTarget } from '@nocobase/authorization/core';
import type { PermissionSetsApi } from '@nocobase/authorization/permission-sets';
import {
  ApiError,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import { z } from 'zod';
import {
  AUTHORIZATION_ERROR_DOMAIN,
  createRouteHandler,
  createSettingsRouter,
  unrestrictedAccess,
} from '../extension/http.js';
import { databaseHost } from '../database/api.js';
import type { InspectorApi } from '../inspector-identities.js';
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
  InspectRecordsBody,
  DecideBody,
} from './schemas.js';

/** A decision, with the underlying checks of a composite action. */
export type InspectedDecision = AuthorizationDecision & {
  readonly checks?: readonly unknown[];
};

/**
 * Every `/inspector` route, open to unrestricted roles only. The inspector shows what any subject may do, so it is no
 * permission a role can be given and no settings item.
 */
const inspectorAccess = unrestrictedAccess(
  'Only an unrestricted role can use the permission inspector.',
);

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
  const inspector = (host as { readonly inspector?: InspectorApi }).inspector;
  // A kind of subject another plugin adds, such as an API key: its holder's identity with the credential's scope.
  const resolved = async (subject: AuthorizationSubject) => {
    const resolve = inspector?.identities.get(subject.type);
    if (!resolve) return undefined;
    const found = await resolve(subject.id);
    if (!found)
      throw new ApiError({
        status: 'NOT_FOUND',
        reason: 'INSPECTOR_SUBJECT_NOT_FOUND',
        domain: AUTHORIZATION_ERROR_DOMAIN,
        message: `No ${subject.type} ${subject.id} to inspect.`,
      });
    return found;
  };
  // A credential that cannot be used now is decided as denying everything, with the reason.
  const blocked = (
    found: Awaited<ReturnType<typeof resolved>>,
  ): AuthorizationDecision | undefined => {
    const state = found?.credential?.state;
    if (!state || state === 'active') return undefined;
    return {
      effect: 'deny',
      reasons: [
        state === 'disabled'
          ? { code: 'KEY_DISABLED', message: 'The key is disabled.' }
          : { code: 'KEY_EXPIRED', message: 'The key has expired.' },
      ],
    };
  };
  const contextFor = async (
    subject: AuthorizationSubject,
  ): Promise<AuthorizationContext> => {
    const found = await resolved(subject);
    if (found) {
      const denial = blocked(found);
      const inspected = host.for(found.identity);
      if (!denial) return inspected;
      return {
        ...inspected,
        authorize: () => Promise.resolve(denial),
      } as unknown as AuthorizationContext;
    }
    return host.for({
      principal: subject,
      subjects: await subjectsOf(subject),
    });
  };

  routes.get(
    '/inspector/options',
    inspectorAccess,
    describeRoute({
      tags,
      summary: 'List what the permission inspector can check',
      operationId: 'authorizationListInspectorOptions',
      description:
        'The workspace catalogue the inspector picks resources and actions from. Requires an unrestricted role.',
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
      { guard: inspectorAccess, requirement: 'an unrestricted role' },
      undefined,
      'Inspector',
    ),
  );
  routes.post(
    '/inspector/decide',
    auditRoute(false),
    inspectorAccess,
    describeRoute({
      tags,
      summary: 'Decide one action for a subject',
      operationId: 'authorizationDecideAccess',
      description:
        'The decision the application would reach if `subject` asked to perform `action` on `resource`, with the subjects the request middleware would add for it. Nothing is performed. Requires an unrestricted role.',
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
    auditRoute(false),
    inspectorAccess,
    describeRoute({
      tags,
      summary: 'Decide up to 100 actions for a subject',
      operationId: 'authorizationBatchDecideAccess',
      description:
        'One decision per check, in the order of `checks`. Requires an unrestricted role.',
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
  routes.post(
    '/inspector/records',
    auditRoute(false),
    inspectorAccess,
    describeRoute({
      tags,
      summary: 'Find which records a composite action reaches for a subject',
      operationId: 'authorizationInspectRecords',
      description:
        "Of `ids`, the records of a composite action's data scope the subject reaches as decided now: its grants, a credential's scope and every data rule. For showing which of the records a key keeps it still reaches. At most 100 ids. Requires an unrestricted role.",
      responses: {
        200: dataResponse(
          z.object({
            reached: z.array(z.string()).meta({
              description: 'The ids of `ids` the subject reaches.',
            }),
          }),
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', InspectRecordsBody),
    async (context) => {
      const input = context.req.valid('json');
      const inspected = await contextFor(input.subject);
      return context.json({
        data: {
          reached: await reachedRecords(host, inspected, input),
        },
      });
    },
  );
  // A pure read of what one subject's stored grants cover, so a GET.
  routes.get(
    '/inspector/configuredAccess',
    inspectorAccess,
    describeRoute({
      tags,
      summary: "Summarize a subject's configured access",
      operationId: 'authorizationGetConfiguredAccess',
      description:
        'What the stored grants of the Permission Sets a subject holds cover, and which assignment brings each set. Requires an unrestricted role.',
      responses: {
        200: dataResponse(ConfiguredAccessSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ConfiguredAccessQuery),
    async (context) => {
      const query = context.req.valid('query');
      const asked: AuthorizationSubject = {
        type: query.subjectType,
        id: query.subjectId,
      };
      // A key's roles are those of the identity it acts as.
      const found = await resolved(asked);
      const subject = found?.holder ?? asked;
      const keyScope = found?.identity.keyScope;
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
          // What a credential adds on top of the roles: its state, what it covers and the records it keeps.
          ...(found && keyScope
            ? {
                credential: {
                  keyId: keyScope.keyId,
                  holder: { type: subject.type, id: subject.id },
                  state: found.credential?.state ?? 'active',
                  expiresAt: found.credential?.expiresAt ?? null,
                  personless: keyScope.personless === true,
                  permissions:
                    keyScope.permissions?.map(({ resource, actions }) => ({
                      resource,
                      actions: actions.map((action) => {
                        const policy = keyScope.policy?.(resource, action);
                        return policy ? { action, policy } : { action };
                      }),
                    })) ?? null,
                  objects: found.credential?.objects ?? {},
                },
              }
            : {}),
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

/**
 * Of `ids`, the records of a composite action's data scope `context` reaches: read through the repository policy its
 * decision composes for the scope's collection, as a composite repository reads them. None when it reaches no record or
 * the scope is not a collection's.
 */
async function reachedRecords(
  host: Pick<AuthorizationExtensionHost, 'compositeResources' | 'database'>,
  context: AuthorizationContext,
  input: {
    readonly resource: { readonly type: string; readonly id: string };
    readonly action: string;
    readonly scope: string;
    readonly ids: readonly string[];
  },
): Promise<string[]> {
  const declared = host.compositeResources.getAction(
    input.resource.id,
    input.action,
  );
  const connection = databaseHost(host.database)?.connection;
  if (!declared || !input.ids.length || !connection) return [];
  let target: { type: string; id: string };
  try {
    target = dataScopeTarget(declared, input.scope);
  } catch {
    return [];
  }
  if (target.type !== 'database.collection') return [];
  const decision = await context.authorize({
    resource: { type: 'composite', id: input.resource.id },
    action: input.action,
  });
  const policies: unknown =
    decision.conditions && typeof decision.conditions === 'object'
      ? Reflect.get(decision.conditions, 'database')
      : undefined;
  const policy: unknown =
    policies && typeof policies === 'object'
      ? Reflect.get(policies, target.id)
      : undefined;
  if (decision.effect === 'deny' || !policy || typeof policy !== 'object')
    return [];
  try {
    const rows = await (
      connection as unknown as {
        repository(name: string): {
          withPolicy(policy: unknown): {
            findMany(
              input: unknown,
            ): Promise<readonly Record<string, unknown>[]>;
          };
        };
      }
    )
      .repository(target.id)
      .withPolicy(policy)
      .findMany({
        select: (select: { fields(...names: string[]): unknown }) =>
          select.fields('id'),
        filter: (f: {
          or(nodes: readonly unknown[]): unknown;
          string(field: string): { eq(value: string): unknown };
        }) => f.or(input.ids.map((id) => f.string('id').eq(id))),
        limit: input.ids.length,
      });
    return rows.map((row) => String(row.id));
  } catch (error) {
    // A policy that lets no record or not even its id be read reaches none; any other failure is an error to show.
    const code: unknown =
      error && typeof error === 'object'
        ? Reflect.get(error, 'code')
        : undefined;
    if (code === 'READ_FORBIDDEN' || code === 'FIELD_READ_FORBIDDEN') return [];
    throw error;
  }
}
