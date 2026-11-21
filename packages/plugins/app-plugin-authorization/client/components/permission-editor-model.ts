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
  /** A short warning shown while the action is on, such as what a high-risk setting lets a person do. */
  readonly warning?: string | undefined;
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
  /** The titles of the pages its actions are used on; an empty list says it is used on none. Absent: not known. */
  readonly usedOn?: readonly string[] | undefined;
}

/**
 * A system settings page, such as Users or Permissions: the actions of the settings objects it uses, without data
 * scopes. A page has no menu permission of its own; its entry shows while the action that opens it is on.
 */
export interface PermissionSettingsPage {
  readonly id: string;
  readonly label: string;
  readonly description?: string | undefined;
  /** The settings category it is listed under, such as Account and permissions. */
  readonly group?: string | undefined;
  /** The settings objects the page uses; several are listed under their own labels. */
  readonly objects: readonly PermissionObject[];
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

/**
 * The object whose View a follower slot follows while that View is off: the slot then has no scope to follow, keeps the
 * value it has, stored or default, and cannot be changed until that View is on. Undefined for other slots.
 */
export function blockedLeaderObject(
  object: PermissionObject,
  slot: PermissionScopeSlot,
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
): PermissionObject | undefined {
  const leader = leaderOf(object, slot, objects);
  return leader && !grants[leader.action.id] ? leader.object : undefined;
}

/**
 * Whether a slot's extra controls, such as a custom filter, are read-only because the slot follows a View, its own or
 * another object's, on or off. A follower's scope is set by picking from its options; a stored configuration on it is
 * shown as it is but cannot be edited into one wider than what it follows.
 */
export function configurationLocked(
  object: PermissionObject,
  slot: PermissionScopeSlot,
  objects?: readonly PermissionObject[],
): boolean {
  return Boolean(leaderOf(object, slot, objects));
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
  // A View turned on caps the followers that kept their stored value while it was off: any not narrower than its scope
  // now follows it, and the notice names them.
  const enabled = new Set(
    Object.keys(next).filter((key) => !grants[key] && next[key]),
  );
  const capped = enabled.size
    ? resetWiderFollowers(
        objects,
        next,
        (leader) => enabled.has(leader.action.id),
        undefined,
        true,
      )
    : undefined;
  return capped
    ? { grants: capped.grants, notices: [...notices, ...capped.notices] }
    : { grants: next, notices };
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
 * Pick a scope value. Undefined on a follower means "Same as view". Narrowing View sends followers that are not
 * provably narrower than the new View scope back to "Same as view" and reports them; widening it keeps every follower.
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
  // A follower whose View is off keeps its value until that View is on; it cannot become wider meanwhile.
  if (slot && blockedLeaderObject(object, slot, objects, grants))
    return { grants, notices: [] };
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
  // Widening a scope, as its declared order or pairs prove, cannot push any follower past it: each keeps its own value,
  // one the scope does not list included. Only a change not provably wider caps the followers.
  if (slot) {
    const before = ownScopeValue(object, grants, action, slot, objects);
    const after = ownScopeValue(object, next, action, slot, objects);
    if (
      before !== undefined &&
      after !== undefined &&
      (before === after || isNarrower(slot, before, after))
    )
      return { grants: next, notices: [] };
  }
  return resetWiderFollowers(
    objects,
    next,
    (leader) => leader.action.id === actionId && leader.slot.id === slotId,
    actionId,
  );
}

/**
 * Cap the followers of one scope after the host changed what its value means, such as the conditions of a custom
 * filter, with the value itself unchanged. Such a change cannot be shown to be wider or narrower, so every follower not
 * provably narrower goes back to "Same as view", as when View is narrowed; the notices name them. Call it only when the
 * meaning actually changed: opening a role, saving it, or applying the same conditions again changes nothing.
 */
export function capFollowers(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  actionId: string,
  slotId: string,
): PermissionChange {
  const found = findAction(objects, actionId);
  if (!found || !grants[actionId] || found.action.managed)
    return { grants, notices: [] };
  return resetWiderFollowers(
    objects,
    grants,
    (leader) => leader.action.id === actionId && leader.slot.id === slotId,
    actionId,
  );
}

/**
 * Send followers of the matching leaders that are not provably narrower than them back to "Same as view", and name them
 * in a notice. Only an active change of a leader calls this; opening or saving a role keeps every stored value. A value
 * the leader does not list cannot be shown to stay within the new scope, so it follows too.
 */
function resetWiderFollowers(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  matches: (leader: Leader) => boolean,
  skip?: string,
  quietWhenEqual = false,
): PermissionChange {
  const next: Record<string, PermissionGrant> = { ...grants };
  const reset: string[] = [];
  let leaderLabel = '';
  // Followers may sit in other objects, such as a Contacts action reading customers that follows Customers' View.
  for (const owner of objects)
    for (const other of owner.actions) {
      const otherGrant = next[other.id];
      if (other.id === skip || !otherGrant?.scopes) continue;
      const otherScopes: Record<string, string> = { ...otherGrant.scopes };
      let changed = false;
      let named = false;
      for (const follower of other.scopes ?? []) {
        const own = otherScopes[follower.id];
        const leader = leaderOf(owner, follower, objects, next);
        if (own === undefined || !leader || !matches(leader)) continue;
        const current = viewScopeValue(owner, next, follower, objects);
        // A value that is not provably narrower, whether wider, now equal or one the leader does not list, goes back to
        // following it, and the notice names it so the change in the list is explained.
        if (current === undefined || isNarrower(leader.slot, own, current))
          continue;
        delete otherScopes[follower.id];
        changed = true;
        // One equal to the scope it now follows keeps its records: it follows without a notice when asked.
        if (quietWhenEqual && own === current) continue;
        named = true;
        leaderLabel = viewScopeLabel(owner, next, follower, objects) ?? current;
      }
      if (changed) {
        next[other.id] = { ...otherGrant, scopes: otherScopes };
        if (named) reset.push(other.label);
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

/**
 * Checked menus of the menus a role decides, for the tab's and a group's count. Public menus open for everyone and are
 * left out, so the count reads only what this role changes.
 */
export function menuCount(
  nodes: readonly PermissionMenuNode[],
  value: PermissionValue,
): { readonly checked: number; readonly total: number } {
  const leaves = menuLeaves(nodes).filter((leaf) => !leaf.public);
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

// System settings

/** A settings page as one object, so Enable all and Disable all apply to every action it holds. */
export function settingsPageObject(
  page: PermissionSettingsPage,
): PermissionObject {
  return {
    id: page.id,
    label: page.label,
    actions: page.objects.flatMap((object) => object.actions),
  };
}

/** Settings pages with any action on, of all pages, for the tab's count like the other tabs. */
export function settingsCount(
  pages: readonly PermissionSettingsPage[],
  grants: PermissionGrants,
): { readonly enabled: number; readonly total: number } {
  return {
    enabled: pages.filter((page) =>
      page.objects.some((object) =>
        object.actions.some((action) => grants[action.id]),
      ),
    ).length,
    total: pages.length,
  };
}

// Pages and the actions used on them

/** The actions of the objects a menu lists, primary ones or else related ones, for its "x / y operations". */
export function menuActionCount(
  menu: PermissionMenuNode,
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
):
  | {
      readonly enabled: number;
      readonly total: number;
      readonly object: PermissionObject;
    }
  | undefined {
  const ids = menu.uses?.primary?.length
    ? menu.uses.primary
    : (menu.uses?.related ?? []);
  const listed = ids.flatMap((id) => {
    const object = objects.find((item) => item.id === id);
    return object ? [object] : [];
  });
  const first = listed[0];
  if (!first) return undefined;
  const actions = listed.flatMap((object) => object.actions);
  return {
    enabled: actions.filter((action) => grants[action.id]).length,
    total: actions.length,
    object: first,
  };
}

/** An object the role may act on although it can open none of the pages that use it. */
export interface PermissionPageGap {
  readonly object: PermissionObject;
  readonly menus: readonly PermissionMenuNode[];
}

/** Objects with an action on whose every page is closed to the role: advice, as the API still allows the actions. */
export function pageAccessGaps(
  nodes: readonly PermissionMenuNode[],
  objects: readonly PermissionObject[],
  value: PermissionValue,
): readonly PermissionPageGap[] {
  return objects.flatMap((object) => {
    if (!object.actions.some((action) => value.grants[action.id])) return [];
    const menus = menusUsing(nodes, object.id).filter((menu) => !menu.public);
    if (!menus.length || menus.some((menu) => isMenuChecked(menu, value)))
      return [];
    return [{ object, menus }];
  });
}

/**
 * Turn on the actions a page opens with by default, with their requirements and default scopes. Actions already on,
 * risky ones and managed ones stay as they are; `added` lists the ones turned on, requirements included.
 */
export function enableDefaults(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  ids: readonly string[],
): PermissionChange & { readonly added: readonly string[] } {
  let next = grants;
  const notices: PermissionNotice[] = [];
  for (const id of ids) {
    const action = findAction(objects, id)?.action;
    if (!action || action.risk || action.managed || next[id]) continue;
    const change = setActionEnabled(objects, next, id, true);
    next = change.grants;
    notices.push(
      ...change.notices.filter((notice) => notice.kind !== 'auto-enabled'),
    );
  }
  const added = Object.keys(next).filter((id) => !grants[id]);
  return { grants: next, notices, added };
}

export type PermissionSettingsLevel = 'none' | 'view' | 'manage' | 'partial';

/** None, only what opens the page (View), every action (Manage), or another mix. */
export function settingsLevel(
  page: PermissionSettingsPage,
  grants: PermissionGrants,
): PermissionSettingsLevel {
  const actions = page.objects.flatMap((object) => object.actions);
  const on = actions.filter((action) => grants[action.id]);
  if (!on.length) return 'none';
  if (on.length === actions.length)
    return actions.length > 1 ? 'manage' : 'view';
  const views = page.objects.flatMap((object) => {
    const view = viewActionOf(object);
    return view ? [view] : [];
  });
  return on.length === views.length && views.every((view) => grants[view.id])
    ? 'view'
    : 'partial';
}

/** Set a settings page to None, View or Manage; Manage turns on every action the page holds, risky ones included. */
export function setSettingsLevel(
  objects: readonly PermissionObject[],
  grants: PermissionGrants,
  page: PermissionSettingsPage,
  level: 'none' | 'view' | 'manage',
): PermissionChange {
  const actions = page.objects.flatMap((object) => object.actions);
  const views = new Set(
    page.objects.flatMap((object) => {
      const view = viewActionOf(object) ?? object.actions[0];
      return view ? [view.id] : [];
    }),
  );
  const wanted = (action: PermissionAction): boolean =>
    level === 'manage' || (level === 'view' && views.has(action.id));
  let next = grants;
  const notices: PermissionNotice[] = [];
  // Turn off first, so nothing left on still requires what goes; then turn on what the level holds.
  for (const action of actions)
    if (!wanted(action) && next[action.id] && !action.managed) {
      const change = setActionEnabled(objects, next, action.id, false);
      next = change.grants;
      notices.push(...change.notices);
    }
  for (const action of actions)
    if (wanted(action) && !next[action.id] && !action.managed) {
      const change = enableWithRequirements(objects, next, [action.id]);
      next = change.grants;
    }
  return { grants: next, notices };
}

// Review

export type PermissionChangeTab = 'menus' | 'objects' | 'settings';

/** One difference between two drafts, as the review before saving lists it. */
export interface PermissionDraftChange {
  readonly tab: PermissionChangeTab;
  readonly kind: 'added' | 'removed' | 'scope';
  /** The page or the action's label. */
  readonly label: string;
  /** The object or settings page an action belongs to. */
  readonly owner?: string | undefined;
  readonly risk?: PermissionRisk | undefined;
}

/** Every difference from `before` to `after`: pages opened or closed, actions turned on or off, and scopes changed. */
export function permissionChanges(
  before: PermissionValue,
  after: PermissionValue,
  menus: readonly PermissionMenuNode[],
  objects: readonly PermissionObject[],
  settings: readonly PermissionSettingsPage[],
): readonly PermissionDraftChange[] {
  const changes: PermissionDraftChange[] = [];
  const was = new Set(before.menus);
  const is = new Set(after.menus);
  for (const leaf of menuLeaves(menus)) {
    if (is.has(leaf.id) && !was.has(leaf.id))
      changes.push({ tab: 'menus', kind: 'added', label: leaf.label });
    else if (was.has(leaf.id) && !is.has(leaf.id))
      changes.push({ tab: 'menus', kind: 'removed', label: leaf.label });
  }
  const owners: {
    tab: PermissionChangeTab;
    owner: string;
    object: PermissionObject;
  }[] = [
    ...objects.map((object) => ({
      tab: 'objects' as const,
      owner: object.label,
      object,
    })),
    ...settings.flatMap((page) =>
      page.objects.map((object) => ({
        tab: 'settings' as const,
        owner: page.label,
        object,
      })),
    ),
  ];
  for (const { tab, owner, object } of owners)
    for (const action of object.actions) {
      const old = before.grants[action.id];
      const next = after.grants[action.id];
      const kind = next
        ? old
          ? sameScopes(old.scopes, next.scopes)
            ? undefined
            : 'scope'
          : 'added'
        : old
          ? 'removed'
          : undefined;
      if (kind)
        changes.push({
          tab,
          kind,
          label: action.label,
          owner,
          // Taking a risky action away is never itself a risk.
          ...(action.risk && kind !== 'removed' ? { risk: action.risk } : {}),
        });
    }
  return changes;
}

function sameScopes(
  left: PermissionGrant['scopes'],
  right: PermissionGrant['scopes'],
): boolean {
  const a = left ?? {};
  const b = right ?? {};
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => a[key] === b[key])
  );
}
