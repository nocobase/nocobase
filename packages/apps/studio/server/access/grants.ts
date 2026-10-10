/**
 * A role in business terms (`shared/access.ts`) and the grants of the permission set that keeps it, over the catalog
 * the plugins registered (`catalog.ts`):
 *
 * - each page it opens is a `page` grant with the action `access`;
 * - each settings capability it holds is an action of its `settings` item;
 * - each business action it holds is the action of its level on the plugin's resource type: `edit` at `related` on
 *   `pm.issues` is `{ resource: { type: 'pm', id: 'pm.issues' }, actions: [{ action: 'edit.related' }] }`. The
 *   authorization plugin checks it like any other grant, so the permissions snapshot, the client's `useCan` and a
 *   scoped key's `allows` see every level; Studio takes the highest one held and resolves it for each caller
 *   (`scope-levels.ts`).
 *
 * A grant with a policy is not read: the authorization plugin permits only policy-less grants of these types, and Studio
 * reads what it permits.
 */
import type { KeyScope } from '@nocobase/authorization/core';

import { wider, type Level } from '../../shared/access.js';
import { PAGES, type Page } from '../../shared/pages.js';
import type { Catalog } from './catalog.js';

export interface GrantAction {
  readonly action: string;
  readonly policy?: { readonly type: string; readonly [key: string]: unknown };
}

export interface Grant {
  readonly resource: { readonly type: string; readonly id: string };
  readonly actions: readonly GrantAction[];
}

export interface RoleGrants {
  readonly pages: readonly Page[];
  /** Every settings capability of the catalog, on or off. */
  readonly settings: Readonly<Record<string, boolean>>;
  /** Every business action of the catalog at its level. */
  readonly abilities: Readonly<Record<string, Level>>;
}

function matches(granted: string, id: string): boolean {
  return granted === '*' || granted === id;
}

/** Every business action at `none`, the start of a new role. */
export function noAbilities(catalog: Catalog): Record<string, Level> {
  return Object.fromEntries(catalog.businessKeys.map((key) => [key, 'none']));
}

/** Every settings capability off. */
export function noSettings(catalog: Catalog): Record<string, boolean> {
  return Object.fromEntries(catalog.settingsKeys.map((key) => [key, false]));
}

/** What a role's grants give, business by business; anything the catalog does not offer is ignored. */
export function roleOf(grants: readonly Grant[], catalog: Catalog): RoleGrants {
  const pages = new Set<Page>();
  const settings = noSettings(catalog);
  const abilities = noAbilities(catalog);
  for (const grant of grants) {
    const { type, id } = grant.resource;
    for (const granted of grant.actions) {
      if (granted.policy !== undefined) continue;
      if (type === 'page' && granted.action === 'access')
        for (const page of PAGES) if (matches(id, page)) pages.add(page);
      if (type === 'settings')
        for (const item of catalog.settings)
          if (matches(id, item.id))
            for (const action of item.actions)
              if (action.name === granted.action) settings[action.key] = true;
      if (catalog.isBusinessType(type))
        for (const business of catalog.businesses)
          if (business.type === type && matches(id, business.id)) {
            const held = catalog.grantOf(
              { type, id: business.id },
              granted.action,
            );
            if (held)
              abilities[held.key] = wider(
                abilities[held.key] ?? 'none',
                held.level,
              );
          }
    }
  }
  return {
    pages: PAGES.filter((page) => pages.has(page)),
    settings,
    abilities,
  };
}

/** The grants that keep a role. */
export function grantsOf(role: RoleGrants, catalog: Catalog): Grant[] {
  const grants: Grant[] = role.pages.map((id) => ({
    resource: { type: 'page', id },
    actions: [{ action: 'access' }],
  }));
  for (const item of catalog.settings) {
    const actions = item.actions
      .filter((action) => role.settings[action.key])
      .map(({ name }) => ({ action: name }));
    if (actions.length > 0)
      grants.push({ resource: { type: 'settings', id: item.id }, actions });
  }
  for (const business of catalog.businesses) {
    const actions: GrantAction[] = business.actions.flatMap((action) => {
      const level = role.abilities[action.key] ?? 'none';
      const granted = action.levels.find((entry) => entry.level === level);
      return granted ? [{ action: granted.action }] : [];
    });
    if (actions.length > 0)
      grants.push({
        resource: { type: business.type, id: business.id },
        actions,
      });
  }
  return grants;
}

/** Everything, as a holder of the superuser set gets it. */
export function everything(catalog: Catalog): RoleGrants {
  return {
    pages: [...PAGES],
    settings: Object.fromEntries(
      catalog.settingsKeys.map((key) => [key, true]),
    ),
    abilities: Object.fromEntries(
      catalog.businessKeys.map((key) => [
        key,
        catalog.levelsOf(key).at(-1) ?? 'none',
      ]),
    ),
  };
}

/** The union of several roles: every page and capability any of them has, each action at its widest. */
export function combined(
  roles: readonly RoleGrants[],
  catalog: Catalog,
): RoleGrants {
  return roleOf(
    roles.flatMap((role) => grantsOf(role, catalog)),
    catalog,
  );
}

/**
 * What a role gives, kept to what a credential's scope covers (a scoped API key, a service account's key, an agent's
 * run): a page or settings capability the scope does not cover is off, and a business action reaches at most the
 * highest of its levels the scope covers. The scope never adds anything. Every permission Studio derives from roles for
 * a request goes through this (`StudioAccess.grantsOf`), as the authorization plugin's `can` does for its own checks.
 */
export function narrowedByScope(
  role: RoleGrants,
  scope: KeyScope,
  catalog: Catalog,
): RoleGrants {
  const settings = noSettings(catalog);
  for (const item of catalog.settings)
    for (const action of item.actions)
      settings[action.key] =
        role.settings[action.key] === true &&
        scope.allows({ type: 'settings', id: item.id }, action.name);
  const abilities = noAbilities(catalog);
  for (const business of catalog.businesses)
    for (const action of business.actions) {
      const held = role.abilities[action.key] ?? 'none';
      let reach: Level = 'none';
      for (const { level, action: name } of action.levels)
        if (
          wider(level, held) === held &&
          scope.allows({ type: business.type, id: business.id }, name)
        )
          reach = wider(reach, level);
      abilities[action.key] = reach;
    }
  return {
    pages: role.pages.filter((page) =>
      scope.allows({ type: 'page', id: page }, 'access'),
    ),
    settings,
    abilities,
  };
}
