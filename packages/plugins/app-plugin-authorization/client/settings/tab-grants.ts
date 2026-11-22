import type { PermissionGrant } from '../authorization-client.js';
import type { AuthorizationTabTarget } from './extensions.js';

/** The grants of `types`: what a permission tab declaring them edits. */
export function grantsOfTypes(
  grants: readonly PermissionGrant[],
  types: readonly string[] | undefined,
  ownsResource?: (resource: PermissionGrant['resource']) => boolean,
): readonly PermissionGrant[] {
  if (!types?.length) return [];
  return grants.filter(
    (grant) =>
      types.includes(grant.resource.type) &&
      (ownsResource?.(grant.resource) ?? true),
  );
}

/** `grants` with those of `types` replaced by `next`, as a permission tab changes them; the others stay. */
export function withTabGrants(
  grants: readonly PermissionGrant[],
  types: readonly string[] | undefined,
  next: readonly PermissionGrant[],
  ownsResource?: (resource: PermissionGrant['resource']) => boolean,
): readonly PermissionGrant[] {
  if (!types?.length) return grants;
  const owns = (grant: PermissionGrant) =>
    types.includes(grant.resource.type) &&
    (ownsResource?.(grant.resource) ?? true);
  return [
    ...grants.filter((grant) => !owns(grant)),
    ...next.filter((grant) => owns(grant) && grant.actions.length),
  ];
}

/**
 * The tabs that show for `target`: one declaring no targets shows for roles only, and one for API keys must also say
 * which resource types it edits, since a key's tab is part of its permissions.
 */
export function tabsFor<
  TTab extends {
    readonly targets?: readonly AuthorizationTabTarget[];
    readonly resourceTypes?: readonly string[];
  },
>(tabs: readonly TTab[], target: AuthorizationTabTarget): readonly TTab[] {
  return tabs.filter(
    (tab) =>
      (tab.targets ?? ['role']).includes(target) &&
      (target !== 'apiKey' || Boolean(tab.resourceTypes?.length)),
  );
}
