/**
 * Rules of the permission editor, kept free of rendering so hosts and tests can apply them directly.
 *
 * An action is the only unit of authorization. A menu is visible when it is public or any of its actions is on. Data
 * scope is chosen once on the menu's View action; other actions follow it ("Same as view") unless they are set
 * narrower, never wider. Every function returns a new draft and never mutates its input.
 */
import type { ReactNode } from 'react';

export type PermissionRisk = 'sensitive' | 'high';

export interface PermissionScopeOption {
  readonly value: string;
  readonly label: string;
}

export interface PermissionScopeSlot {
  readonly id: string;
  /** Shown before the select when an action has several scopes, such as "Amount up to". */
  readonly label?: string | undefined;
  /** Ordered from the widest to the narrowest. A follower slot may omit them and reuse the View options. */
  readonly options?: readonly PermissionScopeOption[] | undefined;
  /** The value an enabled action uses before anyone picks one. Defaults to the first option. */
  readonly defaultValue?: string | undefined;
  /**
   * Follows the View scope of the same menu: unset means "Same as view", and only narrower options are offered. An
   * action id follows the first scope of that action instead, such as the View of a second resource on the menu.
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
  /** The menu's View action: listed first and owns the menu's data scope. */
  readonly view?: boolean | undefined;
  /** A business operation, listed after the basic ones below a thin divider. */
  readonly business?: boolean | undefined;
  readonly scopes?: readonly PermissionScopeSlot[] | undefined;
  /** Actions that must be on for this one to work. Defaults to the menu's View action. */
  readonly requires?: readonly string[] | undefined;
  /** Risky actions are never turned on by Enable all or as a dependency. */
  readonly risk?: PermissionRisk | undefined;
  /** Managed by the application: shown but not editable. */
  readonly managed?: boolean | undefined;
}

export interface PermissionMenu {
  readonly id: string;
  readonly label: string;
  readonly description?: string | undefined;
  /** A subheading inside the module, such as "Access control" under Settings. */
  readonly group?: string | undefined;
  /** Every signed-in user can open it; there is nothing to set. The string explains why. */
  readonly public?: boolean | string | undefined;
  readonly actions: readonly PermissionAction[];
  /** A notice under the action list, such as a warning about granting access to others. */
  readonly notice?: ReactNode;
}

export interface PermissionModule {
  readonly id: string;
  readonly label: string;
  /** Listed under the Administration heading at the bottom of the menu tree. */
  readonly administration?: boolean | undefined;
  readonly menus: readonly PermissionMenu[];
}

export interface PermissionGrant {
  /** Chosen values by scope slot id. A follower slot without a value is "Same as view". */
  readonly scopes?: Readonly<Record<string, string>> | undefined;
}

/** The draft: an action id is present exactly when the action is on. */
export type PermissionGrants = Readonly<Record<string, PermissionGrant>>;

export type PermissionMenuState = 'public' | 'full' | 'partial' | 'off';

export interface PermissionMenuStatus {
  readonly state: PermissionMenuState;
  readonly enabled: number;
  readonly total: number;
}

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

export function allMenus(
  modules: readonly PermissionModule[],
): readonly PermissionMenu[] {
  return modules.flatMap((module) => module.menus);
}

export function viewActionOf(
  menu: PermissionMenu,
): PermissionAction | undefined {
  return menu.actions.find((action) => action.view);
}

/** View first, then basic actions, then business actions, keeping the caller's order within each. */
export function orderedActions(menu: PermissionMenu): {
  readonly basic: readonly PermissionAction[];
  readonly business: readonly PermissionAction[];
} {
  const view = menu.actions.filter((action) => action.view);
  return {
    basic: [
      ...view,
      ...menu.actions.filter((action) => !action.view && !action.business),
    ],
    business: menu.actions.filter((action) => !action.view && action.business),
  };
}

function findAction(
  modules: readonly PermissionModule[],
  id: string,
):
  | { readonly menu: PermissionMenu; readonly action: PermissionAction }
  | undefined {
  for (const menu of allMenus(modules)) {
    const action = menu.actions.find((item) => item.id === id);
    if (action) return { menu, action };
  }
  return undefined;
}

export function requirementsOf(
  menu: PermissionMenu,
  action: PermissionAction,
): readonly string[] {
  if (action.requires) return action.requires;
  const view = viewActionOf(menu);
  return view && view.id !== action.id ? [view.id] : [];
}

function viewSlotOf(menu: PermissionMenu): PermissionScopeSlot | undefined {
  return viewActionOf(menu)?.scopes?.[0];
}

/** The action and slot a follower follows: the menu's View, or the action its `followsView` names. */
function leaderOf(
  menu: PermissionMenu,
  slot: PermissionScopeSlot | undefined,
): { action: PermissionAction; slot: PermissionScopeSlot } | undefined {
  if (slot && !slot.followsView) return undefined;
  const action =
    typeof slot?.followsView === 'string'
      ? menu.actions.find((item) => item.id === slot.followsView)
      : viewActionOf(menu);
  const leader = action?.scopes?.[0];
  return action && leader && leader !== slot
    ? { action, slot: leader }
    : undefined;
}

export function slotOptions(
  menu: PermissionMenu,
  slot: PermissionScopeSlot,
): readonly PermissionScopeOption[] {
  if (slot.followsView && !slot.options?.length)
    return leaderOf(menu, slot)?.slot.options ?? [];
  return slot.options ?? [];
}

/** The value a slot has, the default for one nobody picked yet. Undefined for a follower that follows View. */
export function ownScopeValue(
  menu: PermissionMenu,
  grants: PermissionGrants,
  action: PermissionAction,
  slot: PermissionScopeSlot,
): string | undefined {
  const value = grants[action.id]?.scopes?.[slot.id];
  if (value !== undefined) return value;
  if (slot.followsView && leaderOf(menu, slot)) return undefined;
  return slot.defaultValue ?? slotOptions(menu, slot)[0]?.value;
}

/**
 * The current value of the scope a follower slot follows; the menu's View scope without a slot. Undefined when there
 * is no scoped leader.
 */
export function viewScopeValue(
  menu: PermissionMenu,
  grants: PermissionGrants,
  slot?: PermissionScopeSlot,
): string | undefined {
  const view = viewActionOf(menu);
  const viewSlot = view?.scopes?.[0];
  const leader = slot
    ? leaderOf(menu, slot)
    : view && viewSlot
      ? { action: view, slot: viewSlot }
      : undefined;
  return leader
    ? ownScopeValue(menu, grants, leader.action, leader.slot)
    : undefined;
}

/** The scope that actually applies to an action slot, resolving "Same as view". */
export function effectiveScopeValue(
  menu: PermissionMenu,
  grants: PermissionGrants,
  action: PermissionAction,
  slot: PermissionScopeSlot,
): string | undefined {
  return (
    ownScopeValue(menu, grants, action, slot) ??
    (slot.followsView ? viewScopeValue(menu, grants, slot) : undefined)
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

/** The label of the scope a follower follows; the menu's View scope without a slot. For "Same as view (X)". */
export function viewScopeLabel(
  menu: PermissionMenu,
  grants: PermissionGrants,
  slot?: PermissionScopeSlot,
): string | undefined {
  const value = viewScopeValue(menu, grants, slot);
  if (value === undefined) return undefined;
  const leader = slot ? leaderOf(menu, slot)?.slot : viewSlotOf(menu);
  return (
    leader?.options?.find((option) => option.value === value)?.label ?? value
  );
}

/**
 * Options of a follower that are provably narrower than the scope it follows, offered besides "Same as view". Both
 * sides are judged by the leader's options; an option the leader does not list is never offered.
 */
export function narrowerOptions(
  menu: PermissionMenu,
  grants: PermissionGrants,
  slot: PermissionScopeSlot,
): readonly PermissionScopeOption[] {
  const leader = leaderOf(menu, slot);
  const current = viewScopeValue(menu, grants, slot);
  if (!leader || current === undefined) return [];
  return slotOptions(menu, slot).filter((option) =>
    isNarrower(leader.slot, option.value, current),
  );
}

export function menuStatus(
  menu: PermissionMenu,
  grants: PermissionGrants,
): PermissionMenuStatus {
  const total = menu.actions.length;
  const enabled = menu.actions.filter((action) => grants[action.id]).length;
  const state: PermissionMenuState = menu.public
    ? 'public'
    : enabled === 0
      ? 'off'
      : enabled === total
        ? 'full'
        : 'partial';
  return { state, enabled, total };
}

export function isMenuVisible(
  menu: PermissionMenu,
  grants: PermissionGrants,
): boolean {
  return (
    Boolean(menu.public) || menu.actions.some((action) => grants[action.id])
  );
}

/** Menus that need a permission, and how many of them this draft opens. Public menus are left out. */
export function visibleMenuCount(
  modules: readonly PermissionModule[],
  grants: PermissionGrants,
): { readonly visible: number; readonly total: number } {
  const menus = allMenus(modules).filter((menu) => !menu.public);
  return {
    visible: menus.filter((menu) => isMenuVisible(menu, grants)).length,
    total: menus.length,
  };
}

/** The next menu with something to set, in tree order, for the "Next" button. */
export function nextMenu(
  modules: readonly PermissionModule[],
  menuId: string,
): PermissionMenu | undefined {
  // Business menus lead only to business menus: the last one stops instead of jumping into Administration.
  const owner = modules.find((module) =>
    module.menus.some((menu) => menu.id === menuId),
  );
  const menus = modules
    .filter((module) => !!module.administration === !!owner?.administration)
    .flatMap((module) => module.menus);
  const index = menus.findIndex((menu) => menu.id === menuId);
  return menus
    .slice(index + 1)
    .find((menu) => !menu.public && menu.actions.length > 0);
}

/** Modules with only the menus whose module, group, menu or action names or descriptions match. */
export function filterModules(
  modules: readonly PermissionModule[],
  query: string,
): readonly PermissionModule[] {
  const search = query.trim().toLocaleLowerCase();
  if (!search) return modules;
  const matches = (value: string | undefined): boolean =>
    Boolean(value?.toLocaleLowerCase().includes(search));
  return modules
    .map((module) => ({
      ...module,
      menus: matches(module.label)
        ? module.menus
        : module.menus.filter(
            (menu) =>
              matches(menu.label) ||
              matches(menu.group) ||
              matches(menu.description) ||
              menu.actions.some(
                (action) =>
                  matches(action.label) || matches(action.description),
              ),
          ),
    }))
    .filter((module) => module.menus.length > 0);
}

function labelsOf(
  modules: readonly PermissionModule[],
  ids: Iterable<string>,
): string[] {
  return [...ids].map((id) => findAction(modules, id)?.action.label ?? id);
}

/**
 * Enabled actions that require these ones, directly or not. Those managed by the application cannot be turned off,
 * so their presence blocks turning these off.
 */
export function dependentsOf(
  modules: readonly PermissionModule[],
  grants: PermissionGrants,
  ids: readonly string[],
): readonly PermissionAction[] {
  const off = new Set(ids);
  const result: PermissionAction[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const menu of allMenus(modules))
      for (const action of menu.actions) {
        if (off.has(action.id) || !grants[action.id]) continue;
        if (requirementsOf(menu, action).some((id) => off.has(id))) {
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
  modules: readonly PermissionModule[],
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
    const found = findAction(modules, current);
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
    queue.push(...requirementsOf(found.menu, found.action));
  }
  return { enable, risky, managed };
}

/** Turn each action on with its requirements, or leave it off when one of them cannot be turned on automatically. */
function enableWithRequirements(
  modules: readonly PermissionModule[],
  grants: PermissionGrants,
  ids: readonly string[],
): PermissionChange {
  let next: PermissionGrants = grants;
  const explicit = new Set(ids);
  const auto: string[] = [];
  const notices: PermissionNotice[] = [];
  for (const id of ids) {
    const found = findAction(modules, id);
    if (!found || found.action.managed || next[id]) continue;
    const { enable, risky, managed } = requirementClosure(modules, next, id);
    if (risky.length || managed.length) {
      notices.push({
        kind: 'missing-requirement',
        action: found.action.label,
        actions: labelsOf(modules, risky),
        managed: labelsOf(modules, managed),
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
    notices.unshift({ kind: 'auto-enabled', actions: labelsOf(modules, auto) });
  return { grants: next, notices };
}

function managedBlock(
  modules: readonly PermissionModule[],
  grants: PermissionGrants,
  ids: readonly string[],
): PermissionChange | undefined {
  const managed = dependentsOf(modules, grants, ids).filter(
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
  modules: readonly PermissionModule[],
  grants: PermissionGrants,
  id: string,
  enabled: boolean,
): PermissionChange {
  if (findAction(modules, id)?.action.managed) return { grants, notices: [] };
  if (enabled) return enableWithRequirements(modules, grants, [id]);
  const blocked = managedBlock(modules, grants, [id]);
  if (blocked) return blocked;
  const dependents = dependentsOf(modules, grants, [id]);
  return {
    grants: withoutActions(grants, [id, ...dependents.map((item) => item.id)]),
    notices: [],
  };
}

export type PermissionQuickSet = 'all' | 'view' | 'none';

/** What a quick button would turn off, including actions in other menus that require them. */
export function quickSetRemovals(
  modules: readonly PermissionModule[],
  grants: PermissionGrants,
  menu: PermissionMenu,
  mode: PermissionQuickSet,
): {
  readonly own: readonly string[];
  readonly others: readonly PermissionAction[];
} {
  if (mode === 'all') return { own: [], others: [] };
  const keep = mode === 'view' ? viewActionOf(menu)?.id : undefined;
  const own = menu.actions
    .filter(
      (action) => action.id !== keep && !action.managed && grants[action.id],
    )
    .map((action) => action.id);
  const inMenu = new Set(menu.actions.map((action) => action.id));
  return {
    own,
    others: dependentsOf(modules, grants, own).filter(
      (action) => !inMenu.has(action.id) && !action.managed,
    ),
  };
}

/** Enable all (risky ones excepted), View only, or Disable all for one menu. */
export function applyQuickSet(
  modules: readonly PermissionModule[],
  grants: PermissionGrants,
  menu: PermissionMenu,
  mode: PermissionQuickSet,
): PermissionChange {
  if (mode === 'all') {
    const ids = menu.actions
      .filter((action) => !action.risk && !action.managed)
      .map((action) => action.id);
    return enableWithRequirements(modules, grants, ids);
  }
  const { own, others } = quickSetRemovals(modules, grants, menu, mode);
  const blocked = managedBlock(modules, grants, own);
  if (blocked) return blocked;
  const removed = withoutActions(grants, [
    ...own,
    ...others.map((action) => action.id),
  ]);
  const view = viewActionOf(menu);
  if (mode === 'view' && view && !view.managed && !removed[view.id])
    return enableWithRequirements(modules, removed, [view.id]);
  return { grants: removed, notices: [] };
}

/**
 * Pick a scope value. Undefined on a follower means "Same as view". Narrowing View sends followers that were wider
 * than the new View scope back to "Same as view" and reports them.
 */
export function setScopeValue(
  modules: readonly PermissionModule[],
  grants: PermissionGrants,
  actionId: string,
  slotId: string,
  value: string | undefined,
): PermissionChange {
  const found = findAction(modules, actionId);
  const grant = grants[actionId];
  if (!found || !grant || found.action.managed) return { grants, notices: [] };
  const { menu, action } = found;
  const slot = action.scopes?.find((item) => item.id === slotId);
  // A follower is never wider than what it follows, and one equal to it simply follows it.
  const chosen =
    value !== undefined &&
    slot &&
    leaderOf(menu, slot) &&
    !narrowerOptions(menu, grants, slot).some(
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
  for (const other of menu.actions) {
    const otherGrant = next[other.id];
    if (other.id === actionId || !otherGrant?.scopes) continue;
    const otherScopes: Record<string, string> = { ...otherGrant.scopes };
    let changed = false;
    let wider = false;
    for (const follower of other.scopes ?? []) {
      const own = otherScopes[follower.id];
      const leader = leaderOf(menu, follower);
      if (
        own === undefined ||
        leader?.action.id !== actionId ||
        leader.slot.id !== slotId
      )
        continue;
      const current = viewScopeValue(menu, next, follower);
      // A value the leader lists and that is not provably narrower goes back to following it. One equal to the
      // leader follows it quietly: nothing the user chose is lost. An unlisted value is kept as stored.
      if (
        current === undefined ||
        !listed(leader.slot, own) ||
        isNarrower(leader.slot, own, current)
      )
        continue;
      delete otherScopes[follower.id];
      changed = true;
      if (own !== current) {
        wider = true;
        leaderLabel = viewScopeLabel(menu, next, follower) ?? current;
      }
    }
    if (changed) next[other.id] = { ...otherGrant, scopes: otherScopes };
    if (wider) reset.push(other.label);
  }
  return {
    grants: next,
    notices: reset.length
      ? [{ kind: 'scope-reset', view: leaderLabel, actions: reset }]
      : [],
  };
}
