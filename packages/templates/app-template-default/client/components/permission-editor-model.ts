/**
 * Rules of the permission editor, kept free of rendering so hosts and tests can apply them directly.
 *
 * Menus and data permissions are separate. A menu only decides whether its entry shows in the sidebar. What a role may
 * see and do is set once per business object, whichever menus use it: data scope is chosen on the object's View
 * action, and other actions follow it ("Same as view") unless they are set narrower, never wider. Pages may declare
 * the objects they use; that only produces reference tags and a warning when a checked menu would open empty, and never
 * grants anything. Every function returns a new value and never mutates its input.
 */
import type { ReactNode } from 'react';

export type PermissionRisk = 'sensitive' | 'high';

export interface PermissionScopeOption {
  readonly value: string;
  readonly label: string;
}

export interface PermissionScopeSlot {
  readonly id: string;
  /** Shown before the select when an action has several scopes, such as the registered title of a related object. */
  readonly label?: string | undefined;
  /** Ordered from the widest to the narrowest. A follower slot may omit them and reuse the View options. */
  readonly options?: readonly PermissionScopeOption[] | undefined;
  /** The value an enabled action uses before anyone picks one. Defaults to the first option. */
  readonly defaultValue?: string | undefined;
  /**
   * Follows the View scope of the same object: unset means "Same as view", and only narrower options are offered. An
   * action id follows the first scope of that action instead. It may name another object's View, such as a Contacts
   * action reading customers following Customers' View, so an object's data scope is set in one place. That View is
   * then a requirement of the action: turning the action on turns it on, and turning it off asks before turning the
   * action off too, so the slot never falls back to a wider scope of its own.
   */
  readonly followsView?: boolean | string | undefined;
  /**
   * On a slot others follow: for each value, the values provably narrower than it. When set, only these pairs count
   * as narrower; otherwise the option order does, widest first. Use it when options filter different things, such as
   * a region and a confidentiality flag, so neither contains the other.
   */
  readonly narrower?: Readonly<Record<string, readonly string[]>> | undefined;
  /** Extra controls for the selected value, such as a custom filter. */
  readonly configuration?: ReactNode;
}

export interface PermissionAction {
  /** Unique across the editor; used as the key of the draft. */
  readonly id: string;
  readonly label: string;
  readonly description?: string | undefined;
  /** The object's View action: listed first and owns the object's data scope. */
  readonly view?: boolean | undefined;
  /** A business operation such as a state transition, listed after the basic ones below a thin divider. */
  readonly business?: boolean | undefined;
  readonly scopes?: readonly PermissionScopeSlot[] | undefined;
  /** Actions that must be on for this one to work, in any object. Defaults to the object's View action. */
  readonly requires?: readonly string[] | undefined;
  /** Risky actions are never turned on by Enable all or as a requirement. They carry no tag. */
  readonly risk?: PermissionRisk | undefined;
  /** Managed by the application: shown but not editable. */
  readonly managed?: boolean | undefined;
}

/** A business object, such as Customers: the one place its actions and data scope are set. */
export interface PermissionObject {
  readonly id: string;
  readonly label: string;
  readonly description?: string | undefined;
  /** The heading it is listed under, such as the plugin or module that registers it. */
  readonly group?: string | undefined;
  readonly actions: readonly PermissionAction[];
  /** A notice under the action list, such as a warning about granting access to others. */
  readonly notice?: ReactNode;
}

/** Objects a page uses, by object id. Only for reference tags and the empty-page warning; it grants nothing. */
export interface PermissionMenuUses {
  /** The objects the page lists; without View on them the page opens empty. */
  readonly primary?: readonly string[] | undefined;
  /** Objects the page also shows, such as the customer of a contract. */
  readonly related?: readonly string[] | undefined;
}

/** A sidebar entry. A node with children is a group whose checkbox checks or clears all of them. */
export interface PermissionMenuNode {
  readonly id: string;
  readonly label: string;
  readonly description?: string | undefined;
  /** Every signed-in user sees it; the checkbox is fixed. The string explains why. */
  readonly public?: boolean | string | undefined;
  readonly children?: readonly PermissionMenuNode[] | undefined;
  readonly uses?: PermissionMenuUses | undefined;
  /**
   * The entry has no menu permission of its own and shows while this action is on, such as a settings page guarded
   * by reading its resource. Its checkbox is read-only: checking menus never changes an object's permissions, so the
   * editor points to the object instead.
   */
  readonly opensWith?: string | undefined;
}

export interface PermissionGrant {
  /** Chosen values by scope slot id. A follower slot without a value is "Same as view". */
  readonly scopes?: Readonly<Record<string, string>> | undefined;
}

/** Enabled actions: an action id is present exactly when the action is on. */
export type PermissionGrants = Readonly<Record<string, PermissionGrant>>;

/** The draft: checked menus and enabled actions, edited and stored independently. */
export interface PermissionValue {
  /** Ids of checked menus, leaves only. Public menus and menus that open with an action are not listed. */
  readonly menus: readonly string[];
  readonly grants: PermissionGrants;
}

export type PermissionObjectState = 'full' | 'partial' | 'off';

export interface PermissionObjectStatus {
  readonly state: PermissionObjectState;
  readonly enabled: number;
  readonly total: number;
}

export type PermissionCheckState = 'checked' | 'unchecked' | 'mixed';

export type PermissionNotice =
  | {
      /** Followers that were wider than the new View scope and follow it again. */
      readonly kind: 'scope-reset';
      readonly view: string;
      readonly actions: readonly string[];
    }
  | {
      /** Actions turned on because something that was turned on requires them. */
      readonly kind: 'auto-enabled';
      readonly actions: readonly string[];
    }
  | {
      /**
       * An action stayed off because it needs others that are never turned on automatically: `actions` are risky
       * ones the user can turn on first, `managed` are managed by the application (or unknown) and cannot be turned
       * on here.
       */
      readonly kind: 'missing-requirement';
      readonly action: string;
      readonly actions: readonly string[];
      readonly managed: readonly string[];
    }
  | {
      /** Nothing was turned off because actions managed by the application need these. */
      readonly kind: 'managed-dependent';
      readonly actions: readonly string[];
    };

export interface PermissionChange {
  readonly grants: PermissionGrants;
  readonly notices: readonly PermissionNotice[];
}

/** A checked menu whose page lists an object this role cannot view: it would open empty. */
export interface PermissionMenuWarning {
  readonly menu: PermissionMenuNode;
  readonly object: PermissionObject;
  /** The action that makes the page show data, normally the object's View. */
  readonly action: PermissionAction;
}

// Business objects

export function viewActionOf(
  object: PermissionObject,
): PermissionAction | undefined {
  return object.actions.find((action) => action.view);
}

/** View first, then basic actions, then business actions, keeping the caller's order within each. */
export function orderedActions(object: PermissionObject): {
  readonly basic: readonly PermissionAction[];
  readonly business: readonly PermissionAction[];
} {
  const view = object.actions.filter((action) => action.view);
  return {
    basic: [
      ...view,
      ...object.actions.filter((action) => !action.view && !action.business),
    ],
    business: object.actions.filter(
      (action) => !action.view && action.business,
    ),
  };
}

export function findAction(
  objects: readonly PermissionObject[],
  id: string,
):
  | { readonly object: PermissionObject; readonly action: PermissionAction }
  | undefined {
  for (const object of objects) {
    const action = object.actions.find((item) => item.id === id);
    if (action) return { object, action };
  }
  return undefined;
}

export function requirementsOf(
  object: PermissionObject,
  action: PermissionAction,
): readonly string[] {
  const view = viewActionOf(object);
  const own =
    action.requires ?? (view && view.id !== action.id ? [view.id] : []);
  // A slot following another object's View reads that object's records within its scope: without that View it would
  // have no scope to follow, so it requires it. Turning the View off then asks before turning this action off too.
  const followed = (action.scopes ?? []).flatMap((slot) =>
    typeof slot.followsView === 'string' &&
    slot.followsView !== action.id &&
    !object.actions.some((item) => item.id === slot.followsView) &&
    !own.includes(slot.followsView)
      ? [slot.followsView]
      : [],
  );
  return followed.length ? [...own, ...followed] : own;
}

function viewSlotOf(object: PermissionObject): PermissionScopeSlot | undefined {
  return viewActionOf(object)?.scopes?.[0];
}

interface Leader {
  readonly object: PermissionObject;
  readonly action: PermissionAction;
  readonly slot: PermissionScopeSlot;
}

/**
 * The action and slot a follower follows: the object's View, or the action its `followsView` names, in this object or
 * among `objects`. With `grants`, a leader in another object counts only while it is on.
 */
function leaderOf(
  object: PermissionObject,
  slot: PermissionScopeSlot | undefined,
  objects: readonly PermissionObject[] = [],
  grants?: PermissionGrants,
): Leader | undefined {
  if (slot && !slot.followsView) return undefined;
  let owner = object;
  let action: PermissionAction | undefined;
  if (typeof slot?.followsView === 'string') {
    const id = slot.followsView;
    action = object.actions.find((item) => item.id === id);
    if (!action) {
      const found = findAction(objects, id);
      if (!found || (grants && !grants[id])) return undefined;
      ({ object: owner, action } = found);
    }
  } else action = viewActionOf(object);
  const leader = action?.scopes?.[0];
  return action && leader && leader !== slot
    ? { object: owner, action, slot: leader }
    : undefined;
}

/** The other object whose View a follower slot follows, while that View is on; undefined for its own object's. */
export function followedObject(
  object: PermissionObject,
  slot: PermissionScopeSlot,
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
): PermissionObject | undefined {
  const leader = leaderOf(object, slot, objects, grants);
  return leader && leader.object !== object ? leader.object : undefined;
}

export function slotOptions(
  object: PermissionObject,
  slot: PermissionScopeSlot,
  objects?: readonly PermissionObject[],
): readonly PermissionScopeOption[] {
  if (slot.followsView && !slot.options?.length)
    return leaderOf(object, slot, objects)?.slot.options ?? [];
  return slot.options ?? [];
}

/** The value a slot has, the default for one nobody picked yet. Undefined for a follower that follows View. */
export function ownScopeValue(
  object: PermissionObject,
  grants: PermissionGrants,
  action: PermissionAction,
  slot: PermissionScopeSlot,
  objects?: readonly PermissionObject[],
): string | undefined {
  const value = grants[action.id]?.scopes?.[slot.id];
  if (value !== undefined) return value;
  if (slot.followsView && leaderOf(object, slot, objects, grants))
    return undefined;
  return slot.defaultValue ?? slotOptions(object, slot, objects)[0]?.value;
}

/**
 * The current value of the scope a follower slot follows; the object's View scope without a slot. Undefined when
 * there is no scoped leader.
 */
export function viewScopeValue(
  object: PermissionObject,
  grants: PermissionGrants,
  slot?: PermissionScopeSlot,
  objects?: readonly PermissionObject[],
): string | undefined {
  const view = viewActionOf(object);
  const viewSlot = view?.scopes?.[0];
  const leader = slot
    ? leaderOf(object, slot, objects, grants)
    : view && viewSlot
      ? { object, action: view, slot: viewSlot }
      : undefined;
  return leader
    ? ownScopeValue(leader.object, grants, leader.action, leader.slot, objects)
    : undefined;
}

/** The scope that actually applies to an action slot, resolving "Same as view". */
export function effectiveScopeValue(
  object: PermissionObject,
  grants: PermissionGrants,
  action: PermissionAction,
  slot: PermissionScopeSlot,
  objects?: readonly PermissionObject[],
): string | undefined {
  return (
    ownScopeValue(object, grants, action, slot, objects) ??
    (slot.followsView
      ? viewScopeValue(object, grants, slot, objects)
      : undefined)
  );
}

/** Whether a leader slot lists a value among its options. */
function listed(leader: PermissionScopeSlot, value: string): boolean {
  return (leader.options ?? []).some((option) => option.value === value);
}

/** Whether `value` is provably narrower than `than` on a leader slot: its declared pairs, else its option order. */
function isNarrower(
  leader: PermissionScopeSlot,
  value: string,
  than: string,
): boolean {
  if (!listed(leader, value) || !listed(leader, than) || value === than)
    return false;
  if (leader.narrower) return leader.narrower[than]?.includes(value) ?? false;
  const options = leader.options ?? [];
  const rank = (key: string): number =>
    options.findIndex((option) => option.value === key);
  return rank(value) > rank(than);
}

/** The label of the scope a follower follows; the object's View scope without a slot. For "Same as view (X)". */
export function viewScopeLabel(
  object: PermissionObject,
  grants: PermissionGrants,
  slot?: PermissionScopeSlot,
  objects?: readonly PermissionObject[],
): string | undefined {
  const value = viewScopeValue(object, grants, slot, objects);
  if (value === undefined) return undefined;
  const leader = slot
    ? leaderOf(object, slot, objects, grants)?.slot
    : viewSlotOf(object);
  return (
    leader?.options?.find((option) => option.value === value)?.label ?? value
  );
}

/** The View scope's options, widest first, for the note that explains the scope rule. */
export function viewScopeOptions(
  object: PermissionObject,
): readonly PermissionScopeOption[] {
  return viewSlotOf(object)?.options ?? [];
}

/**
 * Options of a follower that are provably narrower than the scope it follows, offered besides "Same as view". Both
 * sides are judged by the leader's options; an option the leader does not list is never offered.
 */
export function narrowerOptions(
  object: PermissionObject,
  grants: PermissionGrants,
  slot: PermissionScopeSlot,
  objects?: readonly PermissionObject[],
): readonly PermissionScopeOption[] {
  const leader = leaderOf(object, slot, objects, grants);
  const current = viewScopeValue(object, grants, slot, objects);
  if (!leader || current === undefined) return [];
  return slotOptions(object, slot, objects).filter((option) =>
    isNarrower(leader.slot, option.value, current),
  );
}

export function objectStatus(
  object: PermissionObject,
  grants: PermissionGrants,
): PermissionObjectStatus {
  const total = object.actions.length;
  const enabled = object.actions.filter((action) => grants[action.id]).length;
  const state: PermissionObjectState =
    enabled === 0 ? 'off' : enabled === total ? 'full' : 'partial';
  return { state, enabled, total };
}

/** Objects with at least one action on, of all objects. */
export function objectCount(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
): { readonly enabled: number; readonly total: number } {
  return {
    enabled: objects.filter((object) =>
      object.actions.some((action) => grants[action.id]),
    ).length,
    total: objects.length,
  };
}

/** Objects whose group, name, description, or action names or descriptions match. */
export function filterObjects(
  objects: readonly PermissionObject[],
  query: string,
): readonly PermissionObject[] {
  const search = query.trim().toLocaleLowerCase();
  if (!search) return objects;
  const matches = (value: string | undefined): boolean =>
    Boolean(value?.toLocaleLowerCase().includes(search));
  return objects.filter(
    (object) =>
      matches(object.label) ||
      matches(object.group) ||
      matches(object.description) ||
      object.actions.some(
        (action) => matches(action.label) || matches(action.description),
      ),
  );
}

function labelsOf(
  objects: readonly PermissionObject[],
  ids: Iterable<string>,
): string[] {
  return [...ids].map((id) => findAction(objects, id)?.action.label ?? id);
}

/**
 * Enabled actions that require these ones, directly or not. Those managed by the application cannot be turned off,
 * so their presence blocks turning these off.
 */
export function dependentsOf(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  ids: readonly string[],
): readonly PermissionAction[] {
  const off = new Set(ids);
  const result: PermissionAction[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const object of objects)
      for (const action of object.actions) {
        if (off.has(action.id) || !grants[action.id]) continue;
        if (requirementsOf(object, action).some((id) => off.has(id))) {
          off.add(action.id);
          result.push(action);
          changed = true;
        }
      }
  }
  return result;
}

/**
 * What turning one action on also turns on, following requirements transitively, even through ones already on; and
 * the requirements that are off and can never be turned on automatically (risky, or managed by the application).
 */
function requirementClosure(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  id: string,
): {
  readonly enable: readonly string[];
  readonly risky: readonly string[];
  readonly managed: readonly string[];
} {
  const enable: string[] = [];
  const risky: string[] = [];
  const managed: string[] = [];
  const queue = [id];
  const seen = new Set<string>();
  while (queue.length) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);
    const found = findAction(objects, current);
    if (!found) {
      managed.push(current);
      continue;
    }
    const on = current !== id && Boolean(grants[current]);
    if (!on && current !== id) {
      if (found.action.managed) {
        managed.push(current);
        continue;
      }
      if (found.action.risk) {
        risky.push(current);
        continue;
      }
    }
    if (!on) enable.push(current);
    // An action already on may still miss its own requirements, so keep walking through it.
    queue.push(...requirementsOf(found.object, found.action));
  }
  return { enable, risky, managed };
}

/** Turn each action on with its requirements, or leave it off when one of them cannot be turned on automatically. */
function enableWithRequirements(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  ids: readonly string[],
): PermissionChange {
  let next: PermissionGrants = grants;
  const explicit = new Set(ids);
  const auto: string[] = [];
  const notices: PermissionNotice[] = [];
  for (const id of ids) {
    const found = findAction(objects, id);
    if (!found || found.action.managed || next[id]) continue;
    const { enable, risky, managed } = requirementClosure(objects, next, id);
    if (risky.length || managed.length) {
      notices.push({
        kind: 'missing-requirement',
        action: found.action.label,
        actions: labelsOf(objects, risky),
        managed: labelsOf(objects, managed),
      });
      continue;
    }
    const added: Record<string, PermissionGrant> = { ...next };
    for (const item of enable) {
      added[item] = {};
      if (!explicit.has(item) && !auto.includes(item)) auto.push(item);
    }
    next = added;
  }
  if (auto.length)
    notices.unshift({ kind: 'auto-enabled', actions: labelsOf(objects, auto) });
  return { grants: next, notices };
}

function managedBlock(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  ids: readonly string[],
): PermissionChange | undefined {
  const managed = dependentsOf(objects, grants, ids).filter(
    (action) => action.managed,
  );
  return managed.length
    ? {
        grants,
        notices: [
          {
            kind: 'managed-dependent',
            actions: managed.map((action) => action.label),
          },
        ],
      }
    : undefined;
}

function withoutActions(
  grants: PermissionGrants,
  ids: Iterable<string>,
): PermissionGrants {
  const next: Record<string, PermissionGrant> = { ...grants };
  for (const id of ids) delete next[id];
  return next;
}

/**
 * Turn an action on with what it requires, or leave it off when a requirement is risky or managed and still off.
 * Turn one off with everything that requires it, unless an action managed by the application needs it. Ask before
 * turning off: `dependentsOf` lists what goes with it.
 */
export function setActionEnabled(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  id: string,
  enabled: boolean,
): PermissionChange {
  if (findAction(objects, id)?.action.managed) return { grants, notices: [] };
  if (enabled) return enableWithRequirements(objects, grants, [id]);
  const blocked = managedBlock(objects, grants, [id]);
  if (blocked) return blocked;
  const dependents = dependentsOf(objects, grants, [id]);
  return {
    grants: withoutActions(grants, [id, ...dependents.map((item) => item.id)]),
    notices: [],
  };
}

export type PermissionQuickSet = 'all' | 'view' | 'none';

/** What a quick button would turn off, including actions of other objects that require them. */
export function quickSetRemovals(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  object: PermissionObject,
  mode: PermissionQuickSet,
): {
  readonly own: readonly string[];
  readonly others: readonly PermissionAction[];
} {
  if (mode === 'all') return { own: [], others: [] };
  const keep = mode === 'view' ? viewActionOf(object)?.id : undefined;
  const own = object.actions
    .filter(
      (action) => action.id !== keep && !action.managed && grants[action.id],
    )
    .map((action) => action.id);
  const inObject = new Set(object.actions.map((action) => action.id));
  return {
    own,
    others: dependentsOf(objects, grants, own).filter(
      (action) => !inObject.has(action.id) && !action.managed,
    ),
  };
}

/** Enable all (risky ones excepted), View only, or Disable all for one object. */
export function applyQuickSet(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  object: PermissionObject,
  mode: PermissionQuickSet,
): PermissionChange {
  if (mode === 'all') {
    const ids = object.actions
      .filter((action) => !action.risk && !action.managed)
      .map((action) => action.id);
    return enableWithRequirements(objects, grants, ids);
  }
  const { own, others } = quickSetRemovals(objects, grants, object, mode);
  const blocked = managedBlock(objects, grants, own);
  if (blocked) return blocked;
  const removed = withoutActions(grants, [
    ...own,
    ...others.map((action) => action.id),
  ]);
  const view = viewActionOf(object);
  if (mode === 'view' && view && !view.managed && !removed[view.id])
    return enableWithRequirements(objects, removed, [view.id]);
  return { grants: removed, notices: [] };
}

/**
 * Pick a scope value. Undefined on a follower means "Same as view". Narrowing View sends followers that were wider
 * than the new View scope back to "Same as view" and reports them.
 */
export function setScopeValue(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  actionId: string,
  slotId: string,
  value: string | undefined,
): PermissionChange {
  const found = findAction(objects, actionId);
  const grant = grants[actionId];
  if (!found || !grant || found.action.managed) return { grants, notices: [] };
  const { object, action } = found;
  const slot = action.scopes?.find((item) => item.id === slotId);
  // A follower is never wider than what it follows, and one equal to it simply follows it.
  const chosen =
    value !== undefined &&
    slot &&
    leaderOf(object, slot, objects, grants) &&
    !narrowerOptions(object, grants, slot, objects).some(
      (option) => option.value === value,
    )
      ? undefined
      : value;
  const scopes: Record<string, string> = { ...grant.scopes };
  if (chosen === undefined) delete scopes[slotId];
  else scopes[slotId] = chosen;
  const next: Record<string, PermissionGrant> = {
    ...grants,
    [actionId]: { ...grant, scopes },
  };
  const reset: string[] = [];
  let leaderLabel = '';
  // Followers may sit in other objects, such as a Contacts action reading customers that follows Customers' View.
  for (const owner of objects)
    for (const other of owner.actions) {
      const otherGrant = next[other.id];
      if (other.id === actionId || !otherGrant?.scopes) continue;
      const otherScopes: Record<string, string> = { ...otherGrant.scopes };
      let changed = false;
      for (const follower of other.scopes ?? []) {
        const own = otherScopes[follower.id];
        const leader = leaderOf(owner, follower, objects, next);
        if (
          own === undefined ||
          leader?.action.id !== actionId ||
          leader.slot.id !== slotId
        )
          continue;
        const current = viewScopeValue(owner, next, follower, objects);
        // A value the leader lists and that is not provably narrower, wider or now equal, goes back to following it, and
        // the notice names it so the change in the list is explained. An unlisted value is kept as stored.
        if (
          current === undefined ||
          !listed(leader.slot, own) ||
          isNarrower(leader.slot, own, current)
        )
          continue;
        delete otherScopes[follower.id];
        changed = true;
        leaderLabel = viewScopeLabel(owner, next, follower, objects) ?? current;
      }
      if (changed) {
        next[other.id] = { ...otherGrant, scopes: otherScopes };
        reset.push(other.label);
      }
    }
  return {
    grants: next,
    notices: reset.length
      ? [{ kind: 'scope-reset', view: leaderLabel, actions: reset }]
      : [],
  };
}

// Menus

/** Every menu that is not a group, in tree order. */
export function menuLeaves(
  nodes: readonly PermissionMenuNode[],
): readonly PermissionMenuNode[] {
  return nodes.flatMap((node) =>
    node.children?.length ? menuLeaves(node.children) : [node],
  );
}

export function isMenuChecked(
  node: PermissionMenuNode,
  value: PermissionValue,
): boolean {
  if (node.public) return true;
  if (node.opensWith) return Boolean(value.grants[node.opensWith]);
  return value.menus.includes(node.id);
}

/** Whether a menu's checkbox can change: it has its own menu permission, or a group holds one that does. */
export function isMenuToggleable(node: PermissionMenuNode): boolean {
  return menuLeaves([node]).some((leaf) => !leaf.public && !leaf.opensWith);
}

/**
 * A leaf's checkbox, or a group's from the menus under it that it can check: those with a menu permission of their
 * own, or, when it has none, every menu that needs a permission.
 */
export function menuCheckState(
  node: PermissionMenuNode,
  value: PermissionValue,
): PermissionCheckState {
  if (!node.children?.length)
    return isMenuChecked(node, value) ? 'checked' : 'unchecked';
  const needed = menuLeaves(node.children).filter((leaf) => !leaf.public);
  const own = needed.filter((leaf) => !leaf.opensWith);
  const leaves = own.length ? own : needed;
  const checked = leaves.filter((leaf) => isMenuChecked(leaf, value)).length;
  if (!leaves.length) return 'checked';
  return checked === 0
    ? 'unchecked'
    : checked === leaves.length
      ? 'checked'
      : 'mixed';
}

/** Checked menus of all menus, public ones included, for the tab's count. */
export function menuCount(
  nodes: readonly PermissionMenuNode[],
  value: PermissionValue,
): { readonly checked: number; readonly total: number } {
  const leaves = menuLeaves(nodes);
  return {
    checked: leaves.filter((leaf) => isMenuChecked(leaf, value)).length,
    total: leaves.length,
  };
}

function findMenu(
  nodes: readonly PermissionMenuNode[],
  id: string,
): PermissionMenuNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = node.children ? findMenu(node.children, id) : undefined;
    if (found) return found;
  }
  return undefined;
}

/**
 * Check or clear a menu, or every menu of a group. Only menu permissions change: public menus and menus that open
 * with an action stay as they are, and no object permission is ever turned on or off.
 */
export function setMenuChecked(
  nodes: readonly PermissionMenuNode[],
  value: PermissionValue,
  id: string,
  checked: boolean,
): PermissionValue {
  const node = findMenu(nodes, id);
  if (!node) return value;
  const menus = new Set(value.menus);
  for (const leaf of menuLeaves([node])) {
    if (leaf.public || leaf.opensWith) continue;
    if (checked) menus.add(leaf.id);
    else menus.delete(leaf.id);
  }
  // Keep the caller's order and append newly checked menus in tree order.
  const ordered = [
    ...value.menus.filter((menu) => menus.has(menu)),
    ...menuLeaves(nodes)
      .map((leaf) => leaf.id)
      .filter((menu) => menus.has(menu) && !value.menus.includes(menu)),
  ];
  return { menus: ordered, grants: value.grants };
}

/** Menus that need a permission, and how many of them this draft shows. */
export function visibleMenuCount(
  nodes: readonly PermissionMenuNode[],
  value: PermissionValue,
): { readonly visible: number; readonly total: number } {
  const leaves = menuLeaves(nodes).filter((leaf) => !leaf.public);
  return {
    visible: leaves.filter((leaf) => isMenuChecked(leaf, value)).length,
    total: leaves.length,
  };
}

/** Menus whose page declares this object, in tree order: they all apply the object's one setting. */
export function menusUsing(
  nodes: readonly PermissionMenuNode[],
  objectId: string,
): readonly PermissionMenuNode[] {
  return menuLeaves(nodes).filter(
    (leaf) =>
      leaf.uses?.primary?.includes(objectId) ||
      leaf.uses?.related?.includes(objectId),
  );
}

/** Whether a role can see records of an object: its View is on, or any action when it has no View. */
export function canViewObject(
  object: PermissionObject,
  grants: PermissionGrants,
): boolean {
  const view = viewActionOf(object);
  return view
    ? Boolean(grants[view.id])
    : object.actions.some((action) => grants[action.id]);
}

/** Checked menus whose page lists an object the role cannot view: they would open empty. Advice, never enforced. */
export function menuWarnings(
  nodes: readonly PermissionMenuNode[],
  objects: readonly PermissionObject[],
  value: PermissionValue,
): readonly PermissionMenuWarning[] {
  const warnings: PermissionMenuWarning[] = [];
  for (const menu of menuLeaves(nodes)) {
    if (menu.public || !isMenuChecked(menu, value)) continue;
    for (const id of menu.uses?.primary ?? []) {
      const object = objects.find((item) => item.id === id);
      const action = object
        ? (viewActionOf(object) ?? object.actions[0])
        : undefined;
      if (object && action && !canViewObject(object, value.grants))
        warnings.push({ menu, object, action });
    }
  }
  return warnings;
}
