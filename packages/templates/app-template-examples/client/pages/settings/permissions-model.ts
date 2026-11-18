import type {
  AuthorizationOptionsResponse,
  PermissionGrant,
} from '@nocobase/app-plugin-authorization/client';
import type {
  PermissionGrants,
  PermissionModule,
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
  /** Unset in the draft means the View action's stored value. */
  readonly follows: boolean;
  readonly defaultValue: string;
}

export interface PermissionBinding {
  readonly menu: string;
  readonly resource: { readonly type: string; readonly id: string };
  readonly action: string;
  readonly view: boolean;
  /** The View action followers copy their scope from. */
  readonly viewId?: string | undefined;
  readonly scopes: readonly PermissionScopeBinding[];
}

export interface PermissionWorkspace {
  readonly modules: readonly PermissionModule[];
  /** Every editable action by editor id. */
  readonly bindings: ReadonlyMap<string, PermissionBinding>;
  /** Pages of menus whose actions are business operations: opened exactly when the menu is visible. */
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
): { readonly draft: PermissionGrants; readonly filters: PermissionFilters } {
  const draft: Record<string, { scopes?: Record<string, string> }> = {};
  const filters: Record<string, unknown> = {};
  for (const [id, binding] of workspace.bindings) {
    const entry = storedAction(grants, binding.resource, binding.action);
    if (!entry) continue;
    const stored = storedScopes(entry);
    const view = binding.viewId
      ? workspace.bindings.get(binding.viewId)
      : undefined;
    const viewStored = view
      ? storedScopes(storedAction(grants, view.resource, view.action))[
          view.scopes[0]?.key ?? ''
        ]
      : undefined;
    const scopes: Record<string, string> = {};
    for (const scope of binding.scopes) {
      if (!scope.visible) continue;
      const value = stored[scope.key];
      // A follower stored with View's own value follows View.
      if (scope.follows && view && same(value, viewStored)) continue;
      const selection = scopeSelection(value);
      scopes[scope.key] = selection;
      if (selection === CUSTOM_FILTER)
        filters[filterKey(id, scope.key)] = filterOf(value);
    }
    draft[id] = Object.keys(scopes).length ? { scopes } : {};
  }
  return { draft, filters };
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
 * Stored grants for a draft. Actions the editor does not show and the policies of unchanged choices are kept as
 * stored. Followers store a copy of View's value, and a menu's pages are opened exactly when any of its actions is.
 */
export function grantsFromDraft(
  draft: PermissionGrants,
  filters: PermissionFilters,
  original: readonly PermissionGrant[],
  workspace: PermissionWorkspace,
): readonly PermissionGrant[] {
  const resolved = new Map<string, Readonly<Record<string, unknown>>>();
  const scopesOf = (id: string): Readonly<Record<string, unknown>> => {
    const cached = resolved.get(id);
    if (cached) return cached;
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
      if (selection === undefined && scope.follows && binding.viewId) {
        const view = workspace.bindings.get(binding.viewId);
        const viewScope = view?.scopes[0]?.key;
        if (view && viewScope && draft[binding.viewId]) {
          scopes[scope.key] = scopesOf(binding.viewId)[viewScope];
          continue;
        }
      }
      scopes[scope.key] = storedValue(
        selection ?? scopeSelection(scope.defaultValue),
        original,
        filters[filterKey(id, scope.key)] ?? filterOf(original),
      );
    }
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
    const visible = [...workspace.bindings].some(
      ([id, binding]) => binding.menu === menu && draft[id],
    );
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
