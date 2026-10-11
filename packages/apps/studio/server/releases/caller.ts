/**
 * The release actions a CLI identity holds, for the command gate (`../agents/bind.ts`): a command naming one of them
 * (`x-cli` `action`) is offered only to a caller who holds it. The routes themselves build their caller from the
 * request (`Releases.callerOf`), and refuse what it may not do whatever the manifest offered.
 *
 * A person acts with their own release permissions, kept to the scope of the API key they call with; a scoped key (or an
 * organization's API key) acts as a `key`; a run as an agent within its configured actions.
 */
import type { CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';
import {
  BUSINESS_KEYS,
  noPermissions,
  type BusinessKey,
  type ReleasesPermissions,
  type Scope,
} from '@nocobase/app-plugin-releases/shared/access';
import {
  narrowedByScope,
  type Caller,
} from '@nocobase/app-plugin-releases/server';

import { grantableToAgents } from '../access/action-policy.js';

export const ENVIRONMENTS_READ_ACTION = 'rel.environments/read';
export const ENVIRONMENTS_MANAGE_ACTION = 'rel.environments/manage';

export interface ReleaseCallerDeps {
  /** A person's release permissions, from their roles. */
  readonly permissionsOfUser: (userId: string) => Promise<ReleasesPermissions>;
}

/** The caller a CLI identity acts as: the person, or for a run an agent within its configured actions. */
export async function callerOfIdentity(
  deps: ReleaseCallerDeps,
  identity: CallerIdentity,
): Promise<Caller> {
  const owner = await deps.permissionsOfUser(identity.userId);
  if (identity.kind === 'user' && identity.keyScope)
    return {
      userId: identity.userId,
      kind: 'key',
      permissions: narrowedByScope(owner, identity.keyScope),
      keyScope: identity.keyScope,
    };
  if (identity.kind === 'user')
    return { userId: identity.userId, kind: 'human', permissions: owner };
  const granted = new Set(
    (identity.agent?.actions ?? []).filter(grantableToAgents),
  );
  const none = noPermissions();
  return {
    userId: identity.userId,
    kind: 'agent',
    permissions: {
      scopes: Object.fromEntries(
        BUSINESS_KEYS.map(({ key }) => [
          key,
          granted.has(key) ? owner.scopes[key] : 'none',
        ]),
      ) as Record<BusinessKey, Scope>,
      // Seeing the environments is harmless and tells a run where it may deploy.
      settings: {
        ...none.settings,
        'rel.environments/read': owner.settings['rel.environments/read'],
      },
      pages: none.pages,
    },
  };
}

/** The release actions an identity may run commands for, for the command gate. */
export async function releaseActionsOf(
  deps: ReleaseCallerDeps,
  identity: CallerIdentity,
): Promise<Set<string>> {
  const caller = await callerOfIdentity(deps, identity);
  const allowed = new Set<string>(
    Object.entries(caller.permissions.scopes)
      .filter(([, scope]) => scope !== 'none')
      .map(([key]) => key),
  );
  if (caller.permissions.settings['rel.environments/read'])
    allowed.add(ENVIRONMENTS_READ_ACTION);
  if (caller.permissions.settings['rel.environments/manage'])
    allowed.add(ENVIRONMENTS_MANAGE_ACTION);
  return allowed;
}
