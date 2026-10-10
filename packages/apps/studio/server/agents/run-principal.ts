/**
 * An agent's run as a caller of Studio's API. The run's token authenticates as the person who woke the agent
 * (`@nocobase/app-plugin-agents`' run credential); Studio then bounds it the way its commands always were:
 *
 * - its scope (`runKeyScope`): the business actions the command gate allows the run (`commands/permissions.ts`: the
 *   person's, kept to what the agent is configured with, at most the actions agents may be given
 *   (`../access/action-policy.ts`) and Studio's own (`capabilities.ts`); reading only for a run on an intake request),
 *   so every route that honours a key's
 *   scope honours the run's, and nothing else;
 * - who acts (`runActor`): the agent itself for a run on an issue; for a run on a conversation, the person who asked,
 *   via the agent (`conversation/acting.ts`);
 * - what a conversation run writes (`delegatedWrites`): a direct write for the asker within the quota
 *   (`conversation/quota.ts`), made as an undoable plan of theirs, or 409 `PLAN_REQUIRED`.
 *
 * Routes accept a run only where their security lists `runToken`; elsewhere the application refuses it. Such a route
 * names the business action it performs (`cliRoute({ action })`), and a run that does not hold it is refused 403
 * `RUN_ACTION_FORBIDDEN` before the route runs (`runScopeStep`).
 */
import { ApiError, declaredRouteActionOf } from '@nocobase/app-server/router';
import type { AuthSession } from '@nocobase/app-plugin-authentication';
import type {
  Actor,
  DelegatedWrites,
  PlanSourceOf,
  RequestActor,
} from '@nocobase/app-plugin-projects/server/tokens';
import type {
  Plan,
  PlanObjectRef,
} from '@nocobase/app-plugin-projects/shared/plans';
import type {
  AuthorizationMiddleware,
  KeyScope,
  ResourceRef,
} from '@nocobase/authorization/core';
import type { Context } from 'hono';

import {
  runIdentityOf,
  type Agents,
  type CallerIdentity,
} from '@nocobase/app-plugin-agents/server/tokens';

import { LEVELS } from '../../shared/access.js';
import { BUSINESS_TYPES, businessResource } from '../access/catalog.js';
import { toStudioApiError } from '../http/errors.js';
import { INTAKE_SOURCE } from './catalog/sources.js';
import type { ReaderGrantsOf } from './commands/permissions.js';
import {
  askerActor,
  type Asker,
  type AskerLookup,
} from './conversation/acting.js';
import type { DirectWrites } from './conversation/quota.js';
import { AGENT_KIND } from './tx.js';

function label(ref: PlanObjectRef | null | undefined): string | null {
  if (!ref) return null;
  return ref.identifier ?? ref.title ?? ref.id;
}

/** What the first row of a direct write created or changed, named (`PM-12`). */
export function changedLabel(plan: Plan): string {
  const result = plan.rows[0]?.result;
  return label(result?.created) ?? label(result?.target) ?? 'it';
}

/** Who may read the Reports page and every run (`ReaderGrants`), for the person a run acts for. */
export interface RunReaderGrants {
  readonly allRuns: boolean;
}

/** The business action that opens the Reports page to a run. */
const REPORTS_ACTION = 'studio.reports/read';

/** The levels a business action may be granted at, as its actions' suffixes (`edit.related`). */
const LEVEL_SUFFIXES = LEVELS.filter((level) => level !== 'none').map(
  (level) => `.${level}`,
);

/** `edit.related` → `edit`; an action without a level is itself. */
const baseAction = (action: string): string => {
  const suffix = LEVEL_SUFFIXES.find((entry) => action.endsWith(entry));
  return suffix ? action.slice(0, -suffix.length) : action;
};

/**
 * A run's scope: the business actions `allowed` (`pm.issues/comment`, `rel.apps/deploy`) on their plugins' resource
 * types at every level (`comment.related`, `comment.all`: the run reaches as far as its person does), the settings
 * capabilities allowed (`rel.environments/read`), the Reports page when it may read reports, and every run's figures
 * there when the person may read them. Nothing else.
 */
export function runKeyScope(
  runId: string,
  allowed: ReadonlySet<string>,
  grants: RunReaderGrants = { allRuns: false },
): KeyScope {
  const reports = allowed.has(REPORTS_ACTION);
  const allows = (resource: ResourceRef, action: string): boolean => {
    if (resource.type === 'settings') {
      if (resource.id === 'agents.agents' && action === 'read')
        return reports && grants.allRuns;
      return allowed.has(`${resource.id}/${action}`);
    }
    if (BUSINESS_TYPES.includes(resource.type))
      return allowed.has(`${resource.id}/${baseAction(action)}`);
    return (
      resource.type === 'page' &&
      resource.id === 'reports' &&
      action === 'access' &&
      reports
    );
  };
  const permissions = new Map<string, Set<string>>();
  for (const key of allowed) {
    const at = key.lastIndexOf('/');
    if (at <= 0) continue;
    const business = key.slice(0, at);
    if (!BUSINESS_TYPES.includes(businessResource(business).type)) continue;
    const action = key.slice(at + 1);
    const actions = permissions.get(business) ?? new Set<string>();
    for (const name of [action, ...LEVEL_SUFFIXES.map((s) => action + s)])
      actions.add(name);
    permissions.set(business, actions);
  }
  return {
    keyId: `run:${runId}`,
    allows,
    objects: () => 'all',
    permissions: [...permissions].map(([business, actions]) => ({
      resource: businessResource(business),
      actions: [...actions],
    })),
  };
}

/** Whether a request's scope is a run's (`runKeyScope`). */
export function isRunScope(scope: KeyScope | undefined): boolean {
  return scope?.keyId.startsWith('run:') ?? false;
}

/** The run a request authenticated as, if any. */
export function runOfRequest(
  context: Pick<Context, 'get'>,
): CallerIdentity | undefined {
  return runIdentityOf(context.get('auth' as never) as AuthSession | undefined);
}

/**
 * Who made a request, as the caller identity Studio's permissions read (`commands/permissions.ts`): the run its token
 * authenticated, or the signed-in person with the scope of the API key they called with. Undefined before
 * authentication; read it after `auth.required()` and `authorization.middleware()`.
 */
export function callerOfRequest(
  context: Pick<Context, 'get'>,
): CallerIdentity | undefined {
  const run = runOfRequest(context);
  if (run) return run;
  const auth = context.get('auth' as never) as AuthSession | undefined;
  if (!auth) return undefined;
  const keyScope = (
    context.get('authz' as never) as
      { readonly identity?: { readonly keyScope?: KeyScope } } | undefined
  )?.identity?.keyScope;
  return {
    kind: 'user',
    userId: auth.user.id,
    displayName: auth.user.name || auth.user.email,
    ...(keyScope ? { keyScope } : {}),
  };
}

/**
 * The subject a run works on when it is of `kind` (`issue`, `conversation`, `intake`): the default of a route's
 * subject parameter when a run leaves it out. Undefined for a person, or a run on something else.
 */
export function runSubjectOf(
  identity: CallerIdentity | undefined,
  kind: string,
): string | undefined {
  const run = identity?.kind === 'run' ? identity.run?.run : undefined;
  return run?.subjectKind === kind ? run.subjectId : undefined;
}

/**
 * The authorization step that gives a request a run made its scope: what the command gate allows the run, and every
 * run's figures on the Reports page when the person may read them.
 */
export function runScopeStep(
  agents: { readonly gate: Pick<Agents['gate'], 'allowed' | 'reach'> },
  grantsOf: ReaderGrantsOf,
): AuthorizationMiddleware {
  return async (request, next) => {
    const identity = runOfRequest(request.http);
    if (identity?.run) {
      const allowed = await agents.gate.allowed(identity);
      // A route that takes a run names the action it performs; the run holds it, or the route never runs.
      const action = declaredRouteActionOf(request.http);
      if (!action || !allowed.has(action))
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          reason: 'RUN_ACTION_FORBIDDEN',
          domain: 'studio',
          message: action
            ? `The agent is not given ${action}, which this needs.`
            : 'This route names no action an agent may be given.',
          ...(action ? { metadata: { action } } : {}),
        });
      // A consulted agent's run reads only, but the plans it proposes reach as far as its agent and person do: the
      // person confirms them.
      request.keyScope = runKeyScope(
        identity.run.run.id,
        await agents.gate.reach(identity),
        { allRuns: (await grantsOf(identity)).allRuns },
      );
    }
    await next();
  };
}

export interface RunPrincipal {
  /** Who acts in a request a run made (`projectsRequestActorToken`). */
  readonly actor: RequestActor;
  /**
   * Where a run's operation plans come from (`projectsPlanSourceToken`): its conversation, `intake` when started from
   * the AI draft tab; none for a run on anything else.
   */
  readonly planSource: PlanSourceOf;
  /** A conversation run's writes (`projectsDelegatedWritesToken`). */
  readonly writes: DelegatedWrites;
}

export function createRunPrincipal(deps: {
  readonly askerOf: AskerLookup;
  readonly direct: DirectWrites;
  /** False when the plan hooks are not bound: the quota could not be counted, so a conversation may not write. */
  readonly enabled: boolean;
}): RunPrincipal {
  // The asker behind each actor a request was given, for its writes in the same request.
  const askers = new WeakMap<Actor, Asker>();
  return {
    async actor(context) {
      const identity = runOfRequest(context);
      if (!identity?.agent) return undefined;
      const asker = await deps.askerOf(identity);
      if (!asker) return { type: AGENT_KIND, id: identity.agent.id };
      const actor = askerActor(asker);
      askers.set(actor, asker);
      return actor;
    },
    async planSource(context) {
      const identity = runOfRequest(context);
      if (!identity?.agent) return undefined;
      const asker = await deps.askerOf(identity);
      if (!asker) return null;
      return {
        kind:
          asker.conversation.source === INTAKE_SOURCE
            ? 'intake'
            : 'conversation',
        key: `conversation:${asker.conversation.id}`,
        data: { conversationId: asker.conversation.id, runId: asker.runId },
      };
    },
    writes: {
      covers: (viewer) => askers.has(viewer.actor),
      async write(viewer, request) {
        const asker = askers.get(viewer.actor);
        if (!asker)
          throw new Error('Only a conversation run writes for someone else.');
        if (!deps.enabled)
          throw new ApiError({
            status: 'UNIMPLEMENTED',
            reason: 'NOT_IMPLEMENTED',
            domain: 'studio',
            message:
              'Changes from a conversation are not available in this application.',
          });
        try {
          const plan = await deps.direct.write(asker, viewer, request);
          const used = await deps.direct.used(asker.runId);
          return {
            plan,
            meta: {
              directWrite: {
                plan: {
                  id: plan.id,
                  status: plan.status,
                  undoableUntil: plan.undoableUntil,
                },
                rows: plan.rows.map((row) => ({
                  op: row.op,
                  target: row.result?.target ?? null,
                  created: row.result?.created ?? null,
                  revision: row.result?.revision ?? null,
                })),
                quota: { used },
              },
              message: `${changedLabel(plan)} changed directly (undoable; ${used} object${used === 1 ? '' : 's'} changed directly this turn).`,
            },
          };
        } catch (error) {
          throw toStudioApiError(error);
        }
      },
    },
  };
}
