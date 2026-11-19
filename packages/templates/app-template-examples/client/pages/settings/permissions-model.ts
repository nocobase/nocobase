import type {
  AuthorizationOptionsResponse,
  PermissionGrant,
} from '@nocobase/app-plugin-authorization/client';
import type {
  PermissionGrants,
  PermissionMenuNode,
  PermissionObject,
  PermissionSettingsPage,
  PermissionValue,
} from '#components/permission-editor';

export type CatalogResource =
  AuthorizationOptionsResponse['sections'][number]['subsections'][number]['resources'][number];

/** The editor's action id: the stored resource and action, so a draft maps back without a lookup table. */
export const permissionRowId = (
  resource: { type: string; id: string },
  action: string,
): string => JSON.stringify([resource.type, resource.id, action]);

/** "Use default rules": the role adds no records. Stored as an empty scope, which a select cannot hold. */
export const NO_SCOPE = '__none__';
/** A stored scope value the editor does not know, such as a plugin's own policy; saving keeps it unchanged. */
export const PRESERVED_SCOPE = '__preserved__';
export const CUSTOM_FILTER = 'customFilter';

export interface PermissionScopeBinding {
  readonly key: string;
  readonly collection: string;
  readonly fields: readonly string[];
  /** Hidden scopes keep their stored value. */
  readonly visible: boolean;
  /**
   * The editor id of the View action this scope follows: its own object's View, or another object's View for a scope
   * on that object's records. Unset in the draft means that View's stored value.
   */
  readonly follows?: string | undefined;
  readonly defaultValue: string;
}

export interface PermissionBinding {
  readonly resource: { readonly type: string; readonly id: string };
  readonly action: string;
  readonly view: boolean;
  readonly scopes: readonly PermissionScopeBinding[];
}

export interface PermissionWorkspace {
  /** What a role sees in the sidebar. */
  readonly menus: readonly PermissionMenuNode[];
  /** What a role may do, set once per object. */
  readonly objects: readonly PermissionObject[];
  /** System settings pages and their settings objects, set in their own tab; their entries are not menus. */
  readonly settings: readonly PermissionSettingsPage[];
  /** Every editable action by editor id. */
  readonly bindings: ReadonlyMap<string, PermissionBinding>;
  /** The pages each menu's checkbox opens: stored as page access, independently of every object's actions. */
  readonly menuPages: ReadonlyMap<string, readonly string[]>;
}

/** Custom filters by `filterKey(action, scope)`, the part of a scope value a select cannot carry. */
export type PermissionFilters = Readonly<Record<string, unknown>>;

export const filterKey = (actionId: string, scope: string): string =>
  JSON.stringify([actionId, scope]);

function storedAction(
  grants: readonly PermissionGrant[],
  resource: { type: string; id: string },
  action: string,
) {
  return grants
    .find(
      (grant) =>
        grant.resource.type === resource.type &&
        grant.resource.id === resource.id,
    )
    ?.actions.find((entry) => entry.action === action);
}

function storedScopes(
  entry: ReturnType<typeof storedAction>,
): Readonly<Record<string, unknown>> {
  const scopes = entry?.policy?.scopes;
  return scopes && typeof scopes === 'object'
    ? (scopes as Record<string, unknown>)
    : {};
}

/** The select value of a stored scope. */
export function scopeSelection(value: unknown): string {
  if (value == null || value === '') return NO_SCOPE;
  if (typeof value === 'string') return value;
  if (
    typeof value === 'object' &&
    Reflect.get(value, 'type') === 'recordAccess' &&
    typeof Reflect.get(value, 'key') === 'string'
  )
    return String(Reflect.get(value, 'key'));
  return PRESERVED_SCOPE;
}

const filterOf = (value: unknown): unknown => {
  const params: unknown =
    value && typeof value === 'object'
      ? Reflect.get(value, 'params')
      : undefined;
  return params && typeof params === 'object'
    ? Reflect.get(params, 'filter')
    : undefined;
};

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? '') === JSON.stringify(b ?? '');
}

/** The editor draft of stored grants, with the custom filters it cannot carry in a select. */
export function draftFromGrants(
  grants: readonly PermissionGrant[],
  workspace: PermissionWorkspace,
): { readonly draft: PermissionValue; readonly filters: PermissionFilters } {
  const draft: Record<string, { scopes?: Record<string, string> }> = {};
  const filters: Record<string, unknown> = {};
  for (const [id, binding] of workspace.bindings) {
    const entry = storedAction(grants, binding.resource, binding.action);
    if (!entry) continue;
    const stored = storedScopes(entry);
    const scopes: Record<string, string> = {};
    for (const scope of binding.scopes) {
      if (!scope.visible) continue;
      const value = stored[scope.key];
      // A follower stored with the value of the View it follows, while that View is granted, follows it.
      const view = scope.follows
        ? workspace.bindings.get(scope.follows)
        : undefined;
      const viewEntry = view
        ? storedAction(grants, view.resource, view.action)
        : undefined;
      if (
        view &&
        viewEntry &&
        same(value, storedScopes(viewEntry)[view.scopes[0]?.key ?? ''])
      )
        continue;
      // The View it follows is not granted: the stored value is shown as it is, and saving keeps it unless changed.
      const selection = scopeSelection(value);
      scopes[scope.key] = selection;
      if (selection === CUSTOM_FILTER)
        filters[filterKey(id, scope.key)] = filterOf(value);
    }
    draft[id] = Object.keys(scopes).length ? { scopes } : {};
  }
  // A menu is checked when any of its pages opens; the rest of its pages open with it when saved.
  const menus = [...workspace.menuPages]
    .filter(([, pages]) =>
      pages.some((page) =>
        storedAction(grants, { type: 'page', id: page }, 'access'),
      ),
    )
    .map(([menu]) => menu);
  return { draft: { menus, grants: draft }, filters };
}

function storedValue(
  selection: string,
  original: unknown,
  filter: unknown,
): unknown {
  if (selection === NO_SCOPE) return '';
  if (selection === PRESERVED_SCOPE) return original;
  if (selection === CUSTOM_FILTER)
    return { type: 'recordAccess', key: CUSTOM_FILTER, params: { filter } };
  // Keep a stored value's parameters when the choice is unchanged.
  return scopeSelection(original) === selection ? original : selection;
}

/**
 * Stored grants for a draft. Actions the editor does not show and unchanged scopes are kept exactly as stored. Followers
 * store a copy of the value of the View they follow, which may be another object's; while that View is off they keep
 * their stored value, and a new one reaches no records. A checked menu opens its pages and an unchecked one closes them, whatever the objects'
 * actions are.
 */
export function grantsFromDraft(
  value: PermissionValue,
  filters: PermissionFilters,
  original: readonly PermissionGrant[],
  workspace: PermissionWorkspace,
): readonly PermissionGrant[] {
  const draft = value.grants;
  const resolved = new Map<string, Readonly<Record<string, unknown>>>();
  // Two Views may follow each other through extra scopes; one being resolved is not followed again.
  const resolving = new Set<string>();
  const scopesOf = (id: string): Readonly<Record<string, unknown>> => {
    const cached = resolved.get(id);
    if (cached) return cached;
    resolving.add(id);
    const binding = workspace.bindings.get(id)!;
    const entry = storedAction(original, binding.resource, binding.action);
    const stored = storedScopes(entry);
    const chosen = draft[id]?.scopes ?? {};
    // Keys the catalog does not declare for this action, such as a plugin's own, are kept as stored.
    const scopes: Record<string, unknown> = { ...stored };
    for (const scope of binding.scopes) {
      const original = stored[scope.key];
      if (!scope.visible) {
        scopes[scope.key] = original ?? scope.defaultValue;
        continue;
      }
      const selection = chosen[scope.key];
      // Unchanged since it was read: the stored value is kept exactly, parameters, unknown values and a missing key
      // included, so opening a role and saving it, or only renaming it, never rewrites a scope.
      const unchanged =
        entry !== undefined &&
        selection !== undefined &&
        selection === scopeSelection(original) &&
        (selection !== CUSTOM_FILTER ||
          same(filters[filterKey(id, scope.key)], filterOf(original)));
      if (unchanged) {
        if (!(scope.key in stored)) delete scopes[scope.key];
        continue;
      }
      // The View it follows is off. A value stored by a seed or the API is kept above until an administrator turns
      // that View on and picks another; a new action has none to keep and reaches no records until that View is on.
      if (
        scope.follows &&
        workspace.bindings.has(scope.follows) &&
        !draft[scope.follows]
      ) {
        scopes[scope.key] =
          entry && selection === undefined && scope.key in stored
            ? original
            : storedValue(NO_SCOPE, original, undefined);
        continue;
      }
      if (selection === undefined && scope.follows) {
        const view = workspace.bindings.get(scope.follows);
        const viewScope = view?.scopes[0]?.key;
        if (
          view &&
          viewScope &&
          draft[scope.follows] &&
          !resolving.has(scope.follows)
        ) {
          scopes[scope.key] = scopesOf(scope.follows)[viewScope];
          continue;
        }
      }
      scopes[scope.key] = storedValue(
        selection ?? scopeSelection(scope.defaultValue),
        original,
        filters[filterKey(id, scope.key)] ?? filterOf(original),
      );
    }
    resolving.delete(id);
    resolved.set(id, scopes);
    return scopes;
  };

  const next = new Map<string, PermissionGrant>();
  for (const grant of original)
    next.set(JSON.stringify([grant.resource.type, grant.resource.id]), {
      resource: grant.resource,
      actions: [...grant.actions],
    });
  const write = (
    resource: { type: string; id: string },
    action: string,
    entry: PermissionGrant['actions'][number] | undefined,
  ): void => {
    const key = JSON.stringify([resource.type, resource.id]);
    const grant = next.get(key) ?? {
      resource: { type: resource.type, id: resource.id },
      actions: [],
    };
    // An existing action keeps its place, so saving an unchanged role stores the same list.
    const index = grant.actions.findIndex((item) => item.action === action);
    const actions = grant.actions.filter((item) => item.action !== action);
    if (entry) actions.splice(index === -1 ? actions.length : index, 0, entry);
    next.set(key, { ...grant, actions });
  };

  for (const [id, binding] of workspace.bindings) {
    const existing = storedAction(original, binding.resource, binding.action);
    if (!draft[id]) {
      write(binding.resource, binding.action, undefined);
      continue;
    }
    if (!binding.scopes.length) {
      write(
        binding.resource,
        binding.action,
        existing ?? { action: binding.action },
      );
      continue;
    }
    const scopes = scopesOf(id);
    write(
      binding.resource,
      binding.action,
      existing && same(storedScopes(existing), scopes)
        ? existing
        : {
            action: binding.action,
            policy: { ...existing?.policy, type: 'composite', scopes },
          },
    );
  }
  for (const [menu, pages] of workspace.menuPages) {
    const visible = value.menus.includes(menu);
    for (const page of pages) {
      const resource = { type: 'page', id: page };
      const existing = storedAction(original, resource, 'access');
      write(
        resource,
        'access',
        visible ? (existing ?? { action: 'access' }) : undefined,
      );
    }
  }
  return [...next.values()].filter((grant) => grant.actions.length);
}

/** The first enabled scope whose custom filter has no conditions yet; it must be configured before saving. */
export function unconfiguredFilter(
  draft: PermissionGrants,
  filters: PermissionFilters,
  workspace: PermissionWorkspace,
): { readonly action: string; readonly scope: string } | undefined {
  for (const [id, binding] of workspace.bindings) {
    if (!draft[id]) continue;
    for (const scope of binding.scopes) {
      if (draft[id]?.scopes?.[scope.key] !== CUSTOM_FILTER) continue;
      const filter = filters[filterKey(id, scope.key)];
      if (filter === null || !['object', 'boolean'].includes(typeof filter))
        return { action: id, scope: scope.key };
    }
  }
  return undefined;
}

/** Whether two drafts store the same thing, to tell a real change from an edit that was undone. */
export function sameGrants(
  a: readonly PermissionGrant[],
  b: readonly PermissionGrant[],
): boolean {
  const normalize = (grants: readonly PermissionGrant[]) =>
    grants
      .map((grant) => ({
        resource: grant.resource,
        actions: [...grant.actions].sort((x, y) =>
          x.action.localeCompare(y.action),
        ),
      }))
      .filter((grant) => grant.actions.length)
      .sort((x, y) =>
        JSON.stringify(x.resource).localeCompare(JSON.stringify(y.resource)),
      );
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}
