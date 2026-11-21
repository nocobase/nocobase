import type { DataChange } from '#hooks/use-data-changes';
import type { ManagedUser } from '@nocobase/app-plugin-users/client/user-client';

/** Everything about users; a write to one user names `users/<id>`. */
export const usersScope = 'users';
export const userScope = (id: string) => `${usersScope}/${id}`;

/** Announces a confirmed write to one user: the open views take `updated` at once, the rest read again. */
export function userChange(id: string, updated?: ManagedUser): DataChange {
  const scope = userScope(id);
  return {
    scopes: [scope],
    ...(updated ? { results: { [scope]: { data: updated } } } : {}),
  };
}
