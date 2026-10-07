/**
 * The Apps an API key's scope may be limited to (the `releases.apps` permission group's records), in the shape of the
 * API keys plugin's `KeyScopeObjectSource`, without importing it: the application hands this to that plugin.
 */
import type { AuthorizationIdentity } from '@nocobase/authorization/core';

import type { Releases } from '../composition.js';
import { ReleasesError } from '../errors.js';

export interface ReleasesKeyScopeObjects {
  list(input: {
    readonly identity: AuthorizationIdentity;
    readonly search?: string;
    readonly ids?: readonly string[];
  }): Promise<readonly { id: string; title: string; description?: string }[]>;
}

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

/** Lists the Apps the identity may see, by name, for choosing which ones a key reaches. */
export function releasesKeyScopeObjects(
  releases: () => Releases,
): ReleasesKeyScopeObjects {
  return {
    async list({ identity, search, ids }) {
      // The chooser's own view of the Apps, never a scoped one: a key cannot pick records for another key.
      const { keyScope: _keyScope, ...person } = identity;
      const caller = await releases().callerOf(person);
      const wanted = ids ? new Set(ids) : null;
      const found: { id: string; title: string; description?: string }[] = [];
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        let result;
        try {
          result = await releases().releases.listApps(caller, {
            page,
            pageSize: PAGE_SIZE,
            ...(search?.trim() ? { search: search.trim() } : {}),
          });
        } catch (error) {
          if (
            error instanceof ReleasesError &&
            error.status === 'PERMISSION_DENIED'
          )
            return [];
          throw error;
        }
        for (const { app } of result.items)
          if (!wanted || wanted.has(app.id))
            found.push({
              id: app.id,
              title: app.name || app.id,
              ...(app.description ? { description: app.description } : {}),
            });
        if (page * PAGE_SIZE >= result.total) break;
      }
      return found;
    },
  };
}
