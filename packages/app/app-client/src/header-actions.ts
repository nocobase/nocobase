import type { ComponentType } from 'react';

import type { AppClientContributionSource } from './plugins.js';

const HEADER_ACTION_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;

/** How a badge asks for attention: `default` is a neutral count, `attention` something waiting on the viewer. */
export type AppClientBadgeTone = 'default' | 'attention';

/** A count shown beside a navigation entry or on a header action. A count of 0 shows nothing. */
export interface AppClientBadge {
  readonly count: number;
  readonly tone?: AppClientBadgeTone;
}

/**
 * A React hook returning a badge, or `undefined` for none. The application calls it while it renders the entry or the
 * action, inside the signed-in session: the layout remounts when the person changes, so the hook starts over for each
 * person. The hook owns its data — it requests and refreshes it itself, for example with a query and a realtime topic —
 * and never sends a request on every render.
 */
export type AppClientBadgeHook = () => AppClientBadge | undefined;

/** The count a badge shows: a positive whole number, or 0 when there is nothing to show. */
export function badgeCount(badge: AppClientBadge | undefined): number {
  const count = badge?.count;
  return typeof count === 'number' && Number.isFinite(count) && count > 0
    ? Math.floor(count)
    : 0;
}

/**
 * A button in the header's right-hand area, left of the account menu, such as an inbox or an assistant. The
 * application renders the component as it is, sized like the header's other buttons, and the badge on its corner.
 */
export interface AppClientHeaderActionDefinition {
  /**
   * The action's name, unique across the application and its plugins. The application hides or replaces an action by
   * it, so it is a contract like a route's name and never changes.
   */
  readonly name: string;
  /** Lower values appear further left; defaults to 0, with ties in registration order. */
  readonly order?: number;
  /** The button. It renders nothing when it has nothing to offer, such as a feature the viewer cannot use. */
  readonly component: ComponentType;
  /**
   * `required` (the default) shows it only to a signed-in person; `optional` also where the application renders a
   * header for signed-out visitors. `useHeaderActions({ signedIn })` applies it, so for a visitor a `required` action's
   * component never runs, and no action's badge hook does.
   */
  readonly auth?: 'required' | 'optional';
  /** The count on the button's corner. */
  readonly badge?: AppClientBadgeHook;
}

export interface AppClientRegisteredHeaderAction {
  readonly name: string;
  readonly order: number;
  readonly component: ComponentType;
  readonly auth: 'required' | 'optional';
  readonly badge?: AppClientBadgeHook;
  readonly packageName: string;
  readonly source: AppClientContributionSource;
}

/**
 * How the application changes a header action someone registered, named by `name`: `hidden` leaves it out, and
 * `component`, `order` or `badge` replace what the action declared. Like route component overrides, only the
 * application declares them, and naming an action nobody registers is an error.
 */
export type AppClientHeaderActionOverride =
  | { readonly name: string; readonly hidden: true }
  | {
      readonly name: string;
      readonly hidden?: false;
      readonly component?: ComponentType;
      readonly order?: number;
      readonly badge?: AppClientBadgeHook;
    };

export type AppClientHeaderActions<TOptions = void> =
  | readonly AppClientHeaderActionDefinition[]
  | ((options: TOptions) => readonly AppClientHeaderActionDefinition[]);

/** Checks and freezes header actions, for a plugin's or the application's `headerActions`. */
export function defineHeaderActions(
  actions: readonly AppClientHeaderActionDefinition[],
): readonly AppClientHeaderActionDefinition[] {
  return Object.freeze(
    actions.map((action) => {
      const name = normalizeHeaderActionName(action.name);
      if (
        typeof action.component !== 'function' &&
        !isExoticComponent(action.component)
      )
        throw new Error(`Header action "${name}" must define a component.`);
      if (
        action.auth !== undefined &&
        action.auth !== 'required' &&
        action.auth !== 'optional'
      )
        throw new Error(
          `Header action "${name}" auth must be "required" or "optional".`,
        );
      assertOrder(action.order, name);
      assertBadge(action.badge, name);
      return Object.freeze({ ...action, name });
    }),
  );
}

/** Checks and freezes the application's header action overrides. */
export function defineHeaderActionOverrides(
  overrides: readonly AppClientHeaderActionOverride[],
): readonly AppClientHeaderActionOverride[] {
  return Object.freeze(
    overrides.map((override) => {
      const name = normalizeHeaderActionName(override.name);
      if (override.hidden === true) {
        const {
          name: _name,
          hidden: _hidden,
          ...rest
        } = override as Record<string, unknown>;
        if (Object.keys(rest).length)
          throw new Error(
            `Header action override "${name}" cannot both hide the action and replace it.`,
          );
      } else {
        if (
          override.component !== undefined &&
          typeof override.component !== 'function' &&
          !isExoticComponent(override.component)
        )
          throw new Error(
            `Header action override "${name}" component must be a component.`,
          );
        assertOrder(override.order, name);
        assertBadge(override.badge, name);
      }
      return Object.freeze({ ...override, name });
    }),
  );
}

/**
 * The header actions of the application and its plugins, in header order: by `order`, ties in contribution order. A
 * name may be registered once.
 */
export function resolveHeaderActions(
  contributions: readonly {
    readonly packageName: string;
    readonly source: AppClientContributionSource;
    readonly headerActions?: readonly AppClientHeaderActionDefinition[];
  }[],
): readonly AppClientRegisteredHeaderAction[] {
  const byName = new Map<string, AppClientRegisteredHeaderAction>();
  for (const contribution of contributions)
    for (const action of defineHeaderActions(
      contribution.headerActions ?? [],
    )) {
      const previous = byName.get(action.name);
      if (previous)
        throw new Error(
          `Header action "${action.name}" from "${contribution.packageName}" is already registered by "${previous.packageName}".`,
        );
      byName.set(
        action.name,
        Object.freeze({
          name: action.name,
          order: action.order ?? 0,
          component: action.component,
          auth: action.auth ?? 'required',
          ...(action.badge ? { badge: action.badge } : {}),
          packageName: contribution.packageName,
          source: contribution.source,
        }),
      );
    }
  return sortHeaderActions([...byName.values()]);
}

/** Applies the application's overrides to the registered header actions and sorts the result again. */
export function applyHeaderActionOverrides(
  actions: readonly AppClientRegisteredHeaderAction[],
  overrides: readonly AppClientHeaderActionOverride[],
): readonly AppClientRegisteredHeaderAction[] {
  const byName = new Map(actions.map((action) => [action.name, action]));
  const seen = new Set<string>();
  for (const override of defineHeaderActionOverrides(overrides)) {
    if (seen.has(override.name))
      throw new Error(
        `Header action "${override.name}" is overridden more than once.`,
      );
    seen.add(override.name);
    const action = byName.get(override.name);
    if (!action)
      throw new Error(
        `Header action override references missing header action "${override.name}".`,
      );
    if (override.hidden === true) {
      byName.delete(override.name);
      continue;
    }
    byName.set(
      override.name,
      Object.freeze({
        ...action,
        ...(override.component ? { component: override.component } : {}),
        ...(override.order !== undefined ? { order: override.order } : {}),
        ...(override.badge ? { badge: override.badge } : {}),
      }),
    );
  }
  return sortHeaderActions(
    actions.flatMap((action) => byName.get(action.name) ?? []),
  );
}

function sortHeaderActions(
  actions: readonly AppClientRegisteredHeaderAction[],
): readonly AppClientRegisteredHeaderAction[] {
  // Array.prototype.sort is stable, so ties keep contribution order.
  return Object.freeze(
    [...actions].sort((left, right) => left.order - right.order),
  );
}

function normalizeHeaderActionName(name: unknown): string {
  const normalized = typeof name === 'string' ? name.trim() : '';
  if (!normalized)
    throw new Error('A header action must define a non-empty name.');
  if (!HEADER_ACTION_NAME_PATTERN.test(normalized))
    throw new Error(
      `Header action name "${normalized}" contains unsupported characters.`,
    );
  return normalized;
}

function assertOrder(order: unknown, name: string): void {
  if (
    order !== undefined &&
    (typeof order !== 'number' || !Number.isFinite(order))
  )
    throw new Error(`Header action "${name}" order must be a finite number.`);
}

function assertBadge(badge: unknown, name: string): void {
  if (badge !== undefined && typeof badge !== 'function')
    throw new Error(`Header action "${name}" badge must be a hook function.`);
}

/** `memo`, `forwardRef` and `lazy` components are objects rather than functions. */
function isExoticComponent(component: unknown): boolean {
  return (
    typeof component === 'object' &&
    component !== null &&
    '$$typeof' in component
  );
}
