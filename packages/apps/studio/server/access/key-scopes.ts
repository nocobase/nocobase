/**
 * The permission groups an API key's scope is made of, assembled from every plugin Studio joins. Each plugin declares
 * its groups as data in its `shared/access`; Studio adds its own (members and roles, reports), maps every permission to
 * what it is checked as and hands the record sources of the groups limited to some records to the API keys plugin. A
 * business action (`{ kind: 'business', id: 'pm.issues', action: 'edit' }`) is checked on its plugin's resource type
 * at every level it was registered at (`edit.related`, `edit.all`, from the catalog): holding any is holding it, and a
 * scope covering it allows each.
 */
import type {
  AccessMapping,
  ApiKeyScopes,
  KeyScopeObjectSource,
} from '@nocobase/app-plugin-api-keys/server';

import { businessResource, type Catalog } from './catalog.js';
import {
  STUDIO_KEY_SCOPE_GROUPS,
  KEY_SCOPE_DECLARATIONS,
  READ_ONLY_PRESET,
} from './key-scope-groups.js';

/** How a declared permission is checked: pages and settings as the authorization plugin names them, businesses on their plugin's type. */
export function studioAccessMapping(catalog: () => Catalog): AccessMapping {
  return (ref) => {
    if (ref.kind === 'page')
      return { resource: { type: 'page', id: ref.id }, action: 'access' };
    if (ref.kind === 'settings')
      return { resource: { type: 'settings', id: ref.id }, action: ref.action };
    const action = catalog().action(`${ref.id}/${ref.action}`);
    return action
      ? {
          resource: businessResource(ref.id),
          actions: action.levels.map((level) => level.action),
        }
      : null;
  };
}

/** Registers every group and preset; returns what removes them. */
export function registerStudioKeyScopes(
  scopes: ApiKeyScopes,
  objects: Readonly<Record<string, KeyScopeObjectSource | undefined>>,
  catalog: () => Catalog,
): () => void {
  scopes.mapAccess(studioAccessMapping(catalog));
  const releases: (() => void)[] = [];
  for (const declaration of KEY_SCOPE_DECLARATIONS) {
    for (const group of declaration.groups)
      releases.push(
        scopes.groups.add(
          group,
          group.objects ? objects[group.objects.business] : undefined,
        ),
      );
    for (const preset of declaration.presets ?? [])
      releases.push(scopes.presets.add(preset));
  }
  releases.push(scopes.presets.add(READ_ONLY_PRESET));
  return () => {
    for (const release of releases.splice(0).reverse()) release();
  };
}

export { STUDIO_KEY_SCOPE_GROUPS };
