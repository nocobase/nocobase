/**
 * Who may run Studio's CLI commands, and as whom. Each command names the business action it performs; what an
 * identity may do (`gate`, and the `Viewer` a command runs as) is the permissions of its person
 * (`ProjectsAccess.permissionsOfUser`), kept to the scope of the API key the person called with (`keyScope`), and for a
 * run only the actions its agent is configured with (at most those grantable to agents, `../../access/action-policy.ts`). A run on an issue acts as the agent; a run on a conversation acts as the person who asked, via the
 * agent (`conversation/acting.ts`). A run on an intake request only proposes drafts (`../intake/`): it keeps nothing
 * but reading, and no action another plugin adds.
 */
import { ProtocolError, type ErrorCode } from '@nocobase/agent-protocol';
import { PLANS_USE_ACTION } from '@nocobase/app-plugin-projects/server/tokens';
import {
  DomainError,
  type ProjectsAccess,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  BUSINESS_KEYS,
  noAbilities,
  noSettings,
  type BusinessKey,
  type Permissions,
  type Scope,
} from '@nocobase/app-plugin-projects/shared/access';

import type {
  ActionGate,
  CallerIdentity,
} from '@nocobase/app-plugin-agents/server/tokens';
import { grantableToAgents } from '../../access/action-policy.js';
import { narrowedProjectPermissions } from '../../access/key-scope.js';
import { CALLER_ACTIONS, DERIVED_ACTIONS } from '../capabilities.js';
import { askerActor, type AskerLookup } from '../conversation/acting.js';
import { INTAKE_SUBJECT } from '../intake/subject.js';
import { AGENT_KIND } from '../tx.js';

/**
 * What only a run on an intake request holds: handing its drafts back (`intake drafts`). No person and no other run
 * holds it, so the command is offered to nobody else.
 */
export const INTAKE_PROPOSE_ACTION = 'studio.intake/propose';

/** A run on an intake request: it may read, and propose drafts with `intake drafts`, nothing else. */
export function isIntakeRun(identity: CallerIdentity): boolean {
  return (
    identity.kind === 'run' && identity.run?.run.subjectKind === INTAKE_SUBJECT
  );
}

const KIND_ERRORS: Readonly<Record<DomainError['kind'], ErrorCode>> = {
  invalid: 'INVALID_REQUEST',
  unauthorized: 'UNAUTHORIZED',
  forbidden: 'FORBIDDEN',
  notFound: 'NOT_FOUND',
  conflict: 'CONFLICT',
};

/**
 * The projects plugin's errors in the protocol's error body; its own code stays in `details.code`, and the error itself
 * in `cause`, so an HTTP route answers it in its own domain.
 */
export function translated(error: unknown): unknown {
  if (!(error instanceof DomainError)) return error;
  const protocol = new ProtocolError(KIND_ERRORS[error.kind], error.message, {
    code: error.code,
    ...(error.details ?? {}),
  });
  protocol.cause = error;
  return protocol;
}

export interface PermissionSource {
  /** What `identity` may do in projects, already narrowed for a run. */
  permissionsOf(identity: CallerIdentity): Promise<Permissions>;
  viewerOf(identity: CallerIdentity): Promise<Viewer>;
}

export function createPermissionSource(
  access: () => Pick<ProjectsAccess, 'permissionsOfUser'> | undefined,
  askerOf: AskerLookup = () => Promise.resolve(null),
): PermissionSource {
  async function permissionsOf(identity: CallerIdentity): Promise<Permissions> {
    const of = access()?.permissionsOfUser;
    if (!of) return { scopes: noAbilities(), settings: noSettings() };
    const owner = await of(identity.userId);
    // A person on the CLI with a scoped API key (or an organization's API key) holds no more than the key's scope.
    const base = identity.keyScope
      ? narrowedProjectPermissions(owner, identity.keyScope)
      : owner;
    if (identity.kind === 'user') return base;
    const intake = isIntakeRun(identity);
    const granted = new Set(
      (identity.agent?.actions ?? []).filter(
        (key) => grantableToAgents(key) && (!intake || key.endsWith('/view')),
      ),
    );
    const scopes = Object.fromEntries(
      BUSINESS_KEYS.map(({ key }) => [
        key,
        granted.has(key) ? base.scopes[key] : 'none',
      ]),
    ) as Record<BusinessKey, Scope>;
    return { scopes, settings: noSettings() };
  }
  return {
    permissionsOf,
    async viewerOf(identity) {
      const asker = await askerOf(identity);
      return {
        userId: identity.userId,
        actor: asker
          ? askerActor(asker)
          : identity.kind === 'run' && identity.agent
            ? { type: AGENT_KIND, id: identity.agent.id }
            : { type: 'user', id: identity.userId, via: 'cli' },
        permissions: await permissionsOf(identity),
      };
    },
  };
}

/**
 * What a caller may read beyond the projects plugin's actions, from Studio's roles: the Reports page (`reports`), and
 * every agent run rather than only their own (`agents.agents` read). For a run, the person who woke the agent's.
 */
export interface ReaderGrants {
  readonly reports: boolean;
  readonly allRuns: boolean;
}

export type ReaderGrantsOf = (
  identity: CallerIdentity,
) => Promise<ReaderGrants>;

/** Without Studio's roles: nothing beyond one's own runs. */
export const NO_READER_GRANTS: ReaderGrantsOf = () =>
  Promise.resolve({ reports: false, allRuns: false });

/** More actions an identity holds, from another plugin Studio assembles (release management). */
export type ActionSource = (
  identity: CallerIdentity,
) => Promise<ReadonlySet<string>>;

export function createActionGate(
  source: PermissionSource,
  more: readonly ActionSource[] = [],
): ActionGate {
  return {
    // A consulted agent only reads, and proposes plans the person confirms in their conversation.
    consultable: (action) => action === PLANS_USE_ACTION,
    async allowed(identity) {
      const { scopes } = await source.permissionsOf(identity);
      const allowed = new Set(
        Object.entries(scopes)
          .filter(([, scope]) => scope !== 'none')
          .map(([key]) => key),
      );
      if (isIntakeRun(identity)) {
        allowed.add(INTAKE_PROPOSE_ACTION);
        return allowed;
      }
      for (const extra of more)
        for (const key of await extra(identity)) allowed.add(key);
      for (const key of CALLER_ACTIONS) allowed.add(key);
      // A derived action stands on a base action the caller holds; a run also needs its agent configured with it.
      const configured = new Set(identity.agent?.actions ?? []);
      for (const [derived, base] of Object.entries(DERIVED_ACTIONS)) {
        if (!allowed.has(base)) continue;
        if (identity.kind === 'run' && !configured.has(derived)) continue;
        allowed.add(derived);
      }
      return allowed;
    },
  };
}
