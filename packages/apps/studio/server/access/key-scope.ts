/**
 * A credential's scope applied to permissions Studio derives on its own rather than through `authz.can`: the projects
 * plugin's `Permissions`, wherever Studio computes them from a user id (the CLI gateway, which knows the caller only by
 * id and the key's scope). Through a request's identity the same happens in `StudioAccess.grantsOf`
 * (`narrowedByScope`).
 */
import type { KeyScope } from '@nocobase/authorization/core';
import {
  BUSINESS_KEYS,
  SETTINGS_KEYS,
  levelActionsOf,
  type BusinessKey,
  type Permissions,
  type Scope,
  type SettingsKey,
} from '@nocobase/app-plugin-projects/shared/access';

import { businessResource } from './catalog.js';

/** The projects plugin's permissions, kept to what the scope covers: a business action at any of its levels. */
export function narrowedProjectPermissions(
  permissions: Permissions,
  scope: KeyScope,
): Permissions {
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
  return { scopes, settings };
}
