/**
 * Who calls the plugin's services and what they may do. Every service method takes a `Caller`; the HTTP API builds
 * one per request from the application's `ReleasesAccess` (a session, or an API key) or an upload ticket, and an
 * application calling in process builds its own (`callerFor`). The checks live here and in the services, never only in
 * routes, so in-process callers meet the same rules.
 *
 * A request made with a scoped credential (an API key with a scope, a service account's key) carries the credential's
 * `KeyScope`: the caller is a `key`, its permissions are cut down to what the scope covers (`narrowedByScope`, on top
 * of whatever the application already narrowed), and the Apps it reaches to the ones the scope picked
 * (`keyScope.objects('rel.apps')`).
 */
import type { KeyScope } from '@nocobase/authorization/core';

import {
  BUSINESS_KEYS,
  HUMAN_ONLY_ACTIONS,
  PAGES,
  SETTINGS_KEYS,
  allPermissions,
  businessKey,
  businessResource,
  levelActionsOf,
  noPermissions,
  reaches,
  settingsKey,
  type AppAction,
  type BusinessKey,
  type Page,
  type ReleasesPermissions,
  type Scope,
  type SettingsAction,
  type SettingsItem,
  type SettingsKey,
} from '../../shared/access.js';
import type { ActorKind } from '../../shared/releases.js';
import { forbidden } from '../errors.js';
import type { ActorRef, ReleasesAccess } from '../tokens.js';

export interface Caller {
  /** The person or service account the operation is recorded for; null for the plugin's own work. */
  readonly userId: string | null;
  readonly kind: ActorKind;
  readonly permissions: ReleasesPermissions;
  /** The scope of the credential the request arrived with; set for a scoped API key or a service account's key. */
  readonly keyScope?: KeyScope;
}

/** The App business, as `KeyScope.objects` names it. */
export const APPS_BUSINESS = 'rel.apps';

/**
 * Permissions cut down to a credential's scope, each as the authorization plugin names it: pages (`page:<id>/access`),
 * settings items (`settings:<item>/<action>`) and business actions (`rel:rel.apps/deploy.related`). A business action
 * the scope covers at no level is off; one it covers keeps the caller's own reach.
 */
export function narrowedByScope(
  permissions: ReleasesPermissions,
  scope: KeyScope,
): ReleasesPermissions {
  const scopes = { ...permissions.scopes } as Record<BusinessKey, Scope>;
  for (const { business, key } of BUSINESS_KEYS)
    if (
      !levelActionsOf(key).some(({ name }) =>
        scope.allows(businessResource(business), name),
      )
    )
      scopes[key] = 'none';
  const settings = { ...permissions.settings } as Record<SettingsKey, boolean>;
  for (const { item, action, key } of SETTINGS_KEYS)
    if (!scope.allows({ type: 'settings', id: item }, action))
      settings[key] = false;
  const pages = { ...permissions.pages } as Record<Page, boolean>;
  for (const page of PAGES)
    if (!scope.allows({ type: 'page', id: page }, 'access'))
      pages[page] = false;
  return { scopes, settings, pages };
}

/** The Apps a scoped caller is limited to; undefined when it reaches every App. */
function pickedApps(caller: Caller): readonly string[] | undefined {
  const objects = caller.keyScope?.objects(APPS_BUSINESS);
  return objects === undefined || objects === 'all' ? undefined : objects;
}

/** The plugin acting on its own, for expiry cleanup and startup recovery. */
export const SYSTEM_CALLER: Caller = {
  userId: null,
  kind: 'system',
  permissions: allPermissions(),
};

export function actorOf(caller: Caller): ActorRef {
  return { userId: caller.userId, kind: caller.kind };
}

/** What an App looks like to a check: its ID and who created it. */
export interface AppOwnership {
  readonly id: string;
  readonly createdBy: string | null;
}

export class AccessGuard {
  public constructor(
    private readonly access: () => ReleasesAccess | undefined,
  ) {}

  /** Builds the caller for a user ID: the application's permissions for them. */
  public async callerForUser(
    userId: string,
    kind: ActorKind = 'human',
  ): Promise<Caller> {
    const access = this.access();
    return {
      userId,
      kind,
      permissions: access
        ? await access.permissionsOfUser(userId)
        : noPermissions(),
    };
  }

  public scope(caller: Caller, action: AppAction): Scope {
    if (caller.kind === 'system') return 'all';
    if (
      (caller.kind === 'agent' || caller.kind === 'key') &&
      HUMAN_ONLY_ACTIONS.includes(action)
    )
      return 'none';
    // An action the application left out reaches nothing.
    return caller.permissions.scopes[businessKey('rel.apps', action)] ?? 'none';
  }

  public async canApp(
    caller: Caller,
    action: AppAction,
    app: AppOwnership,
  ): Promise<boolean> {
    const picked = pickedApps(caller);
    if (picked && !picked.includes(app.id)) return false;
    const scope = this.scope(caller, action);
    if (scope === 'all' || scope === 'none') return scope === 'all';
    if (reaches(scope, app.createdBy)) return true;
    if (scope.users.length === 0) return false;
    return (
      (await this.access()?.isRelated?.(app.id, scope.users, action)) ?? false
    );
  }

  public async requireApp(
    caller: Caller,
    action: AppAction,
    app: AppOwnership,
  ): Promise<void> {
    if (await this.canApp(caller, action, app)) return;
    if (
      (caller.kind === 'agent' || caller.kind === 'key') &&
      HUMAN_ONLY_ACTIONS.includes(action)
    )
      throw forbidden(
        `${caller.kind === 'agent' ? 'An agent' : 'A key'} may not ${action} an application.`,
        'HUMAN_REQUIRED',
      );
    throw forbidden();
  }

  /**
   * Refuses a caller who may take none of `actions` on any App. Routes check this before reading their input; the
   * services check the App itself afterwards.
   */
  public requireAnyApp(caller: Caller, ...actions: AppAction[]): void {
    if (actions.some((action) => this.scope(caller, action) !== 'none')) return;
    if (
      (caller.kind === 'agent' || caller.kind === 'key') &&
      actions.every((action) => HUMAN_ONLY_ACTIONS.includes(action))
    )
      throw forbidden(
        `${caller.kind === 'agent' ? 'An agent' : 'A key'} may not ${actions[0]} an application.`,
        'HUMAN_REQUIRED',
      );
    throw forbidden();
  }

  /** `create` has no records: it is either allowed or not, and never for a key limited to some Apps. */
  public requireCreate(caller: Caller): void {
    if (this.scope(caller, 'create') !== 'all' || pickedApps(caller))
      throw forbidden();
  }

  /**
   * The Apps a caller may see for an action: every App, or the ones the users of their scope created plus the
   * application's related ones; null when they may see none.
   */
  public async appFilter(
    caller: Caller,
    action: AppAction,
  ): Promise<
    | { readonly all: true; readonly only?: readonly string[] }
    | {
        readonly all: false;
        readonly createdBy: readonly string[];
        readonly ids: readonly string[];
        /** A scoped caller's Apps: nothing outside them, whatever else matches. */
        readonly only?: readonly string[];
      }
    | null
  > {
    const scope = this.scope(caller, action);
    const picked = pickedApps(caller);
    const only = picked ? { only: picked } : {};
    if (scope === 'all') return { all: true, ...only };
    if (scope === 'none' || scope.users.length === 0) return null;
    return {
      all: false,
      createdBy: scope.users,
      ids: (await this.access()?.relatedAppIds?.(scope.users, action)) ?? [],
      ...only,
    };
  }

  public hasSetting<S extends SettingsItem>(
    caller: Caller,
    item: S,
    action: SettingsAction<S>,
  ): boolean {
    if (caller.kind === 'system') return true;
    // An upload ticket holds no settings; a scoped key holds what its scope left of its owner's.
    return caller.permissions.settings[settingsKey(item, action)];
  }

  public requireSetting<S extends SettingsItem>(
    caller: Caller,
    item: S,
    action: SettingsAction<S>,
  ): void {
    if (!this.hasSetting(caller, item, action)) throw forbidden();
  }

  public hasPage(caller: Caller, page: Page): boolean {
    if (caller.kind === 'system') return true;
    return caller.permissions.pages[page];
  }

  public requirePage(caller: Caller, page: Page): void {
    if (!this.hasPage(caller, page)) throw forbidden();
  }
}
